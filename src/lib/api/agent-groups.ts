// Agent Groups API Service
// Handles all HTTP communication with the backend for group management

import axios, { AxiosError, AxiosResponse } from 'axios';
import { tokenManager } from '@/lib/api';
import {
  AgentGroup,
  AdminSummary,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMembersRequest,
  RemoveMembersRequest,
  BulkAssignRequest,
  BulkAssignResponse,
  BulkRemoveResponse,
  GroupStats,
  GroupFilters,
  GroupSearchRequest,
  GroupFilterRequest,
  ValidateGroupNameRequest,
  ValidateGroupNameResponse,
  PaginatedResponse,
  ApiResponse,
  DEFAULT_PAGINATION,
} from '@/types/agent-groups';

// Create dedicated axios instance for agent groups
const agentGroupAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
agentGroupAxios.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
agentGroupAxios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle token refresh if needed
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

const handleApiError = (error: AxiosError<ApiResponse>) => {
  if (error.response?.data) {
    const { message, error: errorMessage } = error.response.data;
    throw new Error(message || errorMessage || 'Request failed');
  }
  throw new Error(error.message || 'Network error');
};

// Data transformation functions to map backend response to frontend types

/**
 * Transform backend admin response to AdminSummary
 */
const transformAdminSummary = (backendAdmin: any): AdminSummary => {
  return {
    id: backendAdmin.id,
    username: backendAdmin.username,
    role: backendAdmin.role as 'admin' | 'cs' | 'viewer',
    isActive: backendAdmin.is_active,
    avatar: backendAdmin.avatar,
  };
};

/**
 * Transform backend group response to AgentGroup
 */
const transformAgentGroup = (backendGroup: any): AgentGroup => {
  return {
    id: backendGroup.id,
    name: backendGroup.name,
    description: backendGroup.description,
    color: backendGroup.color,
    isActive: backendGroup.is_active,
    createdBy: backendGroup.created_by,
    memberCount: backendGroup.member_count || 0, // Default to 0 if not provided
    createdAt: backendGroup.created_at,
    updatedAt: backendGroup.updated_at,
    creator: backendGroup.creator ? transformAdminSummary(backendGroup.creator) : undefined,
    members: backendGroup.members ? backendGroup.members.map(transformAdminSummary) : undefined,
  };
};

/**
 * Transform backend paginated response to frontend PaginatedResponse
 */
const transformPaginatedResponse = <T>(
  backendResponse: any,
  transformFn: (item: any) => T
): PaginatedResponse<T> => {
  return {
    data: backendResponse.data.map(transformFn),
    meta: {
      total: backendResponse.meta.total,
      page: backendResponse.meta.pagination.page,
      limit: backendResponse.meta.pagination.limit,
      totalPages: backendResponse.meta.pagination.total_pages,
    },
  };
};

/**
 * Transform backend group stats to frontend GroupStats
 */
const transformGroupStats = (backendStats: any): GroupStats => {
  return {
    totalGroups: backendStats.total_groups,
    activeGroups: backendStats.active_groups,
    inactiveGroups: backendStats.inactive_groups,
    totalMembers: backendStats.total_members,
    byRole: backendStats.by_role || {},
    groupSizes: {
      small: backendStats.group_sizes?.small || 0,
      medium: backendStats.group_sizes?.medium || 0,
      large: backendStats.group_sizes?.large || 0,
    },
    recentActivity: [], // We can populate this later if the backend provides it
  };
};

class AgentGroupAPI {
  private baseUrl = '/admin/groups';

  // CRUD Operations

  /**
   * Get all agent groups with pagination
   */
  async getAll(
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit
  ): Promise<PaginatedResponse<AgentGroup>> {
    try {
      const response = await agentGroupAxios.get(this.baseUrl, {
        params: { page, limit }
      });
      const rawData = handleRawApiResponse(response);
      return transformPaginatedResponse(rawData, transformAgentGroup);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Get agent group by ID
   */
  async getById(id: number): Promise<AgentGroup> {
    try {
      const response = await agentGroupAxios.get(`${this.baseUrl}/${id}`);
      const rawData = handleApiResponse(response);
      return transformAgentGroup(rawData);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Create new agent group
   */
  async create(data: CreateGroupRequest): Promise<AgentGroup> {
    try {
      const response = await agentGroupAxios.post(this.baseUrl, data);
      const rawData = handleApiResponse(response);
      return transformAgentGroup(rawData);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Update existing agent group
   */
  async update(id: number, data: UpdateGroupRequest): Promise<AgentGroup> {
    try {
      const response = await agentGroupAxios.put(`${this.baseUrl}/${id}`, data);
      const rawData = handleApiResponse(response);
      return transformAgentGroup(rawData);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Delete agent group
   */
  async delete(id: number): Promise<void> {
    try {
      await agentGroupAxios.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Membership Management

  /**
   * Get all members of a group
   */
  async getMembers(groupId: number): Promise<AdminSummary[]> {
    try {
      const response = await agentGroupAxios.get(`${this.baseUrl}/${groupId}/members`);
      const rawData = handleApiResponse(response);
      return Array.isArray(rawData) ? rawData.map(transformAdminSummary) : [];
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Add members to a group
   */
  async addMembers(groupId: number, adminIds: number[]): Promise<void> {
    try {
      const data: AddMembersRequest = { adminIds };
      await agentGroupAxios.post(`${this.baseUrl}/${groupId}/members`, data);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Remove members from a group
   */
  async removeMembers(groupId: number, adminIds: number[]): Promise<void> {
    try {
      const data: RemoveMembersRequest = { adminIds };
      await agentGroupAxios.delete(`${this.baseUrl}/${groupId}/members`, { data });
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Remove single member from a group
   */
  async removeMember(groupId: number, adminId: number): Promise<void> {
    try {
      await agentGroupAxios.delete(`${this.baseUrl}/${groupId}/members/${adminId}`);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Bulk Operations

  /**
   * Bulk assign admins to a group with detailed response
   */
  async bulkAssignMembers(groupId: number, adminIds: number[]): Promise<BulkAssignResponse> {
    try {
      const data: BulkAssignRequest = { adminIds };
      const response = await agentGroupAxios.post(`${this.baseUrl}/${groupId}/bulk-assign`, data);
      return handleApiResponse<BulkAssignResponse>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Statistics and Analytics

  /**
   * Get comprehensive group statistics
   */
  async getStats(): Promise<GroupStats> {
    try {
      const response = await agentGroupAxios.get(`${this.baseUrl}/stats`);
      const rawData = handleApiResponse(response);
      return transformGroupStats(rawData);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Search and Filtering

  /**
   * Search groups by name or description
   */
  async search(
    query: string,
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit
  ): Promise<PaginatedResponse<AgentGroup>> {
    try {
      const response = await agentGroupAxios.get(`${this.baseUrl}/search`, {
        params: {
          query: encodeURIComponent(query),
          page: page.toString(),
          limit: limit.toString(),
        }
      });
      const rawData = handleRawApiResponse(response);
      return transformPaginatedResponse(rawData, transformAgentGroup);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  /**
   * Filter groups based on criteria
   */
  async getByFilter(
    filters: GroupFilters,
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit
  ): Promise<PaginatedResponse<AgentGroup>> {
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Handle nested objects like memberCount
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (nestedValue !== undefined && nestedValue !== null) {
                params[`${key}.${nestedKey}`] = nestedValue.toString();
              }
            });
          } else {
            params[key] = value.toString();
          }
        }
      });

      const response = await agentGroupAxios.get(`${this.baseUrl}/filter`, { params });
      const rawData = handleRawApiResponse(response);
      return transformPaginatedResponse(rawData, transformAgentGroup);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Admin Group Queries

  /**
   * Get all groups that a specific admin belongs to
   */
  async getGroupsByAdmin(adminId: number): Promise<AgentGroup[]> {
    try {
      const response = await agentGroupAxios.get(`${this.baseUrl}/admin/${adminId}`);
      const rawData = handleApiResponse(response);
      return Array.isArray(rawData) ? rawData.map(transformAgentGroup) : [];
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Validation

  /**
   * Validate group name availability
   */
  async validateGroupName(data: ValidateGroupNameRequest): Promise<ValidateGroupNameResponse> {
    try {
      const response = await agentGroupAxios.post(`${this.baseUrl}/validate-name`, data);
      return handleApiResponse<ValidateGroupNameResponse>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      throw error;
    }
  }

  // Utility Methods

  /**
   * Get all active groups
   */
  async getActiveGroups(): Promise<AgentGroup[]> {
    const response = await this.getByFilter({ isActive: true }, 1, 100 as any);
    return response.data;
  }

  /**
   * Get groups by role (groups that have members with specific role)
   */
  async getGroupsByRole(role: 'admin' | 'cs' | 'viewer'): Promise<AgentGroup[]> {
    const response = await this.getByFilter({ role }, 1, 100 as any);
    return response.data;
  }

  /**
   * Get groups by size category
   */
  async getGroupsBySize(size: 'small' | 'medium' | 'large'): Promise<AgentGroup[]> {
    const sizeFilters = {
      small: { memberCount: { min: 1, max: 5 } },
      medium: { memberCount: { min: 6, max: 15 } },
      large: { memberCount: { min: 16 } },
    };

    const response = await this.getByFilter(sizeFilters[size], 1, 100 as any);
    return response.data;
  }

  /**
   * Check if group name is available (quick validation)
   */
  async isGroupNameAvailable(name: string, excludeId?: number): Promise<boolean> {
    try {
      const result = await this.validateGroupName({ name, excludeId });
      return result.valid;
    } catch (error) {
      console.error('Error validating group name:', error);
      return false;
    }
  }

  /**
   * Get group member count
   */
  async getMemberCount(groupId: number): Promise<number> {
    try {
      const members = await this.getMembers(groupId);
      return members.length;
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }

  /**
   * Get online members count for a group
   */
  async getOnlineMemberCount(groupId: number): Promise<number> {
    try {
      const members = await this.getMembers(groupId);
      return members.filter(member => member.isActive).length;
    } catch (error) {
      console.error('Error getting online member count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const agentGroupAPI = new AgentGroupAPI();

// Export class for testing or custom instances
export { AgentGroupAPI };

// Export default for convenience
export default agentGroupAPI;