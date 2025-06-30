'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Smartphone, 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Session } from '@/types';

interface SessionStatsProps {
  sessions: Session[];
}

export function SessionStats({ sessions }: SessionStatsProps) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'working').length;
  const pendingSessions = sessions.filter(s => s.status === 'scan_qr_code').length;
  const failedSessions = sessions.filter(s => s.status === 'failed').length;
  const stoppedSessions = sessions.filter(s => s.status === 'stopped').length;
  
  const healthyPercentage = totalSessions > 0 ? (activeSessions / totalSessions) * 100 : 0;
  const connectedSessions = sessions.filter(s => s.phone_number);
  
  const totalMessages = sessions.reduce((sum, session) => {
    return sum + (session.messages_sent || 0) + (session.messages_received || 0);
  }, 0);

  const getHealthStatus = () => {
    if (healthyPercentage >= 80) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (healthyPercentage >= 60) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (healthyPercentage >= 40) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const health = getHealthStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${health.bgColor}`}>
              <Activity className={`h-4 w-4 ${health.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{health.status}</span>
                <span className="text-xs text-gray-500">{Math.round(healthyPercentage)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300" 
                  style={{ width: `${healthyPercentage}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {activeSessions} of {totalSessions} sessions active
          </p>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm">Connected</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                {connectedSessions.length}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Disconnected</span>
              </div>
              <Badge variant="outline" className="text-gray-600">
                {totalSessions - connectedSessions.length}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pending QR</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">
                {pendingSessions}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Session Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">● Working</span>
              <span className="font-medium">{activeSessions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600">● Pending</span>
              <span className="font-medium">{pendingSessions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">● Failed</span>
              <span className="font-medium">{failedSessions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">● Stopped</span>
              <span className="font-medium">{stoppedSessions}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{totalMessages.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Messages</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{connectedSessions.length}</p>
                <p className="text-xs text-gray-500">Active Chats</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 