'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { AgentMockDataDemo } from '@/components/agents/agent-mock-demo';
import { BackendConnectivityTest } from '@/components/test/backend-connectivity-test';
import { WebSocketConnectivityTest } from '@/components/test/websocket-connectivity-test';
import { FieldMappingTest } from '@/components/test/field-mapping-test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AgentsPage() {
  const isUsingRealData = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true' ||
                         (process.env.NODE_ENV === 'development' && 
                          process.env.NEXT_PUBLIC_USE_MOCK_GROUPS === 'false');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Agents</h1>
          <p className="text-gray-600">
            {isUsingRealData ? (
              'Comprehensive agent management system with real backend integration'
            ) : (
              'Comprehensive agent management system with mock data for development'
            )}
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Agent Dashboard</TabsTrigger>
            {isUsingRealData && (
              <TabsTrigger value="connectivity">Backend Test</TabsTrigger>
            )}
            <TabsTrigger value="websocket">WebSocket Test</TabsTrigger>
            {isUsingRealData && (
              <TabsTrigger value="mapping">Field Mapping Test</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <AgentMockDataDemo />
          </TabsContent>
          
          {isUsingRealData && (
            <TabsContent value="connectivity" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Backend Connectivity Test</h2>
                <p className="text-gray-600 mb-4">
                  Test the connection to your real backend API and verify all agent group endpoints are working correctly.
                </p>
              </div>
              <BackendConnectivityTest />
            </TabsContent>
          )}
          
          <TabsContent value="websocket" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">WebSocket Connectivity Test</h2>
              <p className="text-gray-600 mb-4">
                Test real-time WebSocket connections for live updates. This works with both mock events and real backend WebSocket connections.
              </p>
            </div>
            <WebSocketConnectivityTest />
          </TabsContent>
          
          {isUsingRealData && (
            <TabsContent value="mapping" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Field Mapping Test</h2>
                <p className="text-gray-600 mb-4">
                  Test field transformation from backend snake_case to frontend camelCase. Verifies that data mapping is working correctly.
                </p>
              </div>
              <FieldMappingTest />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
} 