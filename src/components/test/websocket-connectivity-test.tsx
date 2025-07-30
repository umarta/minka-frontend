'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wifi, 
  WifiOff, 
  Play, 
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  Globe,
  Zap
} from 'lucide-react';
import { getWebSocketManager, createWebSocketManager } from '@/lib/websocket';

interface ConnectionEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status: 'success' | 'error' | 'info';
}

export function WebSocketConnectivityTest() {
  const [events, setEvents] = useState<ConnectionEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'mock' | 'real' | 'none'>('none');
  const [isTesting, setIsTesting] = useState(false);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws/connect';
  const isUsingRealWS = process.env.NEXT_PUBLIC_USE_REAL_WS === 'true' || 
                       process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';

  const addEvent = (type: string, message: string, status: 'success' | 'error' | 'info' = 'info') => {
    const event: ConnectionEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      status
    };
    setEvents(prev => [event, ...prev].slice(0, 20)); // Keep last 20 events
  };

  useEffect(() => {
    const ws = getWebSocketManager();
    if (!ws) {
      addEvent('initialization', 'WebSocket manager not found', 'error');
      return;
    }

    // Check initial connection status
    const checkConnection = () => {
      const connected = ws.isSocketConnected();
      setIsConnected(connected);
      
      // Determine connection type
      const usingMock = process.env.NODE_ENV === 'development' && 
                       process.env.NEXT_PUBLIC_USE_REAL_WS !== 'true' && 
                       process.env.NEXT_PUBLIC_USE_REAL_DATA !== 'true';
      setConnectionType(connected ? (usingMock ? 'mock' : 'real') : 'none');
    };

    checkConnection();

    // Set up event listeners
    const handleConnectionEstablished = (data: any) => {
      setIsConnected(true);
      setConnectionType(data.mock ? 'mock' : 'real');
      addEvent('connection_established', 
        `WebSocket connected (${data.mock ? 'Mock' : 'Real'} mode)`, 
        'success');
    };

    const handleConnectionLost = (data: any) => {
      setIsConnected(false);
      setConnectionType('none');
      addEvent('connection_lost', 
        `WebSocket disconnected: ${data.reason || 'Unknown reason'}`, 
        'error');
    };

    const handleConnectionError = (data: any) => {
      setIsConnected(false);
      setConnectionType('none');
      addEvent('connection_error', 
        `WebSocket error: ${data.message || 'Connection failed'}`, 
        'error');
    };

    // Subscribe to connection events
    ws.on('connection_established', handleConnectionEstablished);
    ws.on('connection_lost', handleConnectionLost);
    ws.on('connection_error', handleConnectionError);

    // Add some group event listeners for testing
    const handleGroupEvent = (eventType: string) => (data: any) => {
      addEvent(eventType, 
        `Group event received: ${JSON.stringify(data).substring(0, 100)}...`, 
        'success');
    };

    ws.on('group_created', handleGroupEvent('group_created'));
    ws.on('group_updated', handleGroupEvent('group_updated'));
    ws.on('group_deleted', handleGroupEvent('group_deleted'));
    ws.on('group_member_added', handleGroupEvent('group_member_added'));
    ws.on('group_member_removed', handleGroupEvent('group_member_removed'));

    return () => {
      ws.off('connection_established', handleConnectionEstablished);
      ws.off('connection_lost', handleConnectionLost);
      ws.off('connection_error', handleConnectionError);
      ws.off('group_created');
      ws.off('group_updated');
      ws.off('group_deleted');
      ws.off('group_member_added');
      ws.off('group_member_removed');
    };
  }, []);

  const testWebSocketConnection = async () => {
    setIsTesting(true);
    addEvent('test_start', 'Starting WebSocket connection test...', 'info');

    try {
      // Test basic WebSocket connectivity
      if (isUsingRealWS) {
        addEvent('config_check', `Testing real WebSocket connection to: ${WS_URL}`, 'info');
        
        // Try to create a test WebSocket connection
        const testSocket = new WebSocket(WS_URL);
        
        const connectionPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            testSocket.close();
            reject(new Error('Connection timeout (5s)'));
          }, 5000);

          testSocket.onopen = () => {
            clearTimeout(timeout);
            addEvent('connection_test', 'Direct WebSocket connection successful', 'success');
            testSocket.close();
            resolve();
          };

          testSocket.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection failed'));
          };

          testSocket.onclose = (event) => {
            if (event.wasClean) {
              addEvent('connection_test', 'WebSocket connection closed cleanly', 'success');
            }
          };
        });

        await connectionPromise;
      } else {
        addEvent('config_check', 'Using mock WebSocket events (no real connection test needed)', 'info');
      }

      // Test WebSocket manager
      const ws = getWebSocketManager();
      if (ws) {
        const managerConnected = ws.isSocketConnected();
        addEvent('manager_test', 
          `WebSocket manager status: ${managerConnected ? 'Connected' : 'Disconnected'}`, 
          managerConnected ? 'success' : 'error');

        // Test room joining
        ws.joinAllGroupsRoom();
        addEvent('room_test', 'Joined groups room for real-time updates', 'success');

        ws.joinGroupRoom(1);
        addEvent('room_test', 'Joined specific group room (ID: 1)', 'success');
      } else {
        addEvent('manager_test', 'WebSocket manager not available', 'error');
      }

    } catch (error) {
      addEvent('connection_error', 
        `WebSocket test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'error');
    }

    setIsTesting(false);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventIcon = (status: 'success' | 'error' | 'info') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConnectionStatusBadge = () => {
    if (isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          {connectionType === 'mock' ? 'Mock Connected' : 'Real Connected'}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            WebSocket Connectivity Test
            {getConnectionStatusBadge()}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={testWebSocketConnection} 
              disabled={isTesting}
              size="sm"
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={clearEvents} variant="ghost" size="sm">
              Clear Events
            </Button>
          </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            WebSocket URL: <code className="text-xs bg-muted px-1 rounded">{WS_URL}</code>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Mode: {isUsingRealWS ? 'Real WebSocket' : 'Mock Events'} 
            {connectionType !== 'none' && `(${connectionType} connection)`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click "Test Connection" to verify WebSocket connectivity</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.status)}
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
                    <p className="text-sm text-foreground">
                      {event.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm mb-2">WebSocket Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>NEXT_PUBLIC_USE_REAL_WS:</strong> {process.env.NEXT_PUBLIC_USE_REAL_WS || 'undefined'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_USE_REAL_DATA:</strong> {process.env.NEXT_PUBLIC_USE_REAL_DATA || 'undefined'}
            </div>
            <div>
              <strong>Connection Type:</strong> {connectionType}
            </div>
            <div>
              <strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}