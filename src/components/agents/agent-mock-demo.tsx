import React from 'react';
import { useAgentStore } from '@/lib/stores/agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Headphones,
  Activity,
  TrendingUp,
  Star,
  FolderOpen,
  Plus
} from 'lucide-react';
import { AgentGroupCard, AgentGroupCardGrid, AgentGroupCardSkeleton } from './groups/agent-group-card';
import { AgentGroupModal, CreateGroupButton } from './groups/agent-group-modal';
import { GroupMembershipModal } from './groups/group-membership-modal';
import { DataModeIndicator } from '@/components/admin/data-mode-indicator';
import { mockAgentGroupData } from '@/lib/mocks/agent-groups';
import { AgentGroup, AdminSummary } from '@/types/agent-groups';

export function AgentMockDataDemo() {
  const {
    agents,
    stats,
    isLoading,
    error,
    loadAgents,
    loadStats,
    onlineAgents,
    recentActivity,
    // Group-related state and actions
    groups,
    groupStats,
    isLoadingGroups,
    groupError,
    loadGroups,
    loadGroupStats,
    createGroup,
    updateGroup,
    deleteGroup,
    setSelectedGroup,
    addMembersToGroup,
    removeMembersFromGroup,
    showCreateGroupModal,
    showEditGroupModal,
    showMemberModal,
    setShowCreateGroupModal,
    setShowEditGroupModal,
    setShowMemberModal,
    selectedGroup,
  } = useAgentStore();

  // Local state for demo
  const [selectedGroupForEdit, setSelectedGroupForEdit] = React.useState<AgentGroup | null>(null);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = React.useState<AgentGroup | null>(null);

  React.useEffect(() => {
    // Load initial data
    loadAgents();
    loadStats();
    loadGroups();
    loadGroupStats();
  }, [loadAgents, loadStats, loadGroups, loadGroupStats]);

  // Group action handlers
  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleEditGroup = (group: AgentGroup) => {
    setSelectedGroupForEdit(group);
    setShowEditGroupModal(true);
  };

  const handleDeleteGroup = async (group: AgentGroup) => {
    if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        await deleteGroup(group.id);
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  };

  const handleViewMembers = (group: AgentGroup) => {
    setSelectedGroupForMembers(group);
    setShowMemberModal(true);
  };

  const handleSaveGroup = async (data: any) => {
    if (selectedGroupForEdit) {
      await updateGroup(selectedGroupForEdit.id, data);
    } else {
      await createGroup(data);
    }
  };

  const handleUpdateMembers = async (groupId: number, memberIds: number[]) => {
    // This is a simplified implementation - in real app, you'd handle additions/removals separately
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const currentMemberIds = new Set(group.members?.map(m => m.id) || []);
    const newMemberIds = new Set(memberIds);

    // Find additions and removals
    const toAdd = memberIds.filter(id => !currentMemberIds.has(id));
    const toRemove = (group.members?.map(m => m.id) || []).filter(id => !newMemberIds.has(id));

    // Apply changes
    if (toAdd.length > 0) {
      await addMembersToGroup(groupId, toAdd);
    }
    if (toRemove.length > 0) {
      await removeMembersFromGroup(groupId, toRemove);
    }
  };

  // Get available agents for member selection
  const availableAgents: AdminSummary[] = React.useMemo(() => {
    return mockAgentGroupData.getActiveAdmins();
  }, []);

  // Check if using real data
  const isUsingRealData = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true' ||
                         (process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_USE_MOCK_GROUPS === 'false');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const;
      case 'cs': return 'secondary' as const;
      case 'viewer': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2 animate-pulse">
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="text-red-800">
            <h3 className="font-medium">Error loading mock data</h3>
            <p className="mt-1 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => loadAgents()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Mode Indicator */}
      <DataModeIndicator />

      {/* Demo Header */}
      <div className={`border rounded-lg p-4 ${isUsingRealData ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex gap-2 items-center mb-2">
          <Activity className={`h-5 w-5 ${isUsingRealData ? 'text-green-600' : 'text-blue-600'}`} />
          <h3 className={`font-medium ${isUsingRealData ? 'text-green-900' : 'text-blue-900'}`}>
            {isUsingRealData ? 'Real Backend Integration Demo' : 'Mock Data System Demo'}
          </h3>
        </div>
        <p className={`text-sm ${isUsingRealData ? 'text-green-700' : 'text-blue-700'}`}>
          {isUsingRealData ? (
            <>
              This demonstrates the real backend integration with {agents.length} agents from your live database. 
              All operations connect to your actual backend API with real-time WebSocket updates.
            </>
          ) : (
            <>
              This demonstrates the comprehensive mock data system with {agents.length} agents, 
              real-time status updates, and performance metrics. All data is generated locally 
              for development without requiring a backend.
            </>
          )}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <UserCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.online || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <UserX className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.offline || 0}</div>
            <p className="text-xs text-muted-foreground">
              Not available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {agents.length > 0 
                ? (agents.reduce((sum, agent) => sum + agent.avgResponseTime, 0) / agents.length).toFixed(1)
                : '0'
              }m
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Headphones className="w-5 h-5" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.byRole).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
                    {role.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups Statistics */}
      {groupStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex gap-2 items-center text-sm font-medium">
                <FolderOpen className="w-4 h-4" />
                Total Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                {groupStats.activeGroups} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Total across all groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Group Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{groupStats.groupSizes?.small}</div>
                  <p className="text-xs text-gray-500">Small</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{groupStats.groupSizes?.medium}</div>
                  <p className="text-xs text-gray-500">Medium</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{groupStats.groupSizes?.large}</div>
                  <p className="text-xs text-gray-500">Large</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Groups Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex gap-2 items-center">
              <FolderOpen className="w-5 h-5" />
              Agent Groups ({groups?.length})
            </CardTitle>
            <CreateGroupButton onClick={handleCreateGroup} />
          </div>
        </CardHeader>
        <CardContent>
          {groupError && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {groupError}
            </div>
          )}
          
          {isLoadingGroups ? (
            <AgentGroupCardGrid>
              {Array.from({ length: 6 }, (_, i) => (
                <AgentGroupCardSkeleton key={i} />
              ))}
            </AgentGroupCardGrid>
          ) : groups?.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No groups yet</h3>
              <p className="mb-4 text-gray-600">
                Create your first agent group to organize your team
              </p>
              <CreateGroupButton onClick={handleCreateGroup} />
            </div>
          ) : (
            <AgentGroupCardGrid>
              {groups?.slice(0, 8).map((group) => (
                <AgentGroupCard
                  key={group.id}
                  group={group}
                  onEdit={handleEditGroup}
                  onDelete={handleDeleteGroup}
                  onViewMembers={handleViewMembers}
                />
              ))}
            </AgentGroupCardGrid>
          )}
          
          {groups?.length > 8 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All {groups.length} Groups
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Users className="w-5 h-5" />
            Sample Agents ({agents.slice(0, 8).length} of {agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agents.slice(0, 8).map((agent) => (
              <div key={agent.id} className="flex items-center p-3 space-x-4 rounded-lg border">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>
                      {agent.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.onlineStatus)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-center mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {agent.fullName}
                    </p>
                    <Badge variant={getRoleBadgeVariant(agent.role)} className="text-xs">
                      {agent.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{agent.department}</p>
                  <div className="flex gap-3 items-center mt-1">
                    <div className="flex gap-1 items-center">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">
                        {agent.customerSatisfaction.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-gray-600">
                        {agent.avgResponseTime.toFixed(1)}m
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600">
                        {agent.ticketsResolvedToday}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Activity className="w-5 h-5" />
              Recent Activity (Real-time Mock Events)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto space-y-2 max-h-64">
              {recentActivity.slice(0, 10).map((activity) => {
                const agent = agents.find(a => a.id === activity.agentId);
                return (
                  <div key={activity.id} className="flex gap-3 items-center text-sm">
                    <div className="w-16 text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{agent?.fullName || `Agent ${activity.agentId}`}</span>
                      <span className="ml-2 text-gray-600">{activity.description}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Controls */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">
            {isUsingRealData ? 'Real Data Controls' : 'Mock Data Controls'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadAgents()}
            >
              Refresh Agents
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadStats()}
            >
              Reload Stats
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                loadGroups();
                loadGroupStats();
              }}
            >
              Refresh Groups
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              {isUsingRealData ? 'Refresh App' : 'Reset Demo'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isUsingRealData ? (
              'Connected to real backend API with live WebSocket events. All operations persist to your database.'
            ) : (
              'Mock WebSocket events are automatically simulated. Agent groups data is fully functional with create, edit, delete, and member management capabilities.'
            )}
          </p>
        </CardContent>
      </Card>

      {/* Group Modals */}
      <AgentGroupModal
        isOpen={showCreateGroupModal || showEditGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setShowEditGroupModal(false);
          setSelectedGroupForEdit(null);
        }}
        group={selectedGroupForEdit || undefined}
        onSave={handleSaveGroup}
      />

      {selectedGroupForMembers && (
        <GroupMembershipModal
          isOpen={showMemberModal}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedGroupForMembers(null);
          }}
          group={selectedGroupForMembers}
          availableAgents={availableAgents}
          onUpdateMembers={handleUpdateMembers}
        />
      )}
    </div>
  );
}