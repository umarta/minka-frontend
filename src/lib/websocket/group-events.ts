// Real-time WebSocket integration for Agent Groups
// Handles production WebSocket events for group management

import { getWebSocketManager } from '@/lib/websocket';
import { AgentGroup, GroupActivity } from '@/types/agent-groups';

export interface GroupWebSocketEvents {
  group_created: { group: AgentGroup; timestamp: string };
  group_updated: { group: AgentGroup; timestamp: string };
  group_deleted: { groupId: number; timestamp: string };
  group_member_added: { groupId: number; adminId: number; timestamp: string };
  group_member_removed: { groupId: number; adminId: number; timestamp: string };
  group_activity: GroupActivity;
}

export class GroupWebSocketService {
  private ws = getWebSocketManager();
  
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.ws) return;

    // Join the groups room when connected
    this.ws.on('connection_established', () => {
      this.ws?.joinAllGroupsRoom();
      console.log('[Group WS] Joined groups room for real-time updates');
    });
  }

  // Subscribe to group events
  onGroupCreated(callback: (data: GroupWebSocketEvents['group_created']) => void) {
    this.ws?.on('group_created', callback);
    return () => this.ws?.off('group_created', callback);
  }

  onGroupUpdated(callback: (data: GroupWebSocketEvents['group_updated']) => void) {
    this.ws?.on('group_updated', callback);
    return () => this.ws?.off('group_updated', callback);
  }

  onGroupDeleted(callback: (data: GroupWebSocketEvents['group_deleted']) => void) {
    this.ws?.on('group_deleted', callback);
    return () => this.ws?.off('group_deleted', callback);
  }

  onGroupMemberAdded(callback: (data: GroupWebSocketEvents['group_member_added']) => void) {
    this.ws?.on('group_member_added', callback);
    return () => this.ws?.off('group_member_added', callback);
  }

  onGroupMemberRemoved(callback: (data: GroupWebSocketEvents['group_member_removed']) => void) {
    this.ws?.on('group_member_removed', callback);
    return () => this.ws?.off('group_member_removed', callback);
  }

  onGroupActivity(callback: (data: GroupWebSocketEvents['group_activity']) => void) {
    this.ws?.on('group_activity', callback);
    return () => this.ws?.off('group_activity', callback);
  }

  // Join/leave specific group rooms for more targeted updates
  joinGroupRoom(groupId: number) {
    this.ws?.joinGroupRoom(groupId);
  }

  leaveGroupRoom(groupId: number) {
    this.ws?.leaveGroupRoom(groupId);
  }

  // Send group-related actions to the server (if supported)
  sendGroupAction(action: string, data: any) {
    if (this.ws?.isSocketConnected()) {
      // This would send actions to the real backend WebSocket
      const message = {
        type: 'group_action',
        action,
        data,
        timestamp: new Date().toISOString()
      };
      
      // In a real implementation, you'd send this to the WebSocket
      console.log('[Group WS] Would send to server:', message);
    }
  }

  // Utility method to check connection status
  isConnected(): boolean {
    return this.ws?.isSocketConnected() ?? false;
  }

  // Clean up all group event listeners
  cleanup() {
    if (this.ws) {
      this.ws.leaveAllGroupsRoom();
      this.ws.off('group_created');
      this.ws.off('group_updated');
      this.ws.off('group_deleted');
      this.ws.off('group_member_added');
      this.ws.off('group_member_removed');
      this.ws.off('group_activity');
    }
  }
}

// Singleton instance
let groupWebSocketService: GroupWebSocketService | null = null;

export const getGroupWebSocketService = (): GroupWebSocketService => {
  if (!groupWebSocketService) {
    groupWebSocketService = new GroupWebSocketService();
  }
  return groupWebSocketService;
};

// Environment-based WebSocket integration
export const useRealTimeGroups = (
  onGroupCreated?: (data: GroupWebSocketEvents['group_created']) => void,
  onGroupUpdated?: (data: GroupWebSocketEvents['group_updated']) => void,
  onGroupDeleted?: (data: GroupWebSocketEvents['group_deleted']) => void,
  onGroupMemberAdded?: (data: GroupWebSocketEvents['group_member_added']) => void,
  onGroupMemberRemoved?: (data: GroupWebSocketEvents['group_member_removed']) => void,
  onGroupActivity?: (data: GroupWebSocketEvents['group_activity']) => void
) => {
  const service = getGroupWebSocketService();
  
  // Set up subscriptions if callbacks are provided
  const unsubscribeFunctions: (() => void)[] = [];
  
  if (onGroupCreated) {
    unsubscribeFunctions.push(service.onGroupCreated(onGroupCreated));
  }
  if (onGroupUpdated) {
    unsubscribeFunctions.push(service.onGroupUpdated(onGroupUpdated));
  }
  if (onGroupDeleted) {
    unsubscribeFunctions.push(service.onGroupDeleted(onGroupDeleted));
  }
  if (onGroupMemberAdded) {
    unsubscribeFunctions.push(service.onGroupMemberAdded(onGroupMemberAdded));
  }
  if (onGroupMemberRemoved) {
    unsubscribeFunctions.push(service.onGroupMemberRemoved(onGroupMemberRemoved));
  }
  if (onGroupActivity) {
    unsubscribeFunctions.push(service.onGroupActivity(onGroupActivity));
  }

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsub => unsub());
  };
};

export default GroupWebSocketService;