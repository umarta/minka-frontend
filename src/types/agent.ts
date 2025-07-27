// Agent Management Types
export interface Agent {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'cs' | 'viewer';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Extended fields for UI
  fullName: string;
  avatar?: string;
  phone?: string;
  department: string;
  onlineStatus: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  currentTickets: number;
  totalTicketsHandled: number;
  // Performance metrics
  avgResponseTime: number; // in minutes
  customerSatisfaction: number; // 1-5 scale
  ticketsResolvedToday: number;
  messagesHandledToday: number;
  onlineHoursToday: number;
}

export interface AgentPerformanceMetrics {
  agentId: number;
  date: string;
  messagesHandled: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  ticketsResolved: number;
  onlineHours: number;
  slaCompliance: number; // percentage
}

export interface AgentActivity {
  id: string;
  agentId: number;
  type: 'login' | 'logout' | 'status_change' | 'ticket_assigned' | 'ticket_resolved' | 'message_sent';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentFilters {
  role?: 'admin' | 'cs' | 'viewer';
  status?: 'active' | 'inactive';
  onlineStatus?: 'online' | 'offline' | 'away' | 'busy';
  department?: string;
  search?: string;
  performanceLevel?: 'high' | 'medium' | 'low';
  page?: number;
  limit?: number;
}

export interface CreateAgentData {
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'cs' | 'viewer';
  department: string;
  phone?: string;
  password: string;
}

export interface UpdateAgentData {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'cs' | 'viewer';
  department?: string;
  phone?: string;
  isActive?: boolean;
}

export interface AgentStatusUpdate {
  agentId: number;
  onlineStatus: 'online' | 'offline' | 'away' | 'busy';
  timestamp: string;
}

export interface PaginatedAgentResponse {
  data: Agent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// WebSocket Events for real-time updates
export interface AgentWebSocketEvents {
  'agent_online': (data: { agentId: number; timestamp: string }) => void;
  'agent_offline': (data: { agentId: number; timestamp: string }) => void;
  'agent_status_change': (data: { agentId: number; status: string; timestamp: string }) => void;
  'agent_activity': (data: AgentActivity) => void;
  'performance_update': (data: { agentId: number; metric: string; value: number }) => void;
}

export type AgentRole = 'admin' | 'cs' | 'viewer';
export type AgentStatus = 'active' | 'inactive';
export type OnlineStatus = 'online' | 'offline' | 'away' | 'busy';
export type PerformanceLevel = 'high' | 'medium' | 'low';