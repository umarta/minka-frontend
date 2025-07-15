import { create } from 'zustand';
import { AntiBlockingConfig, AntiBlockingStats, AntiBlockingValidationResult, ContactRiskAssessment, BulkMessageResponse } from '@/types';
import { antiBlockingApi } from '../api';

interface AntiBlockingState {
  config: AntiBlockingConfig | null;
  stats: AntiBlockingStats | null;
  lastValidation: AntiBlockingValidationResult | null;
  lastRisk: ContactRiskAssessment | null;
  bulkResult: BulkMessageResponse | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<AntiBlockingConfig>) => Promise<void>;
  fetchStats: () => Promise<void>;
  validateMessage: (payload: {
    contact_id: number;
    session_name: string;
    content: string;
    message_type: string;
    admin_id?: number;
  }) => Promise<AntiBlockingValidationResult | null>;
  fetchRisk: (contactId: number) => Promise<void>;
  bulkSend: (payload: any) => Promise<void>;
  clear: () => void;
}

export const useAntiBlockingStore = create<AntiBlockingState>((set) => ({
  config: null,
  stats: null,
  lastValidation: null,
  lastRisk: null,
  bulkResult: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const config = await antiBlockingApi.getConfig();
      set({ config });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateConfig: async (config) => {
    set({ loading: true, error: null });
    try {
      const updated = await antiBlockingApi.updateConfig(config);
      set({ config: updated });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await antiBlockingApi.getStats();
      set({ stats });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  validateMessage: async (payload) => {
    set({ loading: true, error: null });
    try {
      const result = await antiBlockingApi.validateMessage(payload);
      set({ lastValidation: result });
      return result;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchRisk: async (contactId) => {
    set({ loading: true, error: null });
    try {
      const risk = await antiBlockingApi.getContactRisk(contactId);
      set({ lastRisk: risk });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  bulkSend: async (payload) => {
    set({ loading: true, error: null });
    try {
      const result = await antiBlockingApi.bulkSend(payload);
      set({ bulkResult: result });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ lastValidation: null, lastRisk: null, bulkResult: null, error: null }),
})); 