import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Ticket, TicketForm, TicketStatus, TicketPriority, User } from '@/types';
import { ticketsApi, adminsApi } from '@/lib/api';

interface TicketFilters {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assigned_to?: string[];
  sla_status?: 'ok' | 'warning' | 'breached';
  due_date?: {
    from: string;
    to: string;
  };
  tags?: string[];
}

interface TicketState {
  // Data
  tickets: Ticket[];
  agents: User[];
  totalCount: number;
  
  // Filters and pagination
  filters: TicketFilters;
  currentPage: number;
  pageSize: number;
  
  // UI state
  isLoading: boolean;
  isAssigning: boolean;
  error: string | null;
  
  // Analytics
  analytics: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    slaBreached: number;
    averageResponseTime: number;
    averageResolutionTime: number;
  };
}

interface TicketActions {
  // Fetch operations
  fetchTickets: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  
  // CRUD operations
  createTicket: (data: TicketForm) => Promise<void>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  
  // Ticket management
  assignTicket: (ticketId: string, agentId: string) => Promise<void>;
  unassignTicket: (ticketId: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: TicketPriority) => Promise<void>;
  addTicketNote: (ticketId: string, note: string) => Promise<void>;
  addTicketTag: (ticketId: string, tag: string) => Promise<void>;
  removeTicketTag: (ticketId: string, tag: string) => Promise<void>;
  
  // Bulk operations
  bulkAssignTickets: (ticketIds: string[], agentId: string) => Promise<void>;
  bulkUpdateStatus: (ticketIds: string[], status: TicketStatus) => Promise<void>;
  
  // Filters
  setFilters: (filters: TicketFilters) => void;
  clearFilters: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type TicketStore = TicketState & TicketActions;

export const useTicketStore = create<TicketStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tickets: [],
    agents: [],
    totalCount: 0,
    filters: {},
    currentPage: 1,
    pageSize: 50,
    isLoading: false,
    isAssigning: false,
    error: null,
    analytics: {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      slaBreached: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
    },

    // Fetch operations
    fetchTickets: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const response = await ticketsApi.getAll({
          page: get().currentPage,
          per_page: get().pageSize,
          ...get().filters
        });
        
        set({
          tickets: (response as any).data || [],
          totalCount: (response as any).pagination?.total || 0,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load tickets',
          isLoading: false,
        });
      }
    },

    fetchAgents: async () => {
      try {
        const response = await adminsApi.getAll();
        set({ agents: (response as any).data || [] });
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    },

    fetchAnalytics: async () => {
      try {
        // TODO: Implement analytics API endpoint
        // const response = await ticketsApi.getAnalytics();
        // set({ analytics: (response as any).data || get().analytics });
        console.log('Analytics fetch not implemented yet');
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    },

    // CRUD operations
    createTicket: async (data) => {
      try {
        set({ error: null });
        
        await ticketsApi.create(data);
        
        // Refresh tickets list
        await get().fetchTickets();
        await get().fetchAnalytics();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create ticket',
        });
        throw error;
      }
    },

    updateTicket: async (id, data) => {
      try {
        set({ error: null });
        
        await ticketsApi.update(id, data);
        
        // Update local state
        set((state) => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === id ? { ...ticket, ...data } : ticket
          ),
        }));
        
        await get().fetchAnalytics();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update ticket',
        });
        throw error;
      }
    },

    deleteTicket: async (id) => {
      try {
        set({ error: null });
        
        await ticketsApi.delete(id);
        
        // Remove from local state
        set((state) => ({
          tickets: state.tickets.filter(ticket => ticket.id !== id),
          totalCount: state.totalCount - 1,
        }));
        
        await get().fetchAnalytics();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete ticket',
        });
        throw error;
      }
    },

    // Ticket management
    assignTicket: async (ticketId, agentId) => {
      try {
        set({ isAssigning: true, error: null });
        
        await ticketsApi.assign(ticketId, agentId);
        
        // Update local state
        const agent = get().agents.find(a => a.id === agentId);
        if (agent) {
          set((state) => ({
            tickets: state.tickets.map(ticket =>
              ticket.id === ticketId 
                ? { ...ticket, assigned_to: agent, status: 'in_progress' as TicketStatus }
                : ticket
            ),
          }));
        }
        
        set({ isAssigning: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to assign ticket',
          isAssigning: false,
        });
        throw error;
      }
    },

    unassignTicket: async (ticketId: string) => {
      try {
        set({ error: null });
        
        // TODO: Implement unassign API endpoint
        // // await ticketsApi.unassign(ticketId);
        console.log('Unassign ticket not implemented:', ticketId);
        
        // Update local state
        set((state) => ({
          tickets: state.tickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, assigned_to: undefined }
              : ticket
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to unassign ticket',
        });
        throw error;
      }
    },

    updateTicketStatus: async (ticketId, status) => {
      await get().updateTicket(ticketId, { status });
    },

    updateTicketPriority: async (ticketId, priority) => {
      await get().updateTicket(ticketId, { priority });
    },

    addTicketNote: async (ticketId, note) => {
      try {
        set({ error: null });
        
        // TODO: Implement addNote API endpoint
        // // await ticketsApi.addNote(ticketId, note);
        console.log('Add note not implemented:', ticketId, note);
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to add note',
        });
        throw error;
      }
    },

    addTicketTag: async (ticketId, tag) => {
      try {
        set({ error: null });
        
        // TODO: Implement addTag API endpoint
        // // await ticketsApi.addTag(ticketId, tag);
        console.log('Add tag not implemented:', ticketId, tag);
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to add tag',
        });
        throw error;
      }
    },

    removeTicketTag: async (ticketId, tag) => {
      try {
        set({ error: null });
        
        // TODO: Implement removeTag API endpoint
        // // await ticketsApi.removeTag(ticketId, tag);
        console.log('Remove tag not implemented:', ticketId, tag);
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to remove tag',
        });
        throw error;
      }
    },

    // Bulk operations
    bulkAssignTickets: async (ticketIds, agentId) => {
      try {
        set({ error: null });
        
        // await ticketsApi.bulkAssign(ticketIds, agentId);
        
        // Update local state
        const agent = get().agents.find(a => a.id === agentId);
        if (agent) {
          set((state) => ({
            tickets: state.tickets.map(ticket =>
              ticketIds.includes(ticket.id)
                ? { ...ticket, assigned_to: agent, status: 'in_progress' as TicketStatus }
                : ticket
            ),
          }));
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to assign tickets',
        });
        throw error;
      }
    },

    bulkUpdateStatus: async (ticketIds, status) => {
      try {
        set({ error: null });
        
        // TODO: Implement bulkUpdateStatus API endpoint
        // // await ticketsApi.bulkUpdateStatus(ticketIds, status);
        console.log('Bulk update status not implemented:', ticketIds, status);
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to bulk update status',
        });
        throw error;
      }
    },

    // Filters
    setFilters: (filters) => {
      set({ filters, currentPage: 1 });
      get().fetchTickets();
    },

    clearFilters: () => {
      set({ filters: {}, currentPage: 1 });
      get().fetchTickets();
    },

    // Error handling
    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

// Utility hooks
export const useTickets = () => useTicketStore((state) => state.tickets);
export const useTicketsLoading = () => useTicketStore((state) => state.isLoading);
export const useTicketsError = () => useTicketStore((state) => state.error);
export const useTicketAnalytics = () => useTicketStore((state) => state.analytics);
export const useTicketAgents = () => useTicketStore((state) => state.agents); 