import { create } from 'zustand';
import { Label } from '@/types';
import { labelsApi } from '@/lib/api';

interface LabelFilters {
  search?: string;
  type?: 'system' | 'custom' | 'all';
  color?: string;
  isActive?: boolean;
}

interface LabelStats {
  total_labels: number;
  system_labels: number;
  custom_labels: number;
  active_labels: number;
  new_this_week: number;
  tagged_items: number;
  popular_labels: Label[];
}

interface LabelState {
  // Data
  labels: Label[];
  selectedLabels: string[];
  stats: LabelStats | null;
  
  // Filters and pagination
  filters: LabelFilters;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  
  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Search
  searchResults: Label[];
  isSearching: boolean;
}

interface LabelActions {
  // Fetch operations
  fetchLabels: () => Promise<void>;
  fetchStats: () => Promise<void>;
  searchLabels: (query: string) => Promise<void>;
  
  // CRUD operations
  createLabel: (data: { name: string; color: string; description?: string }) => Promise<void>;
  updateLabel: (id: string, data: Partial<{ name: string; color: string; description?: string }>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  bulkDeleteLabels: (ids: string[]) => Promise<void>;
  
  // Selection
  selectLabel: (id: string) => void;
  selectAllLabels: () => void;
  clearSelection: () => void;
  
  // Filters
  setFilters: (filters: LabelFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  
  // System operations
  createSystemLabels: () => Promise<void>;
  cleanupUnusedLabels: () => Promise<void>;
  recalculateUsage: () => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type LabelStore = LabelState & LabelActions;

export const useLabelStore = create<LabelStore>((set, get) => ({
    // Initial state
    labels: [],
    selectedLabels: [],
    stats: null,
    filters: { type: 'all' },
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    searchResults: [],
    isSearching: false,

    // Fetch operations
    fetchLabels: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const response = await labelsApi.getAll({
          page: get().currentPage,
          limit: get().pageSize,
        });

        set({
          labels: response || [],
          totalCount: response?.length || 0,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load labels',
          isLoading: false,
        });
      }
    },

    fetchStats: async () => {
      try {
        const response = await labelsApi.getStats();
        set({ stats: response });
      } catch (error) {
        console.error('Failed to load label stats:', error);
      }
    },

    searchLabels: async (query: string) => {
      try {
        set({ isSearching: true, error: null });
        
        if (!query.trim()) {
          // If query is empty, show all labels
          set({
            searchResults: get().labels,
            isSearching: false,
          });
          return;
        }
        
        // Use backend search API
        const response = await labelsApi.search(query, {
          page: 1,
          limit: 100, // Get more results for search
        });
        
        set({
          searchResults: response || [],
          isSearching: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Search failed',
          isSearching: false,
        });
      }
    },

    // CRUD operations
    createLabel: async (data) => {
      try {
        set({ isCreating: true, error: null });
        
        const response = await labelsApi.create(data);
        
        if (response) {
          set((state) => ({
            labels: [...state.labels, response],
            totalCount: state.totalCount + 1,
            isCreating: false,
          }));
          
          // Refresh stats
          await get().fetchStats();
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create label',
          isCreating: false,
        });
        throw error;
      }
    },

    updateLabel: async (id, data) => {
      try {
        set({ isUpdating: true, error: null });
        
        const response = await labelsApi.update(id, data);
        
        if (response) {
          set((state) => ({
            labels: state.labels.map(label =>
              label.id === id ? { ...label, ...data } : label
            ),
            isUpdating: false,
          }));
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update label',
          isUpdating: false,
        });
        throw error;
      }
    },

    deleteLabel: async (id) => {
      try {
        set({ isDeleting: true, error: null });
        
        await labelsApi.delete(id);
        
        set((state) => ({
          labels: state.labels.filter(label => label.id !== id),
          selectedLabels: state.selectedLabels.filter(selectedId => selectedId !== id),
          totalCount: state.totalCount - 1,
          isDeleting: false,
        }));
        
        // Refresh stats
        await get().fetchStats();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete label',
          isDeleting: false,
        });
        throw error;
      }
    },

    bulkDeleteLabels: async (ids) => {
      try {
        set({ isDeleting: true, error: null });
        
        // Delete labels one by one since we don't have bulk delete API
        for (const id of ids) {
          await labelsApi.delete(id);
        }
        
        set((state) => ({
          labels: state.labels.filter(label => !ids.includes(label.id)),
          selectedLabels: state.selectedLabels.filter(id => !ids.includes(id)),
          totalCount: state.totalCount - ids.length,
          isDeleting: false,
        }));
        
        // Refresh stats
        await get().fetchStats();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete labels',
          isDeleting: false,
        });
        throw error;
      }
    },

    // Selection
    selectLabel: (id) => {
      set((state) => ({
        selectedLabels: state.selectedLabels.includes(id)
          ? state.selectedLabels.filter(selectedId => selectedId !== id)
          : [...state.selectedLabels, id],
      }));
    },

    selectAllLabels: () => {
      set((state) => ({
        selectedLabels: state.labels.map(label => label.id),
      }));
    },

    clearSelection: () => {
      set({ selectedLabels: [] });
    },

    // Filters
    setFilters: (filters) => {
      set({ filters, currentPage: 1 });
      get().fetchLabels();
    },

    clearFilters: () => {
      set({ filters: { type: 'all' }, currentPage: 1 });
      get().fetchLabels();
    },

    setPage: (page) => {
      set({ currentPage: page });
      get().fetchLabels();
    },

    // Error handling
    setError: (error) => {
      set({ error });
    },

    // System operations
    createSystemLabels: async () => {
      try {
        set({ isLoading: true, error: null });
        
        await labelsApi.createSystemLabels();
        
        // Refresh labels and stats after creating system labels
        await get().fetchLabels();
        await get().fetchStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create system labels',
          isLoading: false,
        });
        throw error;
      }
    },

    cleanupUnusedLabels: async () => {
      try {
        set({ isLoading: true, error: null });
        
        await labelsApi.cleanup();
        
        // Refresh labels and stats after cleanup
        await get().fetchLabels();
        await get().fetchStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to cleanup unused labels',
          isLoading: false,
        });
        throw error;
      }
    },

    recalculateUsage: async () => {
      try {
        set({ isLoading: true, error: null });
        
        await labelsApi.recalculateUsage();
        
        // Refresh labels and stats after recalculation
        await get().fetchLabels();
        await get().fetchStats();
        
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to recalculate usage counts',
          isLoading: false,
        });
        throw error;
      }
    },

    clearError: () => {
      set({ error: null });
    },
  }));

// Utility hooks
export const useLabels = () => useLabelStore((state) => state.labels);
export const useLabelsLoading = () => useLabelStore((state) => state.isLoading);
export const useLabelsError = () => useLabelStore((state) => state.error);
export const useSelectedLabels = () => useLabelStore((state) => state.selectedLabels);
export const useLabelFilters = () => useLabelStore((state) => state.filters);
export const useLabelStats = () => useLabelStore((state) => state.stats);