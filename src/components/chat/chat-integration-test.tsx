"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/lib/stores/chat';
import { authApi, contactsApi, messagesApi, ticketsApi, quickReplyApi } from '@/lib/api';

export default function ChatIntegrationTest() {
  const [testResults, setTestResults] = useState<Record<string, { status: 'pending' | 'success' | 'error'; message: string }>>({});
  const [isRunning, setIsRunning] = useState(false);

  const {
    loadConversations,
    loadQuickReplyTemplates,
    conversations,
    quickReplyTemplates,
    error,
    clearError
  } = useChatStore();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setTestResults(prev => ({ ...prev, [testName]: { status: 'pending', message: 'Running...' } }));
    
    try {
      const result = await testFn();
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { status: 'success', message: `Success: ${JSON.stringify(result).substring(0, 100)}...` } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { status: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` } 
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearError();

    await runTest('Authentication', async () => {
      const response = await authApi.getProfile();
      return response;
    });

    await runTest('Load Contacts', async () => {
      const response = await contactsApi.getAll({ page: 1, per_page: 10 });
      return response;
    });

    await runTest('Load Tickets', async () => {
      const response = await ticketsApi.getAll({ page: 1, per_page: 10 });
      return response;
    });

    await runTest('Load Quick Reply Templates', async () => {
      const response = await quickReplyApi.getAll();
      return response;
    });

    await runTest('Chat Store - Load Conversations', async () => {
      await loadConversations();
      return { conversationsCount: conversations.length };
    });

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Chat Integration Test
            <Button onClick={runAllTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Badge className={getStatusColor(result.status)}>
                  {result.status}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{testName}</div>
                  <div className="text-sm text-gray-600">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="text-red-800">Store Error: {error}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
