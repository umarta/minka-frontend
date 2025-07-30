// Agents API Service
// Handles all HTTP communication with the backend for agent management

import axios, { AxiosError, AxiosResponse } from 'axios';
import { tokenManager } from '@/lib/api';
import {
  Agent,
  CreateAgentData,
  UpdateAgentData,
  AgentFilters,
  PaginatedAgentResponse,
  AgentPerformanceMetrics,
  AgentActivity,
  AgentStatusUpdate,
} from '@/types/agent';

// Create dedicated axios instance for agents
const agentAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
agentAxios.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
agentAxios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenManager.removeTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper functions for response handling
const handleApiResponse = <T>(response: AxiosResponse<any>): T => {
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data as T;
  }
  throw new Error(response.data.error || response.data.message || 'API request failed');
};

const handleRawApiResponse = (response: AxiosResponse<any>): any => {
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.error || response.data.message || 'API request failed');
};

const handleApiError = (error: AxiosError<any>) => {
  if (error.response?.data) {
    const { message, error: errorMessage } = error.response.data;
    throw new Error(message || errorMessage || 'Request failed');
  }
  throw new Error(error.message || 'Network error');
};

// Data transformation functions to map backend response to frontend types

/**
 * Transform backend agent response to Agent interface
 */
const transformAgent = (backendAgent: any): Agent => {
  return {
    id: backendAgent.id,
    username: backendAgent.username,
    email: backendAgent.email,
    role: backendAgent.role as 'admin' | 'cs' | 'viewer',
    isActive: backendAgent.is_active,
    lastLoginAt: backendAgent.last_login_at,
    createdAt: backendAgent.created_at,
    updatedAt: backendAgent.updated_at,
    // Extended fields for UI
    fullName: backendAgent.full_name || backendAgent.username,
    avatar: backendAgent.avatar,
    phone: backendAgent.phone,
    department: backendAgent.department || 'General',
    onlineStatus: backendAgent.online_status || 'offline',
    lastSeen: backendAgent.last_seen || backendAgent.last_login_at || backendAgent.updated_at,
    currentTickets: backendAgent.current_tickets || 0,
    totalTicketsHandled: backendAgent.total_tickets_handled || 0,
    // Performance metrics (default values if not provided)
    avgResponseTime: backendAgent.avg_response_time || 0,
    customerSatisfaction: backendAgent.customer_satisfaction || 0,
    ticketsResolvedToday: backendAgent.tickets_resolved_today || 0,
    messagesHandledToday: backendAgent.messages_handled_today || 0,
    onlineHoursToday: backendAgent.online_hours_today || 0,
    // Group relationships
    groups: backendAgent.groups?.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6',
      isActive: group.is_active,
      createdBy: group.created_by,
      memberCount: group.member_count || 0,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    })),
    primaryGroup: backendAgent.primary_group ? {
      id: backendAgent.primary_group.id,
      name: backendAgent.primary_group.name,
      description: backendAgent.primary_group.description || '',
      color: backendAgent.primary_group.color || '#3B82F6',
      isActive: backendAgent.primary_group.is_active,
      createdBy: backendAgent.primary_group.created_by,
      memberCount: backendAgent.primary_group.member_count || 0,
      createdAt: backendAgent.primary_group.created_at,
      updatedAt: backendAgent.primary_group.updated_at,
    } : undefined,
    groupCount: backendAgent.group_count || backendAgent.groups?.length || 0,
  };
};

/**
 * Transform backend paginated response to frontend PaginatedAgentResponse
 */
const transformPaginatedResponse = (backendResponse: any): PaginatedAgentResponse => {
  return {
    data: backendResponse.data.map(transformAgent),
    meta: {
      total: backendResponse.meta.total,
      page: backendResponse.meta.pagination?.page || backendResponse.meta.page,
      limit: backendResponse.meta.pagination?.limit || backendResponse.meta.limit,
      totalPages: backendResponse.meta.pagination?.total_pages || backendResponse.meta.totalPages,
    },
  };
};

/**
 * Transform backend activity to AgentActivity
 */
const transformAgentActivity = (backendActivity: any): AgentActivity => {
  return {
    id: backendActivity.id,
    agentId: backendActivity.agent_id,
    type: backendActivity.type,
    description: backendActivity.description,
    timestamp: backendActivity.timestamp || backendActivity.created_at,
    metadata: backendActivity.metadata,
  };
};

class AgentAPI {
  private baseUrl = '/admin/users';

  // CRUD Operations

  /**
   * Get all agents with pagination and filtering
   */
  async getAll(filters: AgentFilters = {}): Promise<PaginatedAgentResponse> {
    try {
      const params: any = {};

      // Add pagination parameters only if filtering/pagination is needed
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      // Add filter parameters
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.onlineStatus) params.online_status = filters.onlineStatus;
      if (filters.department) params.department = filters.department;
      if (filters.search) params.search = filters.search;
      if (filters.performanceLevel) params.performance_level = filters.performanceLevel;
      if (filters.groupId) params.group_id = filters.groupId;
      if (filters.hasGroups !== undefined) params.has_groups = filters.hasGroups;
      
      // Handle nested group count filter
      if (filters.groupCount) {
        if (filters.groupCount.min !== undefined) params['group_count.min'] = filters.groupCount.min;
        if (filters.groupCount.max !== undefined) params['group_count.max'] = filters.groupCount.max;
      }

      const response = await agentAxios.get(this.baseUrl, { params });
      
      // Handle both paginated and non-paginated responses
      if (response.data.success && response.data.data !== undefined) {
        const rawData = response.data.data;
        
        // Check if it's already a paginated response
        if (rawData && typeof rawData === 'object' && 'data' in rawData && 'meta' in rawData) {
          return transformPaginatedResponse(rawData);
        }
        
        // If it's a simple array, wrap it in pagination structure
        if (Array.isArray(rawData)) {
          const transformedAgents = rawData.map(transformAgent);
          const page = filters.page || 1;
          const limit = filters.limit || 20;
          const total = transformedAgents.length;
          
          // Apply client-side pagination if needed
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedData = transformedAgents.slice(startIndex, endIndex);
          
          return {
            data: paginatedData,
            meta: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
            },
          };
        }
      }
      
      throw new Error(response.data.error || response.data.message || 'API request failed');
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getById(id: number): Promise<Agent> {
    try {
      const response = await agentAxios.get(`${this.baseUrl}/${id}`);
      const rawData = handleApiResponse(response);
      return transformAgent(rawData);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Create new agent
   */
  async create(data: CreateAgentData): Promise<Agent> {
    try {
      // Transform frontend data to backend format
      const backendData = {
        username: data.username,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        department: data.department,
        phone: data.phone || null,
        password: data.password,
      };

      const response = await agentAxios.post(this.baseUrl, backendData);
      const rawData = handleApiResponse(response);
      return transformAgent(rawData);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Update existing agent
   */
  async update(id: number, data: UpdateAgentData): Promise<Agent> {
    try {
      // Transform frontend data to backend format
      const backendData: any = {};
      if (data.username !== undefined) backendData.username = data.username;
      if (data.email !== undefined) backendData.email = data.email;
      if (data.fullName !== undefined) backendData.full_name = data.fullName;
      if (data.role !== undefined) backendData.role = data.role;
      if (data.department !== undefined) backendData.department = data.department;
      if (data.phone !== undefined) backendData.phone = data.phone;
      if (data.isActive !== undefined) backendData.is_active = data.isActive;

      const response = await agentAxios.put(`${this.baseUrl}/${id}`, backendData);
      const rawData = handleApiResponse(response);
      return transformAgent(rawData);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Delete agent
   */
  async delete(id: number): Promise<void> {
    try {
      await agentAxios.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Update agent status (activate/deactivate)
   */
  async updateStatus(id: number, isActive: boolean): Promise<Agent> {
    try {
      const response = await agentAxios.patch(`${this.baseUrl}/${id}/status`, {
        is_active: isActive
      });
      const rawData = handleApiResponse(response);
      return transformAgent(rawData);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Update agent online status
   */
  async updateOnlineStatus(id: number, onlineStatus: 'online' | 'offline' | 'away' | 'busy'): Promise<void> {
    try {
      await agentAxios.patch(`${this.baseUrl}/${id}/online-status`, {
        online_status: onlineStatus
      });
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Reset agent password
   */
  async resetPassword(id: number, newPassword: string): Promise<void> {
    try {
      await agentAxios.patch(`${this.baseUrl}/${id}/password`, {
        password: newPassword
      });
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Search and Filtering

  /**
   * Search agents by username, email, or full name
   */
  async search(query: string, page = 1, limit = 20): Promise<PaginatedAgentResponse> {
    try {
      const response = await agentAxios.get(`${this.baseUrl}/search`, {
        params: {
          query: encodeURIComponent(query),
          page: page.toString(),
          limit: limit.toString(),
        }
      });
      const rawData = handleRawApiResponse(response);
      return transformPaginatedResponse(rawData);
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Get agents by role
   */
  async getByRole(role: 'admin' | 'cs' | 'viewer', page = 1, limit = 20): Promise<PaginatedAgentResponse> {
    return this.getAll({ role, page, limit });
  }

  /**
   * Get agents by department
   */
  async getByDepartment(department: string, page = 1, limit = 20): Promise<PaginatedAgentResponse> {
    return this.getAll({ department, page, limit });
  }

  /**
   * Get agents by online status
   */
  async getByOnlineStatus(onlineStatus: 'online' | 'offline' | 'away' | 'busy', page = 1, limit = 20): Promise<PaginatedAgentResponse> {
    return this.getAll({ onlineStatus, page, limit });
  }

  /**
   * Get active agents only
   */
  async getActiveAgents(page = 1, limit = 20): Promise<PaginatedAgentResponse> {
    return this.getAll({ status: 'active', page, limit });
  }

  // Performance and Activity

  /**
   * Get agent performance metrics
   */
  async getPerformanceMetrics(id: number, startDate?: string, endDate?: string): Promise<AgentPerformanceMetrics[]> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await agentAxios.get(`${this.baseUrl}/${id}/performance`, { params });
      const rawData = handleApiResponse(response);
      
      return Array.isArray(rawData) ? rawData.map((metric: any) => ({
        agentId: metric.agent_id,
        date: metric.date,
        messagesHandled: metric.messages_handled,
        avgResponseTime: metric.avg_response_time,
        customerSatisfaction: metric.customer_satisfaction,
        ticketsResolved: metric.tickets_resolved,
        onlineHours: metric.online_hours,
        slaCompliance: metric.sla_compliance,
      })) : [];
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Get agent activity history
   */
  async getActivity(id: number, page = 1, limit = 50): Promise<AgentActivity[]> {
    try {
      const response = await agentAxios.get(`${this.baseUrl}/${id}/activity`, {
        params: { page, limit }
      });
      const rawData = handleApiResponse(response);
      return Array.isArray(rawData) ? rawData.map(transformAgentActivity) : [];
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Bulk Operations

  /**
   * Bulk update agent status
   */
  async bulkUpdateStatus(agentIds: number[], isActive: boolean): Promise<{ updated: number; failed: number }> {
    try {
      const response = await agentAxios.patch(`${this.baseUrl}/bulk/status`, {
        agent_ids: agentIds,
        is_active: isActive
      });
      const rawData = handleApiResponse(response);
      return {
        updated: (rawData as any).updated || 0,
        failed: (rawData as any).failed || 0
      };
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Bulk delete agents
   */
  async bulkDelete(agentIds: number[]): Promise<{ deleted: number; failed: number }> {
    try {
      const response = await agentAxios.delete(`${this.baseUrl}/bulk`, {
        data: { agent_ids: agentIds }
      });
      const rawData = handleApiResponse(response);
      return {
        deleted: (rawData as any).deleted || 0,
        failed: (rawData as any).failed || 0
      };
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Statistics and Analytics

  /**
   * Get agent statistics
   */
  async getStats(): Promise<{
    totalAgents: number;
    activeAgents: number;
    onlineAgents: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
    avgPerformance: {
      responseTime: number;
      satisfaction: number;
      ticketsPerDay: number;
    };
  }> {
    try {
      const response = await agentAxios.get(`${this.baseUrl}/stats`);
      const rawData = handleApiResponse(response);
      
      return {
        totalAgents: (rawData as any).total_agents,
        activeAgents: (rawData as any).active_agents,
        onlineAgents: (rawData as any).online_agents,
        byRole: (rawData as any).by_role || {},
        byDepartment: (rawData as any).by_department || {},
        avgPerformance: {
          responseTime: (rawData as any).avg_performance?.response_time || 0,
          satisfaction: (rawData as any).avg_performance?.satisfaction || 0,
          ticketsPerDay: (rawData as any).avg_performance?.tickets_per_day || 0,
        },
      };
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();
export default agentAPI;