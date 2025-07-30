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
import {
  AgentGroup,
  AdminSummary,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupStats,
  GroupFilters,
  GroupActivity,
  PaginatedResponse,
  BulkAssignResponse,
  BulkRemoveResponse,
  DEFAULT_GROUP_FILTERS,
} from '@/types/agent-groups';
import { mockAgentApi } from '@/lib/mocks/agent-api';
import { agentAPI } from '@/lib/api/agents';
import { agentGroupAPI } from '@/lib/api/agent-groups';
import { mockAgentGroupAPI } from '@/lib/mocks/agent-groups-api';
import { getWebSocketManager } from '@/lib/websocket';

// Development mode flag - set to false to use real backend
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && 
                      process.env.NEXT_PUBLIC_USE_MOCK_GROUPS !== 'false' &&
                      process.env.NEXT_PUBLIC_USE_REAL_DATA !== 'true';

// Choose APIs based on environment
const groupAPI = USE_MOCK_DATA ? mockAgentGroupAPI : agentGroupAPI;
const agentApi = USE_MOCK_DATA ? mockAgentApi : agentAPI;

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

  // Group Management State
  groups: AgentGroup[];
  selectedGroup: AgentGroup | null;
  groupStats: GroupStats | null;
  groupFilters: GroupFilters;
  
  // Group Loading States
  isLoadingGroups: boolean;
  isCreatingGroup: boolean;
  isUpdatingGroup: boolean;
  isDeletingGroup: boolean;
  isLoadingGroupStats: boolean;
  isLoadingGroupMembers: boolean;
  
  // Group Selection States
  selectedGroupIds: number[];
  isBulkProcessingGroups: boolean;
  
  // Group UI States
  showCreateGroupModal: boolean;
  showEditGroupModal: boolean;
  showMemberModal: boolean;
  groupError: string | null;
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
  updateAgentStatus: (id: number, isActive: boolean) => Promise<void>;
  
  // New bulk operations
  bulkUpdateStatus: (agentIds: number[], isActive: boolean) => Promise<{ updated: number; failed: number }>;
  bulkDeleteAgents: (agentIds: number[]) => Promise<{ deleted: number; failed: number }>;
  
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

  // Group CRUD Operations
  loadGroups: (filters?: GroupFilters) => Promise<void>;
  loadGroupById: (id: number) => Promise<void>;
  createGroup: (data: CreateGroupRequest) => Promise<AgentGroup>;
  updateGroup: (id: number, data: UpdateGroupRequest) => Promise<AgentGroup>;
  deleteGroup: (id: number) => Promise<void>;
  
  // Group Membership Management
  loadGroupMembers: (groupId: number) => Promise<AdminSummary[]>;
  addMembersToGroup: (groupId: number, adminIds: number[]) => Promise<void>;
  removeMembersFromGroup: (groupId: number, adminIds: number[]) => Promise<void>;
  bulkAssignMembers: (groupId: number, adminIds: number[]) => Promise<BulkAssignResponse>;
  
  // Group Statistics and Search
  loadGroupStats: () => Promise<void>;
  searchGroups: (query: string) => Promise<void>;
  filterGroups: (filters: GroupFilters) => Promise<void>;
  clearGroupFilters: () => void;
  
  // Group Selection and Bulk Operations
  selectGroup: (id: number) => void;
  selectAllGroups: () => void;
  clearGroupSelection: () => void;
  bulkDeleteGroups: (groupIds: number[]) => Promise<void>;
  
  // Group UI State Management
  setSelectedGroup: (group: AgentGroup | null) => void;
  setShowCreateGroupModal: (show: boolean) => void;
  setShowEditGroupModal: (show: boolean) => void;
  setShowMemberModal: (show: boolean) => void;
  clearGroupError: () => void;
  
  // Group Utilities
  getGroupById: (id: number) => AgentGroup | undefined;
  getGroupsByMemberCount: (min: number, max: number) => AgentGroup[];
  getActiveGroups: () => AgentGroup[];
  getInactiveGroups: () => AgentGroup[];
  
  // Group Real-time handlers
  handleGroupCreated: (group: AgentGroup) => void;
  handleGroupUpdated: (group: AgentGroup) => void;
  handleGroupDeleted: (groupId: number) => void;
  handleGroupMemberAdded: (groupId: number, adminId: number) => void;
  handleGroupMemberRemoved: (groupId: number, adminId: number) => void;
  handleGroupActivity: (activity: GroupActivity) => void;
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

    // Initial group state
    groups: [],
    selectedGroup: null,
    groupStats: null,
    groupFilters: DEFAULT_GROUP_FILTERS,
    isLoadingGroups: false,
    isCreatingGroup: false,
    isUpdatingGroup: false,
    isDeletingGroup: false,
    isLoadingGroupStats: false,
    isLoadingGroupMembers: false,
    selectedGroupIds: [],
    isBulkProcessingGroups: false,
    showCreateGroupModal: false,
    showEditGroupModal: false,
    showMemberModal: false,
    groupError: null,

    // Actions
    loadAgents: async (filters = {}) => {
      set({ isLoading: true, error: null });
      try {
        const currentFilters = { ...get().filters, ...filters };
        const response = await agentApi.getAll(currentFilters);
        
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
        const agent = await agentApi.getById(id);
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
        const performance = USE_MOCK_DATA 
          ? await (agentApi as any).getPerformance(id, dateRange)
          : await (agentApi as any).getPerformanceMetrics(id, dateRange?.from, dateRange?.to);
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
        const activity = USE_MOCK_DATA 
          ? await (agentApi as any).getActivity(id, days)
          : await (agentApi as any).getActivity(id, 1, days || 50);
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
        const rawStats = await agentApi.getStats();
        
        // Transform stats to match store interface
        const stats = USE_MOCK_DATA ? rawStats : {
          total: (rawStats as any).totalAgents,
          active: (rawStats as any).activeAgents,
          online: (rawStats as any).onlineAgents,
          offline: ((rawStats as any).totalAgents - (rawStats as any).onlineAgents),
          byRole: (rawStats as any).byRole,
          byDepartment: (rawStats as any).byDepartment,
        };
        
        set({ stats: stats as any });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load statistics',
        });
      }
    },

    createAgent: async (data: CreateAgentData) => {
      set({ isCreating: true, error: null });
      try {
        const newAgent = await agentApi.create(data);
        
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
        const updatedAgent = await agentApi.update(id, data);
        
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
        await agentApi.delete(id);
        
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

    updateAgentStatus: async (id: number, isActive: boolean) => {
      try {
        const updatedAgent = USE_MOCK_DATA
          ? await (agentApi as any).updateStatus(id, isActive)
          : await (agentApi as any).updateStatus(id, isActive);
        
        // Update in agents list
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === id ? updatedAgent : agent
          ),
          selectedAgent: state.selectedAgent?.id === id ? updatedAgent : state.selectedAgent,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update agent status',
        });
        throw error;
      }
    },

    // New bulk operations
    bulkUpdateStatus: async (agentIds: number[], isActive: boolean) => {
      set({ isBulkProcessing: true, error: null });
      try {
        const result = USE_MOCK_DATA
          ? await (agentApi as any).bulkUpdateStatus(agentIds, isActive)
          : await (agentApi as any).bulkUpdateStatus(agentIds, isActive);
        
        // Reload agents to get updated data
        await get().loadAgents();
        set({ selectedAgentIds: [], isBulkProcessing: false });
        
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to bulk update agent status',
          isBulkProcessing: false,
        });
        throw error;
      }
    },
    
    bulkDeleteAgents: async (agentIds: number[]) => {
      set({ isBulkProcessing: true, error: null });
      try {
        const result = USE_MOCK_DATA
          ? await (agentApi as any).bulkDelete(agentIds)
          : await (agentApi as any).bulkDelete(agentIds);
        
        // Reload agents to get updated data
        await get().loadAgents();
        set({ selectedAgentIds: [], isBulkProcessing: false });
        
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to bulk delete agents',
          isBulkProcessing: false,
        });
        throw error;
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
        // For real API, handle different types of bulk updates
        if (USE_MOCK_DATA) {
          const result = await (agentApi as any).bulkUpdate(selectedAgentIds, updates);
          if (result.success) {
            await get().loadAgents();
            set({ selectedAgentIds: [], isBulkProcessing: false });
          } else {
            set({
              error: `Bulk update completed with errors: ${result.errors.join(', ')}`,
              isBulkProcessing: false,
            });
          }
        } else {
          // For real API, we'll implement specific bulk operations
          // For now, update each agent individually
          let succeeded = 0;
          let failed = 0;
          
          for (const agentId of selectedAgentIds) {
            try {
              await agentApi.update(agentId, updates);
              succeeded++;
            } catch (error) {
              failed++;
            }
          }
          
          if (failed === 0) {
            // Reload agents to get updated data
            await get().loadAgents();
            set({ selectedAgentIds: [], isBulkProcessing: false });
          } else {
            set({
              error: `Bulk update completed: ${succeeded} succeeded, ${failed} failed`,
              isBulkProcessing: false,
            });
          }
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
        // For real API, use search with pagination
        const currentFilters = get().filters;
        const response = await agentApi.search(query, currentFilters.page || 1, currentFilters.limit || 20);
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

    // Group CRUD Operations
    loadGroups: async (filters = {}) => {
      set({ isLoadingGroups: true, groupError: null });
      try {
        const currentFilters = { ...get().groupFilters, ...filters };
        const response = await groupAPI.getByFilter(currentFilters);
        
        set({
          groups: response.data,
          groupFilters: currentFilters,
          isLoadingGroups: false,
        });
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to load groups',
          isLoadingGroups: false,
        });
      }
    },

    loadGroupById: async (id: number) => {
      set({ isLoadingGroups: true, groupError: null });
      try {
        const group = await groupAPI.getById(id);
        set({
          selectedGroup: group,
          isLoadingGroups: false,
        });
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to load group details',
          isLoadingGroups: false,
        });
      }
    },

    createGroup: async (data: CreateGroupRequest) => {
      set({ isCreatingGroup: true, groupError: null });
      try {
        const newGroup = await groupAPI.create(data);
        
        // Add to current groups list
        set((state) => ({
          groups: [newGroup, ...state.groups],
          isCreatingGroup: false,
          showCreateGroupModal: false,
        }));
        
        return newGroup;
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to create group',
          isCreatingGroup: false,
        });
        throw error;
      }
    },

    updateGroup: async (id: number, data: UpdateGroupRequest) => {
      set({ isUpdatingGroup: true, groupError: null });
      try {
        const updatedGroup = await groupAPI.update(id, data);
        
        // Update in groups list
        set((state) => ({
          groups: state.groups.map(group => 
            group.id === id ? updatedGroup : group
          ),
          selectedGroup: state.selectedGroup?.id === id ? updatedGroup : state.selectedGroup,
          isUpdatingGroup: false,
          showEditGroupModal: false,
        }));
        
        return updatedGroup;
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to update group',
          isUpdatingGroup: false,
        });
        throw error;
      }
    },

    deleteGroup: async (id: number) => {
      set({ isDeletingGroup: true, groupError: null });
      try {
        await groupAPI.delete(id);
        
        // Remove from groups list
        set((state) => ({
          groups: state.groups.filter(group => group.id !== id),
          selectedGroup: state.selectedGroup?.id === id ? null : state.selectedGroup,
          selectedGroupIds: state.selectedGroupIds.filter(groupId => groupId !== id),
          isDeletingGroup: false,
        }));
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to delete group',
          isDeletingGroup: false,
        });
        throw error;
      }
    },

    // Group Membership Management
    loadGroupMembers: async (groupId: number) => {
      set({ isLoadingGroupMembers: true, groupError: null });
      try {
        const members = await groupAPI.getMembers(groupId);
        
        // Update the specific group with members data
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId ? { ...group, members } : group
          ),
          selectedGroup: state.selectedGroup?.id === groupId 
            ? { ...state.selectedGroup, members }
            : state.selectedGroup,
          isLoadingGroupMembers: false,
        }));
        
        return members;
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to load group members',
          isLoadingGroupMembers: false,
        });
        throw error;
      }
    },

    addMembersToGroup: async (groupId: number, adminIds: number[]) => {
      set({ groupError: null });
      try {
        await groupAPI.addMembers(groupId, adminIds);
        
        // Reload group members to get updated data
        await get().loadGroupMembers(groupId);
        
        // Update member count
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId 
              ? { ...group, memberCount: group.memberCount + adminIds.length }
              : group
          ),
        }));
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to add members to group',
        });
        throw error;
      }
    },

    removeMembersFromGroup: async (groupId: number, adminIds: number[]) => {
      set({ groupError: null });
      try {
        await groupAPI.removeMembers(groupId, adminIds);
        
        // Reload group members to get updated data
        await get().loadGroupMembers(groupId);
        
        // Update member count
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId 
              ? { ...group, memberCount: Math.max(0, group.memberCount - adminIds.length) }
              : group
          ),
        }));
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to remove members from group',
        });
        throw error;
      }
    },

    bulkAssignMembers: async (groupId: number, adminIds: number[]) => {
      set({ isBulkProcessingGroups: true, groupError: null });
      try {
        const result = await groupAPI.bulkAssignMembers(groupId, adminIds);
        
        // Reload group members to get updated data
        await get().loadGroupMembers(groupId);
        
        // Update member count based on successful assignments
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId 
              ? { ...group, memberCount: group.memberCount + result.successCount }
              : group
          ),
          isBulkProcessingGroups: false,
        }));
        
        return result;
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to bulk assign members',
          isBulkProcessingGroups: false,
        });
        throw error;
      }
    },

    // Group Statistics and Search
    loadGroupStats: async () => {
      set({ isLoadingGroupStats: true, groupError: null });
      try {
        const stats = await groupAPI.getStats();
        set({ 
          groupStats: stats,
          isLoadingGroupStats: false,
        });
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to load group statistics',
          isLoadingGroupStats: false,
        });
      }
    },

    searchGroups: async (query: string) => {
      set({ isLoadingGroups: true, groupError: null });
      try {
        const response = await groupAPI.search(query);
        set({
          groups: response.data,
          isLoadingGroups: false,
        });
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Group search failed',
          isLoadingGroups: false,
        });
      }
    },

    filterGroups: async (filters: GroupFilters) => {
      set({ isLoadingGroups: true, groupError: null });
      try {
        const response = await groupAPI.getByFilter(filters);
        set({
          groups: response.data,
          groupFilters: filters,
          isLoadingGroups: false,
        });
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Failed to filter groups',
          isLoadingGroups: false,
        });
      }
    },

    clearGroupFilters: () => {
      set({
        groupFilters: DEFAULT_GROUP_FILTERS,
      });
      get().loadGroups();
    },

    // Group Selection and Bulk Operations
    selectGroup: (id: number) => {
      set((state) => ({
        selectedGroupIds: state.selectedGroupIds.includes(id)
          ? state.selectedGroupIds.filter(groupId => groupId !== id)
          : [...state.selectedGroupIds, id],
      }));
    },

    selectAllGroups: () => {
      set((state) => ({
        selectedGroupIds: state.groups.map(group => group.id),
      }));
    },

    clearGroupSelection: () => {
      set({ selectedGroupIds: [] });
    },

    bulkDeleteGroups: async (groupIds: number[]) => {
      set({ isBulkProcessingGroups: true, groupError: null });
      try {
        // Delete groups sequentially to handle any failures
        const results = await Promise.allSettled(
          groupIds.map(id => groupAPI.delete(id))
        );
        
        // Count successful deletions
        const successfulDeletions = results.filter(result => result.status === 'fulfilled').length;
        const failedDeletions = results.filter(result => result.status === 'rejected').length;
        
        // Remove successfully deleted groups
        set((state) => ({
          groups: state.groups.filter(group => !groupIds.includes(group.id)),
          selectedGroupIds: [],
          isBulkProcessingGroups: false,
        }));
        
        if (failedDeletions > 0) {
          set({
            groupError: `${successfulDeletions} groups deleted, ${failedDeletions} failed`,
          });
        }
      } catch (error) {
        set({
          groupError: error instanceof Error ? error.message : 'Bulk delete failed',
          isBulkProcessingGroups: false,
        });
      }
    },

    // Group UI State Management
    setSelectedGroup: (group: AgentGroup | null) => {
      set({ selectedGroup: group });
    },

    setShowCreateGroupModal: (show: boolean) => {
      set({ showCreateGroupModal: show });
    },

    setShowEditGroupModal: (show: boolean) => {
      set({ showEditGroupModal: show });
    },

    setShowMemberModal: (show: boolean) => {
      set({ showMemberModal: show });
    },

    clearGroupError: () => {
      set({ groupError: null });
    },

    // Group Utilities
    getGroupById: (id: number) => {
      return get().groups.find(group => group.id === id);
    },

    getGroupsByMemberCount: (min: number, max: number) => {
      return get().groups.filter(group => 
        group.memberCount >= min && group.memberCount <= max
      );
    },

    getActiveGroups: () => {
      return get().groups.filter(group => group.isActive);
    },

    getInactiveGroups: () => {
      return get().groups.filter(group => !group.isActive);
    },

    // Group Real-time handlers
    handleGroupCreated: (group: AgentGroup) => {
      set((state) => ({
        groups: [group, ...state.groups],
      }));
    },

    handleGroupUpdated: (group: AgentGroup) => {
      set((state) => ({
        groups: state.groups.map(g => g.id === group.id ? group : g),
        selectedGroup: state.selectedGroup?.id === group.id ? group : state.selectedGroup,
      }));
    },

    handleGroupDeleted: (groupId: number) => {
      set((state) => ({
        groups: state.groups.filter(group => group.id !== groupId),
        selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
        selectedGroupIds: state.selectedGroupIds.filter(id => id !== groupId),
      }));
    },

    handleGroupMemberAdded: (groupId: number, adminId: number) => {
      set((state) => ({
        groups: state.groups.map(group =>
          group.id === groupId 
            ? { ...group, memberCount: group.memberCount + 1 }
            : group
        ),
      }));
    },

    handleGroupMemberRemoved: (groupId: number, adminId: number) => {
      set((state) => ({
        groups: state.groups.map(group =>
          group.id === groupId 
            ? { ...group, memberCount: Math.max(0, group.memberCount - 1) }
            : group
        ),
      }));
    },

    handleGroupActivity: (activity: GroupActivity) => {
      // Update group stats if available
      set((state) => {
        if (state.groupStats) {
          return {
            groupStats: {
              ...state.groupStats,
              recentActivity: [activity, ...state.groupStats.recentActivity.slice(0, 9)],
            },
          };
        }
        return {};
      });
    },
  }))
);

// Subscribe to WebSocket events for real-time updates
if (typeof window !== 'undefined') {
  const ws = getWebSocketManager();
  if (ws) {
    // Join group-related rooms for real-time updates
    ws.joinAllGroupsRoom();
    
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

    // Group-related WebSocket events
    ws.on('group_created', (data: { group: AgentGroup; timestamp: string }) => {
      useAgentStore.getState().handleGroupCreated(data.group);
    });

    ws.on('group_updated', (data: { group: AgentGroup; timestamp: string }) => {
      useAgentStore.getState().handleGroupUpdated(data.group);
    });

    ws.on('group_deleted', (data: { groupId: number; timestamp: string }) => {
      useAgentStore.getState().handleGroupDeleted(data.groupId);
    });

    ws.on('group_member_added', (data: { groupId: number; adminId: number; timestamp: string }) => {
      useAgentStore.getState().handleGroupMemberAdded(data.groupId, data.adminId);
    });

    ws.on('group_member_removed', (data: { groupId: number; adminId: number; timestamp: string }) => {
      useAgentStore.getState().handleGroupMemberRemoved(data.groupId, data.adminId);
    });

    ws.on('group_activity', (data: GroupActivity) => {
      useAgentStore.getState().handleGroupActivity(data);
    });
  }
}