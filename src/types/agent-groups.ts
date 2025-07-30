// Agent Groups - Type Definitions
// Comprehensive TypeScript interfaces for agent group management

// Core Group Interface
export interface AgentGroup {
  id: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  createdBy: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Optional relationships (loaded based on context)
  creator?: AdminSummary;
  members?: AdminSummary[];
}

// Simplified admin info for group contexts
export interface AdminSummary {
  id: number;
  username: string;
  role: 'admin' | 'cs' | 'viewer';
  isActive: boolean;
  avatar?: string;
}

// API Request Types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface AddMembersRequest {
  adminIds: number[];
}

export interface RemoveMembersRequest {
  adminIds: number[];
}

export interface BulkAssignRequest {
  adminIds: number[];
}

// API Response Types
export interface BulkAssignResponse {
  groupId: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  successful: number[];
  failed: BulkAssignError[];
}

export interface BulkAssignError {
  adminId: number;
  error: string;
}

export interface BulkRemoveResponse {
  groupId: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  successful: number[];
  failed: BulkRemoveError[];
}

export interface BulkRemoveError {
  adminId: number;
  error: string;
}

// Statistics and Analytics
export interface GroupStats {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  totalMembers: number;
  byRole: Record<string, number>;
  groupSizes: {
    small: number;  // 1-5 members
    medium: number; // 6-15 members
    large: number;  // 16+ members
  };
  recentActivity: GroupActivity[];
}

export interface GroupActivity {
  id: string;
  groupId: number;
  groupName: string;
  adminId: number;
  adminName: string;
  action: 'created' | 'member_added' | 'member_removed' | 'updated' | 'deleted';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Filtering and Search
export interface GroupFilters {
  isActive?: boolean;
  createdBy?: number;
  name?: string;
  color?: string;
  memberCount?: {
    min?: number;
    max?: number;
  };
  role?: 'admin' | 'cs' | 'viewer';
  search?: string;
}

export interface GroupSearchRequest {
  query: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GroupFilterRequest {
  isActive?: boolean;
  createdBy?: number;
  name?: string;
  color?: string;
  page?: number;
  limit?: number;
}

// Validation
export interface ValidateGroupNameRequest {
  name: string;
  excludeId?: number;
}

export interface ValidateGroupNameResponse {
  valid: boolean;
  message?: string;
}

// Generic Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Enhanced Response Types
export interface AgentGroupResponse extends AgentGroup {
  creator?: AdminSummary;
  members?: AdminSummary[];
}

export interface AgentGroupListResponse {
  groups: AgentGroupResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AgentGroupMemberResponse extends AdminSummary {
  joinedAt: string;
  addedBy: number;
  addedByUser?: AdminSummary;
}

// Store State Types
export interface GroupState {
  groups: AgentGroup[];
  selectedGroup: AgentGroup | null;
  groupStats: GroupStats | null;
  groupFilters: GroupFilters;
  
  // Loading states
  isLoadingGroups: boolean;
  isCreatingGroup: boolean;
  isUpdatingGroup: boolean;
  isDeletingGroup: boolean;
  isLoadingStats: boolean;
  
  // Selection states
  selectedGroupIds: number[];
  isBulkProcessing: boolean;
  
  // UI states
  showCreateModal: boolean;
  showEditModal: boolean;
  showMemberModal: boolean;
  error: string | null;
}

// Store Action Types
export interface GroupActions {
  // CRUD Operations
  loadGroups: (filters?: GroupFilters) => Promise<void>;
  loadGroupById: (id: number) => Promise<void>;
  createGroup: (data: CreateGroupRequest) => Promise<AgentGroup>;
  updateGroup: (id: number, data: UpdateGroupRequest) => Promise<AgentGroup>;
  deleteGroup: (id: number) => Promise<void>;
  
  // Membership Management
  loadGroupMembers: (groupId: number) => Promise<AdminSummary[]>;
  addMembersToGroup: (groupId: number, adminIds: number[]) => Promise<void>;
  removeMembersFromGroup: (groupId: number, adminIds: number[]) => Promise<void>;
  bulkAssignMembers: (groupId: number, adminIds: number[]) => Promise<BulkAssignResponse>;
  bulkRemoveMembers: (groupId: number, adminIds: number[]) => Promise<BulkRemoveResponse>;
  
  // Statistics and Search
  loadGroupStats: () => Promise<void>;
  searchGroups: (query: string) => Promise<void>;
  filterGroups: (filters: GroupFilters) => Promise<void>;
  clearGroupFilters: () => void;
  
  // Selection Management
  selectGroup: (id: number) => void;
  selectAllGroups: () => void;
  clearGroupSelection: () => void;
  
  // UI State Management
  setSelectedGroup: (group: AgentGroup | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowMemberModal: (show: boolean) => void;
  clearError: () => void;
  
  // Utility Functions
  getGroupById: (id: number) => AgentGroup | undefined;
  getGroupsByMemberCount: (min: number, max: number) => AgentGroup[];
  getActiveGroups: () => AgentGroup[];
  getInactiveGroups: () => AgentGroup[];
}

// WebSocket Event Types
export interface GroupWebSocketEvents {
  'group_created': (data: { group: AgentGroup; timestamp: string }) => void;
  'group_updated': (data: { group: AgentGroup; timestamp: string }) => void;
  'group_deleted': (data: { groupId: number; timestamp: string }) => void;
  'group_member_added': (data: { groupId: number; adminId: number; timestamp: string }) => void;
  'group_member_removed': (data: { groupId: number; adminId: number; timestamp: string }) => void;
  'group_activity': (data: GroupActivity) => void;
}

// Component Prop Types
export interface GroupCardProps {
  group: AgentGroup;
  onEdit?: (group: AgentGroup) => void;
  onDelete?: (group: AgentGroup) => void;
  onViewMembers?: (group: AgentGroup) => void;
  isSelected?: boolean;
  onSelect?: (group: AgentGroup) => void;
  className?: string;
}

export interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: AgentGroup; // For editing
  onSave: (data: CreateGroupRequest | UpdateGroupRequest) => Promise<void>;
}

export interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: AgentGroup;
  availableAgents: AdminSummary[];
  onUpdateMembers: (groupId: number, memberIds: number[]) => Promise<void>;
}

// Utility Types
export type GroupRole = 'admin' | 'cs' | 'viewer';
export type GroupStatus = 'active' | 'inactive';
export type GroupSize = 'small' | 'medium' | 'large';
export type GroupAction = 'created' | 'member_added' | 'member_removed' | 'updated' | 'deleted';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'memberCount' | 'createdAt' | 'updatedAt';

// Color Constants
export const GROUP_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#0EA5E9', // Sky Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
] as const;

export type GroupColor = typeof GROUP_COLORS[number];

// Default Values
export const DEFAULT_GROUP_FILTERS: GroupFilters = {};

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
} as const;

export const GROUP_SIZE_THRESHOLDS = {
  small: { min: 1, max: 5 },
  medium: { min: 6, max: 15 },
  large: { min: 16, max: Infinity },
} as const;