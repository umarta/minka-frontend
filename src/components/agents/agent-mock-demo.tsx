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
  Star
} from 'lucide-react';

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
  } = useAgentStore();

  React.useEffect(() => {
    // Load initial data
    loadAgents();
    loadStats();
  }, [loadAgents, loadStats]);

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
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-red-800">
            <h3 className="font-medium">Error loading mock data</h3>
            <p className="text-sm mt-1">{error}</p>
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
      {/* Demo Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Mock Data System Demo</h3>
        </div>
        <p className="text-blue-700 text-sm">
          This demonstrates the comprehensive mock data system with {agents.length} agents, 
          real-time status updates, and performance metrics. All data is generated locally 
          for development without requiring a backend.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.online || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.offline || 0}</div>
            <p className="text-xs text-muted-foreground">
              Not available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
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
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
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

      {/* Sample Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sample Agents ({agents.slice(0, 8).length} of {agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agents.slice(0, 8).map((agent) => (
              <div key={agent.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>
                      {agent.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(agent.onlineStatus)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {agent.fullName}
                    </p>
                    <Badge variant={getRoleBadgeVariant(agent.role)} className="text-xs">
                      {agent.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{agent.department}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">
                        {agent.customerSatisfaction.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-600">
                        {agent.avgResponseTime.toFixed(1)}m
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
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
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity (Real-time Mock Events)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentActivity.slice(0, 10).map((activity) => {
                const agent = agents.find(a => a.id === activity.agentId);
                return (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    <div className="text-xs text-gray-500 w-16">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{agent?.fullName || `Agent ${activity.agentId}`}</span>
                      <span className="text-gray-600 ml-2">{activity.description}</span>
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

      {/* Mock Data Controls */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">Mock Data Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadAgents()}
            >
              Refresh Data
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
              onClick={() => window.location.reload()}
            >
              Reset Demo
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mock WebSocket events are automatically simulated. Check the browser console for event logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}