'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Server, 
  Wifi, 
  WifiOff, 
  Info,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { getWebSocketManager } from '@/lib/websocket';

interface DataModeStatus {
  apiMode: 'mock' | 'real';
  wsMode: 'mock' | 'real';
  isConnected: boolean;
  backendUrl: string;
  wsUrl: string;
}

export function DataModeIndicator() {
  const [status, setStatus] = React.useState<DataModeStatus>({
    apiMode: 'mock',
    wsMode: 'mock', 
    isConnected: false,
    backendUrl: '',
    wsUrl: ''
  });

  React.useEffect(() => {
    // Determine current data mode
    const useRealData = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';
    const useMockGroups = process.env.NODE_ENV === 'development' && 
                         process.env.NEXT_PUBLIC_USE_MOCK_GROUPS !== 'false' &&
                         process.env.NEXT_PUBLIC_USE_REAL_DATA !== 'true';
    const useRealWS = process.env.NEXT_PUBLIC_USE_REAL_WS === 'true' || useRealData;

    const ws = getWebSocketManager();
    
    setStatus({
      apiMode: useMockGroups ? 'mock' : 'real',
      wsMode: useRealWS ? 'real' : 'mock',
      isConnected: ws?.isSocketConnected() ?? false,
      backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws/connect'
    });

    // Listen for WebSocket connection changes
    if (ws) {
      const handleConnection = () => setStatus(prev => ({ ...prev, isConnected: true }));
      const handleDisconnection = () => setStatus(prev => ({ ...prev, isConnected: false }));

      ws.on('connection_established', handleConnection);
      ws.on('connection_lost', handleDisconnection);
      ws.on('connection_error', handleDisconnection);

      return () => {
        ws.off('connection_established', handleConnection);
        ws.off('connection_lost', handleDisconnection);
        ws.off('connection_error', handleDisconnection);
      };
    }
  }, []);

  const refreshPage = () => {
    window.location.reload();
  };

  const testConnection = async () => {
    try {
      const response = await fetch(status.backendUrl + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        alert('✅ Backend connection successful!');
      } else {
        alert(`❌ Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      alert(`❌ Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isUsingRealData = status.apiMode === 'real' || status.wsMode === 'real';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source Configuration
          {isUsingRealData ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Server className="h-3 w-3" />
              Real Backend
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Mock Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              API Mode
            </h4>
            <Badge variant={status.apiMode === 'real' ? 'default' : 'secondary'}>
              {status.apiMode === 'real' ? 'Real Backend' : 'Mock Data'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {status.apiMode === 'real' ? status.backendUrl : 'Using local mock data'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              {status.isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              WebSocket Mode
            </h4>
            <Badge variant={status.wsMode === 'real' ? 'default' : 'secondary'}>
              {status.wsMode === 'real' ? 'Real WebSocket' : 'Mock Events'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {status.wsMode === 'real' ? status.wsUrl : 'Using simulated events'}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2">
          {isUsingRealData && status.isConnected && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Connected to real backend successfully
              </span>
            </div>
          )}

          {isUsingRealData && !status.isConnected && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                Real backend configured but not connected
              </span>
            </div>
          )}

          {!isUsingRealData && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Using mock data for development
              </span>
            </div>
          )}
        </div>

        {/* Environment Variables Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Environment Configuration:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>NEXT_PUBLIC_USE_REAL_DATA:</strong> {process.env.NEXT_PUBLIC_USE_REAL_DATA || 'undefined'}</div>
            <div><strong>NEXT_PUBLIC_USE_MOCK_GROUPS:</strong> {process.env.NEXT_PUBLIC_USE_MOCK_GROUPS || 'undefined'}</div>
            <div><strong>NEXT_PUBLIC_USE_REAL_WS:</strong> {process.env.NEXT_PUBLIC_USE_REAL_WS || 'undefined'}</div>
            <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isUsingRealData && (
            <Button onClick={testConnection} variant="outline" size="sm">
              Test Backend Connection
            </Button>
          )}
          <Button onClick={refreshPage} variant="outline" size="sm">
            Refresh Application
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          <p><strong>To use real backend data:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Set <code>NEXT_PUBLIC_USE_REAL_DATA=true</code> in your .env.local</li>
            <li>Ensure your backend is running on the configured URL</li>
            <li>Refresh the application to apply changes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}