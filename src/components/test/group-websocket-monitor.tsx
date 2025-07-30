'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2, 
  Wifi, 
  WifiOff,
  FolderOpen
} from 'lucide-react';
import { useRealTimeGroups, getGroupWebSocketService } from '@/lib/websocket/group-events';
import { getWebSocketManager } from '@/lib/websocket';

interface WebSocketEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export function GroupWebSocketMonitor() {
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'mock' | 'real' | 'none'>('none');

  useEffect(() => {
    const ws = getWebSocketManager();
    if (!ws) return;

    // Check connection status
    const checkConnection = () => {
      const connected = ws.isSocketConnected();
      setIsConnected(connected);
      
      // Determine connection type based on environment
      const usingMock = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_REAL_WS !== 'true';
      setConnectionType(connected ? (usingMock ? 'mock' : 'real') : 'none');
    };

    checkConnection();
    
    // Set up connection status listeners
    ws.on('connection_established', (data) => {
      setIsConnected(true);
      setConnectionType(data.mock ? 'mock' : 'real');
      addEvent('connection_established', data);
    });

    ws.on('connection_lost', (data) => {
      setIsConnected(false);
      setConnectionType('none');
      addEvent('connection_lost', data);
    });

    ws.on('connection_error', (data) => {
      setIsConnected(false);
      setConnectionType('none');
      addEvent('connection_error', data);
    });

    // Cleanup function using the useRealTimeGroups hook
    const cleanup = useRealTimeGroups(
      (data) => addEvent('group_created', data),
      (data) => addEvent('group_updated', data),
      (data) => addEvent('group_deleted', data),
      (data) => addEvent('group_member_added', data),
      (data) => addEvent('group_member_removed', data),
      (data) => addEvent('group_activity', data)
    );

    return cleanup;
  }, []);

  const addEvent = (type: string, data: any) => {
    const event: WebSocketEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'group_created':
        return <FolderOpen className="h-4 w-4 text-green-500" />;
      case 'group_updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'group_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'group_member_added':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'group_member_removed':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'group_activity':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'connection_established':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connection_lost':
      case 'connection_error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: WebSocketEvent) => {
    const { type, data } = event;
    
    switch (type) {
      case 'group_created':
        return `Group "${data.group?.name || 'Unknown'}" was created`;
      case 'group_updated':
        return `Group "${data.group?.name || 'Unknown'}" was updated`;
      case 'group_deleted':
        return `Group ID ${data.groupId} was deleted`;
      case 'group_member_added':
        return `Admin ${data.adminId} was added to group ${data.groupId}`;
      case 'group_member_removed':
        return `Admin ${data.adminId} was removed from group ${data.groupId}`;
      case 'group_activity':
        return `${data.description} in group "${data.groupName}"`;
      case 'connection_established':
        return `WebSocket connected (${data.mock ? 'Mock' : 'Real'} mode)`;
      case 'connection_lost':
        return `WebSocket disconnected: ${data.reason || 'Unknown reason'}`;
      case 'connection_error':
        return 'WebSocket connection error';
      default:
        return `${type} event received`;
    }
  };

  const triggerTestEvent = () => {
    const service = getGroupWebSocketService();
    service.sendGroupAction('test_action', {
      message: 'This is a test event from the monitor',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group WebSocket Monitor
            </CardTitle>
            <Badge 
              variant={isConnected ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {connectionType === 'mock' ? 'Mock Connected' : 
               connectionType === 'real' ? 'Real Connected' : 
               'Disconnected'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={triggerTestEvent} size="sm" variant="outline">
              Send Test Event
            </Button>
            <Button onClick={clearEvents} size="sm" variant="ghost">
              Clear Events
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of agent group WebSocket events. 
          {connectionType === 'mock' && ' Using mock events for development.'}
          {connectionType === 'real' && ' Connected to real backend WebSocket.'}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events yet. Group events will appear here in real-time.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      {getEventDescription(event)}
                    </p>
                    {Object.keys(event.data).length > 0 && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          View raw data
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}