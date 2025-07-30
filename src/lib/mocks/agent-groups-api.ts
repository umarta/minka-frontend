// Agent Groups - Mock API Implementation
// Simulates backend API responses with realistic delays and validation

import { mockAgentGroupData } from './agent-groups';
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
  ValidateGroupNameResponse,
  DEFAULT_PAGINATION,
  GROUP_COLORS,
} from '@/types/agent-groups';

// Simulate network delay
const delay = (ms: number = 300): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Simulate random network failures (5% chance)
const simulateNetworkError = (): void => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Unable to connect to server');
  }
};

export class MockAgentGroupAPI {
  // CRUD Operations
  
  /**
   * Get all agent groups with pagination and filtering
   */
  async getAll(
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit
  ): Promise<PaginatedResponse<AgentGroup>> {
    await delay(250);
    simulateNetworkError();
    
    const allGroups = mockAgentGroupData.getGroups();
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedGroups = allGroups.slice(start, end);
    
    return {
      data: paginatedGroups,
      meta: {
        total: allGroups.length,
        page,
        limit,
        totalPages: Math.ceil(allGroups.length / limit),
      },
    };
  }

  /**
   * Get agent group by ID
   */
  async getById(id: number): Promise<AgentGroup> {
    await delay(200);
    simulateNetworkError();
    
    const group = mockAgentGroupData.getGroupById(id);
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }
    
    return group;
  }

  /**
   * Create new agent group
   */
  async create(data: CreateGroupRequest): Promise<AgentGroup> {
    await delay(400);
    simulateNetworkError();
    
    // Validate input data
    if (!data.name?.trim()) {
      throw new Error('Group name is required');
    }
    
    if (data.name.trim().length < 3) {
      throw new Error('Group name must be at least 3 characters long');
    }
    
    if (data.name.trim().length > 50) {
      throw new Error('Group name cannot exceed 50 characters');
    }
    
    // Check for duplicate names
    const existingGroups = mockAgentGroupData.getGroups();
    if (existingGroups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error('A group with this name already exists');
    }
    
    // Validate color if provided
    if (data.color && !GROUP_COLORS.includes(data.color as any)) {
      throw new Error('Invalid color selection');
    }
    
    // Create new group
    const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
    const newGroup = mockAgentGroupData.addGroup({
      name: data.name.trim(),
      description: data.description?.trim() || '',
      color: data.color || GROUP_COLORS[0],
      isActive: true,
      createdBy: currentUser.id,
      memberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: currentUser,
      members: [],
    });
    
    // Add activity
    mockAgentGroupData.addActivity({
      groupId: newGroup.id,
      groupName: newGroup.name,
      adminId: currentUser.id,
      adminName: this.getAdminDisplayName(currentUser),
      action: 'created',
      description: `Created group "${newGroup.name}"`,
      metadata: { groupColor: newGroup.color },
    });
    
    return newGroup;
  }

  /**
   * Update existing agent group
   */
  async update(id: number, data: UpdateGroupRequest): Promise<AgentGroup> {
    await delay(350);
    simulateNetworkError();
    
    const existingGroup = mockAgentGroupData.getGroupById(id);
    if (!existingGroup) {
      throw new Error(`Group with ID ${id} not found`);
    }
    
    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        throw new Error('Group name is required');
      }
      
      if (data.name.trim().length < 3) {
        throw new Error('Group name must be at least 3 characters long');
      }
      
      if (data.name.trim().length > 50) {
        throw new Error('Group name cannot exceed 50 characters');
      }
      
      // Check for duplicate names (excluding current group)
      const existingGroups = mockAgentGroupData.getGroups();
      if (existingGroups.some(g => 
        g.id !== id && g.name.toLowerCase() === data.name!.toLowerCase()
      )) {
        throw new Error('A group with this name already exists');
      }
    }
    
    // Validate color if provided
    if (data.color && !GROUP_COLORS.includes(data.color as any)) {
      throw new Error('Invalid color selection');
    }
    
    // Update group
    const updatedData: Partial<AgentGroup> = {};
    if (data.name !== undefined) updatedData.name = data.name.trim();
    if (data.description !== undefined) updatedData.description = data.description.trim();
    if (data.color !== undefined) updatedData.color = data.color;
    if (data.isActive !== undefined) updatedData.isActive = data.isActive;
    
    const updatedGroup = mockAgentGroupData.updateGroup(id, updatedData);
    if (!updatedGroup) {
      throw new Error('Failed to update group');
    }
    
    // Add activity
    const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
    mockAgentGroupData.addActivity({
      groupId: id,
      groupName: updatedGroup.name,
      adminId: currentUser.id,
      adminName: this.getAdminDisplayName(currentUser),
      action: 'updated',
      description: `Updated group "${updatedGroup.name}"`,
      metadata: { changes: Object.keys(updatedData) },
    });
    
    return updatedGroup;
  }

  /**
   * Delete agent group
   */
  async delete(id: number): Promise<void> {
    await delay(250);
    simulateNetworkError();
    
    const group = mockAgentGroupData.getGroupById(id);
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }
    
    // Check if group has members (optional business rule)
    if (group.memberCount > 0) {
      throw new Error('Cannot delete group with active members. Please remove all members first.');
    }
    
    // Add activity before deletion
    const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
    mockAgentGroupData.addActivity({
      groupId: id,
      groupName: group.name,
      adminId: currentUser.id,
      adminName: this.getAdminDisplayName(currentUser),
      action: 'deleted',
      description: `Deleted group "${group.name}"`,
      metadata: { deletedMemberCount: group.memberCount },
    });
    
    // Delete group
    const deleted = mockAgentGroupData.deleteGroup(id);
    if (!deleted) {
      throw new Error('Failed to delete group');
    }
  }

  // Membership Management
  
  /**
   * Get all members of a group
   */
  async getMembers(groupId: number): Promise<AdminSummary[]> {
    await delay(200);
    simulateNetworkError();
    
    const group = mockAgentGroupData.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    
    return group.members || [];
  }

  /**
   * Add members to a group
   */
  async addMembers(groupId: number, adminIds: number[]): Promise<void> {
    await delay(300);
    simulateNetworkError();
    
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      throw new Error('At least one admin ID is required');
    }
    
    const group = mockAgentGroupData.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    
    // Validate all admin IDs exist
    const allAdmins = mockAgentGroupData.getAdmins();
    const invalidIds = adminIds.filter(id => !allAdmins.find(admin => admin.id === id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid admin IDs: ${invalidIds.join(', ')}`);
    }
    
    // Add members
    let addedCount = 0;
    adminIds.forEach(adminId => {
      if (mockAgentGroupData.addMemberToGroup(groupId, adminId)) {
        addedCount++;
      }
    });
    
    // Add activity
    if (addedCount > 0) {
      const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
      mockAgentGroupData.addActivity({
        groupId,
        groupName: group.name,
        adminId: currentUser.id,
        adminName: this.getAdminDisplayName(currentUser),
        action: 'member_added',
        description: `Added ${addedCount} member(s) to group "${group.name}"`,
        metadata: { addedMembers: adminIds },
      });
    }
  }

  /**
   * Remove members from a group
   */
  async removeMembers(groupId: number, adminIds: number[]): Promise<void> {
    await delay(300);
    simulateNetworkError();
    
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      throw new Error('At least one admin ID is required');
    }
    
    const group = mockAgentGroupData.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    
    // Remove members
    let removedCount = 0;
    adminIds.forEach(adminId => {
      if (mockAgentGroupData.removeMemberFromGroup(groupId, adminId)) {
        removedCount++;
      }
    });
    
    // Add activity
    if (removedCount > 0) {
      const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
      mockAgentGroupData.addActivity({
        groupId,
        groupName: group.name,
        adminId: currentUser.id,
        adminName: this.getAdminDisplayName(currentUser),
        action: 'member_removed',
        description: `Removed ${removedCount} member(s) from group "${group.name}"`,
        metadata: { removedMembers: adminIds },
      });
    }
  }

  /**
   * Remove single member from a group
   */
  async removeMember(groupId: number, adminId: number): Promise<void> {
    return this.removeMembers(groupId, [adminId]);
  }

  // Bulk Operations
  
  /**
   * Bulk assign admins to a group with detailed response
   */
  async bulkAssignMembers(groupId: number, adminIds: number[]): Promise<BulkAssignResponse> {
    await delay(500);
    simulateNetworkError();
    
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      throw new Error('At least one admin ID is required');
    }
    
    const group = mockAgentGroupData.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    
    const allAdmins = mockAgentGroupData.getAdmins();
    const successful: number[] = [];
    const failed: { adminId: number; error: string }[] = [];
    
    adminIds.forEach(adminId => {
      try {
        const admin = allAdmins.find(a => a.id === adminId);
        if (!admin) {
          failed.push({ adminId, error: 'Admin not found' });
          return;
        }
        
        if (!admin.isActive) {
          failed.push({ adminId, error: 'Admin is inactive' });
          return;
        }
        
        if (group.members?.find(m => m.id === adminId)) {
          failed.push({ adminId, error: 'Already a member of this group' });
          return;
        }
        
        if (mockAgentGroupData.addMemberToGroup(groupId, adminId)) {
          successful.push(adminId);
        } else {
          failed.push({ adminId, error: 'Failed to add to group' });
        }
      } catch (error) {
        failed.push({ 
          adminId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
    
    // Add activity
    if (successful.length > 0) {
      const currentUser = mockAgentGroupData.getActiveAdmins()[0]; // Mock current user
      mockAgentGroupData.addActivity({
        groupId,
        groupName: group.name,
        adminId: currentUser.id,
        adminName: this.getAdminDisplayName(currentUser),
        action: 'member_added',
        description: `Bulk assigned ${successful.length} member(s) to group "${group.name}"`,
        metadata: { 
          successful: successful.length,
          failed: failed.length,
          totalAttempted: adminIds.length,
        },
      });
    }
    
    return {
      groupId,
      totalCount: adminIds.length,
      successCount: successful.length,
      failureCount: failed.length,
      successful,
      failed,
    };
  }

  // Statistics and Analytics
  
  /**
   * Get comprehensive group statistics
   */
  async getStats(): Promise<GroupStats> {
    await delay(200);
    simulateNetworkError();
    
    return mockAgentGroupData.getStats();
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
    await delay(250);
    simulateNetworkError();
    
    if (!query?.trim()) {
      throw new Error('Search query is required');
    }
    
    const filteredGroups = mockAgentGroupData.searchGroups(query.trim());
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedGroups = filteredGroups.slice(start, end);
    
    return {
      data: paginatedGroups,
      meta: {
        total: filteredGroups.length,
        page,
        limit,
        totalPages: Math.ceil(filteredGroups.length / limit),
      },
    };
  }

  /**
   * Filter groups based on criteria
   */
  async getByFilter(
    filters: GroupFilters,
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit
  ): Promise<PaginatedResponse<AgentGroup>> {
    await delay(250);
    simulateNetworkError();
    
    const filteredGroups = mockAgentGroupData.filterGroups(filters);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedGroups = filteredGroups.slice(start, end);
    
    return {
      data: paginatedGroups,
      meta: {
        total: filteredGroups.length,
        page,
        limit,
        totalPages: Math.ceil(filteredGroups.length / limit),
      },
    };
  }

  // Admin Group Queries
  
  /**
   * Get all groups that a specific admin belongs to
   */
  async getGroupsByAdmin(adminId: number): Promise<AgentGroup[]> {
    await delay(200);
    simulateNetworkError();
    
    const admin = mockAgentGroupData.getAdminById(adminId);
    if (!admin) {
      throw new Error(`Admin with ID ${adminId} not found`);
    }
    
    const allGroups = mockAgentGroupData.getGroups();
    return allGroups.filter(group => 
      group.members?.some(member => member.id === adminId)
    );
  }

  // Validation
  
  /**
   * Validate group name availability
   */
  async validateGroupName(data: { name: string; excludeId?: number }): Promise<ValidateGroupNameResponse> {
    await delay(150);
    simulateNetworkError();
    
    if (!data.name?.trim()) {
      return {
        valid: false,
        message: 'Group name is required',
      };
    }
    
    if (data.name.trim().length < 3) {
      return {
        valid: false,
        message: 'Group name must be at least 3 characters long',
      };
    }
    
    if (data.name.trim().length > 50) {
      return {
        valid: false,
        message: 'Group name cannot exceed 50 characters',
      };
    }
    
    // Check for duplicates
    const existingGroups = mockAgentGroupData.getGroups();
    const duplicate = existingGroups.find(g => 
      g.name.toLowerCase() === data.name.toLowerCase() && 
      g.id !== data.excludeId
    );
    
    if (duplicate) {
      return {
        valid: false,
        message: 'A group with this name already exists',
      };
    }
    
    return {
      valid: true,
    };
  }

  // Utility Methods
  
  /**
   * Get all active groups
   */
  async getActiveGroups(): Promise<AgentGroup[]> {
    await delay(200);
    simulateNetworkError();
    
    return mockAgentGroupData.getActiveGroups();
  }

  /**
   * Get groups by role (groups that have members with specific role)
   */
  async getGroupsByRole(role: 'admin' | 'cs' | 'viewer'): Promise<AgentGroup[]> {
    await delay(200);
    simulateNetworkError();
    
    return mockAgentGroupData.filterGroups({ role });
  }

  /**
   * Get groups by size category
   */
  async getGroupsBySize(size: 'small' | 'medium' | 'large'): Promise<AgentGroup[]> {
    await delay(200);
    simulateNetworkError();
    
    return mockAgentGroupData.getGroupsBySize(size);
  }

  // Helper methods
  
  private getAdminDisplayName(admin: AdminSummary): string {
    return admin.username
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  // Development utilities
  
  /**
   * Reset all mock data (for testing)
   */
  async resetData(): Promise<void> {
    await delay(100);
    mockAgentGroupData.regenerateData();
  }

  /**
   * Get all activities (for debugging)
   */
  async getAllActivities(): Promise<GroupActivity[]> {
    await delay(100);
    return mockAgentGroupData.getActivities();
  }
}

// Export singleton instance
export const mockAgentGroupAPI = new MockAgentGroupAPI();