import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Contact, ContactForm, Label } from '@/types';
import { contactsApi, labelsApi } from '@/lib/api';

interface ContactFilters {
  search?: string;
  labels?: string[];
  status?: 'active' | 'blocked' | 'all';
  dateRange?: {
    from: string;
    to: string;
  };
}

interface ContactState {
  // Data
  contacts: Contact[];
  labels: Label[];
  selectedContacts: string[];
  totalCount: number;
  
  // Filters and pagination
  filters: ContactFilters;
  currentPage: number;
  pageSize: number;
  
  // UI state
  isLoading: boolean;
  isImporting: boolean;
  isExporting: boolean;
  error: string | null;
  
  // Search
  searchResults: Contact[];
  isSearching: boolean;
}

interface ContactActions {
  // Fetch operations
  fetchContacts: () => Promise<void>;
  fetchLabels: () => Promise<void>;
  searchContacts: (query: string) => Promise<void>;
  
  // CRUD operations
  createContact: (data: ContactForm) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  bulkUpdateContacts: (ids: string[], data: Partial<Contact>) => Promise<void>;
  bulkDeleteContacts: (ids: string[]) => Promise<void>;
  
  // Contact management
  blockContact: (id: string) => Promise<void>;
  unblockContact: (id: string) => Promise<void>;
  addContactLabel: (contactId: string, labelId: string) => Promise<void>;
  removeContactLabel: (contactId: string, labelId: string) => Promise<void>;
  
  // Takeover management
  setTakeover: (contactId: string, adminId: string) => Promise<void>;
  releaseTakeover: (contactId: string, adminId: string) => Promise<void>;
  getTakeoverStatus: (contactId: string) => Promise<any>;
  
  // Label management
  createLabel: (data: { name: string; color: string; description?: string }) => Promise<void>;
  updateLabel: (id: string, data: Partial<{ name: string; color: string; description?: string }>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  
  // Selection
  selectContact: (id: string) => void;
  selectAllContacts: () => void;
  clearSelection: () => void;
  
  // Filters
  setFilters: (filters: ContactFilters) => void;
  clearFilters: () => void;
  
  // Import/Export
  importContacts: (file: File) => Promise<void>;
  exportContacts: (format: 'csv' | 'excel') => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ContactStore = ContactState & ContactActions;

export const useContactStore = create<ContactStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    contacts: [],
    labels: [],
    selectedContacts: [],
    totalCount: 0,
    filters: { status: 'all' },
    currentPage: 1,
    pageSize: 50,
    isLoading: false,
    isImporting: false,
    isExporting: false,
    error: null,
    searchResults: [],
    isSearching: false,

    // Fetch operations
    fetchContacts: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const response = await contactsApi.getAll({
          page: get().currentPage,
          per_page: get().pageSize,
          ...get().filters
        });

        console.log('response', (response as any));

        set({
          contacts: (response as any) || [],
          totalCount: (response as any).meta?.total || 0,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load contacts',
          isLoading: false,
        });
      }
    },

    fetchLabels: async () => {
      try {
        const response = await labelsApi.getAll();
        set({ labels: (response as any) || [] });
      } catch (error) {
        console.error('Failed to load labels:', error);
      }
    },

    searchContacts: async (query: string) => {
      try {
        set({ isSearching: true, error: null });
        
        const response = await contactsApi.search(query);
        
        set({
          searchResults: (response as any).data || [],
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
    createContact: async (data) => {
      try {
        set({ error: null });
        
        await contactsApi.create(data);
        
        // Refresh contacts list
        await get().fetchContacts();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create contact',
        });
        throw error;
      }
    },

    updateContact: async (id, data) => {
      try {
        set({ error: null });
        
        await contactsApi.update(id, data);
        
        // Update local state
        set((state) => ({
          contacts: state.contacts.map(contact =>
            contact.id === id ? { ...contact, ...data } : contact
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update contact',
        });
        throw error;
      }
    },

    deleteContact: async (id) => {
      try {
        set({ error: null });
        
        await contactsApi.delete(id);
        
        // Remove from local state
        set((state) => ({
          contacts: state.contacts.filter(contact => contact.id !== id),
          selectedContacts: state.selectedContacts.filter(selectedId => selectedId !== id),
          totalCount: state.totalCount - 1,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete contact',
        });
        throw error;
      }
    },

    bulkUpdateContacts: async (ids, data) => {
      try {
        set({ error: null });
        
        await contactsApi.bulkUpdate(ids, data);
        
        // Update local state
        set((state) => ({
          contacts: state.contacts.map(contact =>
            ids.includes(contact.id) ? { ...contact, ...data } : contact
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update contacts',
        });
        throw error;
      }
    },

    bulkDeleteContacts: async (ids) => {
      try {
        set({ error: null });
        
        await contactsApi.bulkDelete(ids);
        
        // Remove from local state
        set((state) => ({
          contacts: state.contacts.filter(contact => !ids.includes(contact.id)),
          selectedContacts: state.selectedContacts.filter(id => !ids.includes(id)),
          totalCount: state.totalCount - ids.length,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete contacts',
        });
        throw error;
      }
    },

    // Contact management
    blockContact: async (id) => {
      await get().updateContact(id, { is_blocked: true });
    },

    unblockContact: async (id) => {
      await get().updateContact(id, { is_blocked: false });
    },

    addContactLabel: async (contactId, labelId) => {
      try {
        await contactsApi.addLabel(contactId, labelId);
        
        // Update local state
        const label = get().labels.find(l => l.id === labelId);
        if (label) {
          set((state) => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId
                ? { ...contact, labels: [...(contact.labels || []), label] }
                : contact
            ),
          }));
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to add label',
        });
        throw error;
      }
    },

    removeContactLabel: async (contactId, labelId) => {
      try {
        await contactsApi.removeLabel(contactId, labelId);
        
        // Update local state
        set((state) => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId
              ? { ...contact, labels: contact.labels?.filter(l => l.id !== labelId) }
              : contact
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to remove label',
        });
        throw error;
      }
    },

    // Label management
    createLabel: async (data) => {
      try {
        const response = await labelsApi.create(data);
        
        set((state) => ({
          labels: [...state.labels, (response as any).data],
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create label',
        });
        throw error;
      }
    },

    updateLabel: async (id, data) => {
      try {
        await labelsApi.update(id, data);
        
        set((state) => ({
          labels: state.labels.map(label =>
            label.id === id ? { ...label, ...data } : label
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update label',
        });
        throw error;
      }
    },

    deleteLabel: async (id) => {
      try {
        await labelsApi.delete(id);
        
        set((state) => ({
          labels: state.labels.filter(label => label.id !== id),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete label',
        });
        throw error;
      }
    },

    // Selection
    selectContact: (id) => {
      set((state) => ({
        selectedContacts: state.selectedContacts.includes(id)
          ? state.selectedContacts.filter(selectedId => selectedId !== id)
          : [...state.selectedContacts, id],
      }));
    },

    selectAllContacts: () => {
      set((state) => ({
        selectedContacts: state.contacts.map(contact => contact.id),
      }));
    },

    clearSelection: () => {
      set({ selectedContacts: [] });
    },

    // Filters
    setFilters: (filters) => {
      set({ filters, currentPage: 1 });
      get().fetchContacts();
    },

    clearFilters: () => {
      set({ filters: { status: 'all' }, currentPage: 1 });
      get().fetchContacts();
    },

    // Import/Export
    importContacts: async (file) => {
      try {
        set({ isImporting: true, error: null });
        
        await contactsApi.import(file);
        
        // Refresh contacts list
        await get().fetchContacts();
        
        set({ isImporting: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to import contacts',
          isImporting: false,
        });
        throw error;
      }
    },

    exportContacts: async (format) => {
      try {
        set({ isExporting: true, error: null });
        
        const response = await contactsApi.export(format, {
          filters: get().filters,
        });
        
        // Download file
        const blob = new Blob([response as any], {
          type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        set({ isExporting: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to export contacts',
          isExporting: false,
        });
        throw error;
      }
    },

    // Error handling
    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    // Takeover management
    setTakeover: async (contactId, adminId) => {
      try {
        set({ error: null });
        
        await contactsApi.setTakeover(contactId, adminId);
        
        // Update local state
        set((state) => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId 
              ? { ...contact, is_takeover_by_admin: true, takeover_by_admin_id: adminId }
              : contact
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to set takeover',
        });
        throw error;
      }
    },

    releaseTakeover: async (contactId, adminId) => {
      try {
        set({ error: null });
        
        await contactsApi.releaseTakeover(contactId, adminId);
        
        // Update local state
        set((state) => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId 
              ? { ...contact, is_takeover_by_admin: false, takeover_by_admin_id: undefined }
              : contact
          ),
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to release takeover',
        });
        throw error;
      }
    },

    getTakeoverStatus: async (contactId) => {
      try {
        set({ error: null });
        
        const response = await contactsApi.getTakeoverStatus(contactId);
        return response;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to get takeover status',
        });
        throw error;
      }
    },
  }))
);

// Utility hooks
export const useContacts = () => useContactStore((state) => state.contacts);
export const useContactsLoading = () => useContactStore((state) => state.isLoading);
export const useContactsError = () => useContactStore((state) => state.error);
export const useSelectedContacts = () => useContactStore((state) => state.selectedContacts);
export const useContactFilters = () => useContactStore((state) => state.filters);
export const useContactLabels = () => useContactStore((state) => state.labels);