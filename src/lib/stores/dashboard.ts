import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { dashboardApi } from '@/lib/api';

export interface DashboardStats {
  total_contacts: number;
  total_sessions: number;
  open_tickets: number;
  response_rate: number;
  total_messages: number;
  active_sessions: number;
  resolved_tickets_today: number;
  new_contacts_today: number;
}

export interface RecentActivity {
  id: string;
  type: 'message' | 'ticket' | 'session' | 'system';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export interface SystemStatus {
  name: string;
  status: 'operational' | 'maintenance' | 'down';
  uptime: string;
  last_check: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  systemStatus: SystemStatus[];
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboardStats: () => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set, get) => ({
    stats: null,
    recentActivities: [],
    systemStatus: [],
    isLoading: false,
    error: null,

    fetchDashboardStats: async () => {
      try {
        set({ isLoading: true, error: null });
        const [overview, tickets, sessions] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getTicketStats(),
          dashboardApi.getSessionStats(),
        ]);
        const stats: DashboardStats = {
          total_contacts: overview?.total_contacts || 0,
          total_sessions: sessions?.total_sessions || 0,
          open_tickets: tickets?.status_stats?.open || 0,
          response_rate: overview?.response_rate || 0,
          total_messages: overview?.total_messages || 0,
          active_sessions: sessions?.active_sessions || 0,
          resolved_tickets_today: tickets?.resolved_today || 0,
          new_contacts_today: overview?.new_contacts_today || 0,
        };
        set({ stats, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load dashboard stats',
          isLoading: false,
        });
      }
    },

    fetchRecentActivity: async () => {
      try {
        set({ error: null });
        const data = await dashboardApi.getRecentActivity();
        if (data && data.activities) {
          const activities: RecentActivity[] = data.activities.map((activity: any) => ({
            id: activity.id || activity.type,
            type: activity.type,
            title: activity.title || activity.description,
            description: activity.description,
            timestamp: activity.timestamp,
            icon: activity.icon || 'Activity',
            color: activity.color || 'bg-gray-100 text-gray-600',
          }));
          set({ recentActivities: activities });
        } else {
          set({ recentActivities: [] });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load recent activity',
        });
      }
    },

    fetchSystemStatus: async () => {
      try {
        set({ error: null });
        const data = await dashboardApi.getSystemStatus();
        if (data) {
          const systemStatus: SystemStatus[] = data.map((status: any) => ({
            name: status.name,
            status: status.status,
            uptime: status.uptime,
            last_check: status.last_check,
          }));
          set({ systemStatus });
        } else {
          set({ systemStatus: [] });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load system status',
        });
      }
    },

    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
  }))
);

export const useDashboardStats = () => useDashboardStore((state) => state.stats);
export const useRecentActivities = () => useDashboardStore((state) => state.recentActivities);
export const useSystemStatus = () => useDashboardStore((state) => state.systemStatus);
export const useDashboardLoading = () => useDashboardStore((state) => state.isLoading);
export const useDashboardError = () => useDashboardStore((state) => state.error); 