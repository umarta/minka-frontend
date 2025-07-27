import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Agent, 
  AgentFilters, 
  CreateAgentData, 
  UpdateAgentData,
  AgentPerformanceMetrics,
  AgentActivity,
  PaginatedAgentResponse 
} from '@/types/agent';
import { mockAgentApi } from '@/lib/mocks/agent-api';
import { getWebSocketManager } from '@/lib/websocket';

interface AgentState {
  // Data
  agents: Agent[];
  selectedAgent: Agent | null;
  agentPerformance: Record<number, AgentPerformanceMetrics[]>; // agentId -> metrics
  agentActivity: Record<number, AgentActivity[]>; // agentId -> activities
  
  // Pagination & Filtering
  currentPage: number;
  totalPages: number;
  totalAgents: number;
  filters: AgentFilters;
  searchQuery: string;
  
  // UI State
  isLoading: boolean;
  isLoadingDetails: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Bulk Operations
  selectedAgentIds: number[];
  isBulkProcessing: boolean;
  
  // Real-time status
  onlineAgents: Set<number>;
  recentActivity: AgentActivity[];
  
  // Statistics
  stats: {
    total: number;
    active: number;
    online: number;
    offline: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  } | null;
}

interface AgentActions {
  // Data fetching
  loadAgents: (filters?: AgentFilters) => Promise<void>;
  loadAgentById: (id: number) => Promise<void>;
  loadAgentPerformance: (id: number, dateRange?: { from: string; to: string }) => Promise<void>;
  loadAgentActivity: (id: number, days?: number) => Promise<void>;
  loadStats: () => Promise<void>;
  
  // CRUD operations
  createAgent: (data: CreateAgentData) => Promise<Agent>;
  updateAgent: (id: number, data: UpdateAgentData) => Promise<Agent>;
  deleteAgent: (id: number) => Promise<void>;
  updateAgentStatus: (id: number, status: 'online' | 'offline' | 'away' | 'busy') => Promise<void>;
  
  // Bulk operations
  selectAgent: (id: number) => void;
  selectAllAgents: () => void;
  clearSelection: () => void;
  bulkUpdateAgents: (updates: Partial<UpdateAgentData>) => Promise<void>;
  
  // Search & Filtering
  setFilters: (filters: Partial<AgentFilters>) => void;
  setSearchQuery: (query: string) => void;
  searchAgents: (query: string) => Promise<void>;
  clearFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // UI State
  setSelectedAgent: (agent: Agent | null) => void;
  clearError: () => void;
  
  // Real-time updates
  handleAgentOnline: (agentId: number) => void;
  handleAgentOffline: (agentId: number) => void;
  handleAgentStatusChange: (agentId: number, status: string) => void;
  handleAgentActivity: (activity: AgentActivity) => void;
  
  // Utility
  getAgentById: (id: number) => Agent | undefined;
  getOnlineAgents: () => Agent[];
  getAgentsByRole: (role: 'admin' | 'cs' | 'viewer') => Agent[];
  getAgentsByDepartment: (department: string) => Agent[];
}

type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    agents: [],
    selectedAgent: null,
    agentPerformance: {},
    agentActivity: {},
    currentPage: 1,
    totalPages: 1,
    totalAgents: 0,
    filters: {},
    searchQuery: '',
    isLoading: false,
    isLoadingDetails: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    selectedAgentIds: [],
    isBulkProcessing: false,
    onlineAgents: new Set(),
    recentActivity: [],
    stats: null,

    // Actions
    loadAgents: async (filters = {}) => {
      set({ isLoading: true, error: null });
      try {
        const currentFilters = { ...get().filters, ...filters };
        const response = await mockAgentApi.getAll(currentFilters);
        
        set({
          agents: response.data,
          totalAgents: response.meta.total,
          totalPages: response.meta.totalPages,
          currentPage: response.meta.page,
          filters: currentFilters,
          isLoading: false,
        });
        
        // Update online agents set
        const onlineAgents = new Set(
          response.data
            .filter(agent => agent.onlineStatus === 'online')
            .map(agent => agent.id)
        );
        set({ onlineAgents });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load agents',
          isLoading: false,
        });
      }
    },

    loadAgentById: async (id: number) => {
      set({ isLoadingDetails: true, error: null });
      try {
        const agent = await mockAgentApi.getById(id);
        set({
          selectedAgent: agent,
          isLoadingDetails: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load agent details',
          isLoadingDetails: false,
        });
      }
    },

    loadAgentPerformance: async (id: number, dateRange) => {
      try {
        const performance = await mockAgentApi.getPerformance(id, dateRange);
        set((state) => ({
          agentPerformance: {
            ...state.agentPerformance,
            [id]: performance,
          },
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load performance data',
        });
      }
    },

    loadAgentActivity: async (id: number, days = 7) => {
      try {
        const activity = await mockAgentApi.getActivity(id, days);
        set((state) => ({
          agentActivity: {
            ...state.agentActivity,
            [id]: activity,
          },
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load activity data',
        });
      }
    },

    loadStats: async () => {
      try {
        const stats = await mockAgentApi.getStats();
        set({ stats });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load statistics',
        });
      }
    },

    createAgent: async (data: CreateAgentData) => {
      set({ isCreating: true, error: null });
      try {
        const newAgent = await mockAgentApi.create(data);
        
        // Add to current agents list
        set((state) => ({
          agents: [newAgent, ...state.agents],
          totalAgents: state.totalAgents + 1,
          isCreating: false,
        }));
        
        return newAgent;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create agent',
          isCreating: false,
        });
        throw error;
      }
    },

    updateAgent: async (id: number, data: UpdateAgentData) => {
      set({ isUpdating: true, error: null });
      try {
        const updatedAgent = await mockAgentApi.update(id, data);
        
        // Update in agents list
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === id ? updatedAgent : agent
          ),
          selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
          isUpdating: false,
        }));
        
        return updatedAgent;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update agent',
          isUpdating: false,
        });
        throw error;
      }
    },

    deleteAgent: async (id: number) => {
      set({ isDeleting: true, error: null });
      try {
        await mockAgentApi.delete(id);
        
        // Remove from agents list (or mark as inactive)
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === id ? { ...agent, isActive: false, onlineStatus: 'offline' as const } : agent
          ),
          selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
          isDeleting: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete agent',
          isDeleting: false,
        });
        throw error;
      }
    },

    updateAgentStatus: async (id: number, status: 'online' | 'offline' | 'away' | 'busy') => {
      try {
        const updatedAgent = await mockAgentApi.updateStatus(id, status);
        
        // Update in agents list
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === id ? updatedAgent : agent
          ),
          selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
        }));
        
        // Update online agents set
        set((state) => {
          const newOnlineAgents = new Set(state.onlineAgents);
          if (status === 'online') {
            newOnlineAgents.add(id);
          } else {
            newOnlineAgents.delete(id);
          }
          return { onlineAgents: newOnlineAgents };
        });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update agent status',
        });
      }
    },

    // Bulk operations
    selectAgent: (id: number) => {
      set((state) => ({
        selectedAgentIds: state.selectedAgentIds.includes(id)
          ? state.selectedAgentIds.filter(agentId => agentId !== id)
          : [...state.selectedAgentIds, id],
      }));
    },

    selectAllAgents: () => {
      set((state) => ({
        selectedAgentIds: state.agents.map(agent => agent.id),
      }));
    },

    clearSelection: () => {
      set({ selectedAgentIds: [] });
    },

    bulkUpdateAgents: async (updates: Partial<UpdateAgentData>) => {
      const { selectedAgentIds } = get();
      set({ isBulkProcessing: true, error: null });
      
      try {
        const result = await mockAgentApi.bulkUpdate(selectedAgentIds, updates);
        
        if (result.success) {
          // Reload agents to get updated data
          await get().loadAgents();
          set({ selectedAgentIds: [], isBulkProcessing: false });
        } else {
          set({
            error: `Bulk update completed with errors: ${result.errors.join(', ')}`,
            isBulkProcessing: false,
          });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Bulk update failed',
          isBulkProcessing: false,
        });
      }
    },

    // Search & Filtering
    setFilters: (filters: Partial<AgentFilters>) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
        currentPage: 1, // Reset to first page when filtering
      }));
      // Reload with new filters
      get().loadAgents();
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    searchAgents: async (query: string) => {
      set({ isLoading: true, error: null, searchQuery: query });
      try {
        const response = await mockAgentApi.search(query, get().filters);
        set({
          agents: response.data,
          totalAgents: response.meta.total,
          totalPages: response.meta.totalPages,
          currentPage: response.meta.page,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Search failed',
          isLoading: false,
        });
      }
    },

    clearFilters: () => {
      set({
        filters: {},
        searchQuery: '',
        currentPage: 1,
      });
      get().loadAgents();
    },

    // Pagination
    setPage: (page: number) => {
      set({ currentPage: page });
      get().loadAgents({ ...get().filters, page });
    },

    nextPage: () => {
      const { currentPage, totalPages } = get();
      if (currentPage < totalPages) {
        get().setPage(currentPage + 1);
      }
    },

    previousPage: () => {
      const { currentPage } = get();
      if (currentPage > 1) {
        get().setPage(currentPage - 1);
      }
    },

    // UI State
    setSelectedAgent: (agent: Agent | null) => {
      set({ selectedAgent: agent });
    },

    clearError: () => {
      set({ error: null });
    },

    // Real-time updates
    handleAgentOnline: (agentId: number) => {
      set((state) => ({
        onlineAgents: new Set([...state.onlineAgents, agentId]),
        agents: state.agents.map(agent =>
          agent.id === agentId
            ? { ...agent, onlineStatus: 'online', lastSeen: new Date().toISOString() }
            : agent
        ),
      }));
    },

    handleAgentOffline: (agentId: number) => {
      set((state) => {
        const newOnlineAgents = new Set(state.onlineAgents);
        newOnlineAgents.delete(agentId);
        return {
          onlineAgents: newOnlineAgents,
          agents: state.agents.map(agent =>
            agent.id === agentId
              ? { ...agent, onlineStatus: 'offline', lastSeen: new Date().toISOString() }
              : agent
          ),
        };
      });
    },

    handleAgentStatusChange: (agentId: number, status: string) => {
      set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === agentId
            ? { ...agent, onlineStatus: status as any, lastSeen: new Date().toISOString() }
            : agent
        ),
      }));
    },

    handleAgentActivity: (activity: AgentActivity) => {
      set((state) => ({
        recentActivity: [activity, ...state.recentActivity.slice(0, 49)], // Keep last 50 activities
        agentActivity: {
          ...state.agentActivity,
          [activity.agentId]: [
            activity,
            ...(state.agentActivity[activity.agentId] || []).slice(0, 99)
          ], // Keep last 100 activities per agent
        },
      }));
    },

    // Utility functions
    getAgentById: (id: number) => {
      return get().agents.find(agent => agent.id === id);
    },

    getOnlineAgents: () => {
      return get().agents.filter(agent => agent.onlineStatus === 'online');
    },

    getAgentsByRole: (role: 'admin' | 'cs' | 'viewer') => {
      return get().agents.filter(agent => agent.role === role);
    },

    getAgentsByDepartment: (department: string) => {
      return get().agents.filter(agent => agent.department === department);
    },
  }))
);

// Subscribe to WebSocket events for real-time updates
if (typeof window !== 'undefined') {
  const ws = getWebSocketManager();
  if (ws) {
    // Set up WebSocket event listeners
    ws.on('agent_online', (data: { agentId: number; timestamp: string }) => {
      useAgentStore.getState().handleAgentOnline(data.agentId);
    });

    ws.on('agent_offline', (data: { agentId: number; timestamp: string }) => {
      useAgentStore.getState().handleAgentOffline(data.agentId);
    });

    ws.on('agent_status_change', (data: { agentId: number; status: string; timestamp: string }) => {
      useAgentStore.getState().handleAgentStatusChange(data.agentId, data.status);
    });

    ws.on('agent_activity', (data: AgentActivity) => {
      useAgentStore.getState().handleAgentActivity(data);
    });
  }
}