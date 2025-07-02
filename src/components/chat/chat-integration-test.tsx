"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatStore } from '@/lib/stores/chat';
import { authApi, contactsApi, messagesApi, ticketsApi, quickReplyApi } from '@/lib/api';

export default function ChatIntegrationTest() {
  const [testResults, setTestResults] = useState<Record<string, { status: 'pending' | 'success' | 'error'; message: string }>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [credentials, setCredentials] = useState({ username: 'agent', password: 'agent123' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handleLogin = async () => {
    try {
      await runTest('Authentication', async () => {
        const response = await authApi.login(credentials);
        setIsAuthenticated(true);
        return response;
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const runAllTests = async () => {
    if (!isAuthenticated) {
      await handleLogin();
      return;
    }

    setIsRunning(true);
    clearError();

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

    await runTest('Chat Store - Load Quick Reply Templates', async () => {
      await loadQuickReplyTemplates();
      return { templatesCount: quickReplyTemplates.length };
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

  const successfulTests = Object.values(testResults).filter(r => r.status === 'success').length;
  const totalTests = Object.keys(testResults).length;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Chat Integration Test
            <div className="flex items-center space-x-2">
              {totalTests > 0 && (
                <Badge className={successfulTests === totalTests ? 'bg-green-500' : 'bg-yellow-500'}>
                  {successfulTests}/{totalTests} Tests Passed
                </Badge>
              )}
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="ml-4"
              >
                {isRunning ? 'Running Tests...' : (isAuthenticated ? 'Run All Tests' : 'Login & Test')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAuthenticated && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium mb-3">Authentication Required</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="admin123"
                  />
                </div>
              </div>
            </div>
          )}

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
            
            {Object.keys(testResults).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {isAuthenticated 
                  ? 'Click "Run All Tests" to start integration testing'
                  : 'Enter credentials and click "Login & Test" to start'
                }
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <div className="font-medium text-red-800">Store Error:</div>
              <div className="text-red-600">{error}</div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Authentication: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
                  <div>Conversations: {conversations.length}</div>
                  <div>Quick Reply Templates: {quickReplyTemplates.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Total Tests: {totalTests}</div>
                  <div>Successful: {successfulTests}</div>
                  <div>Failed: {Object.values(testResults).filter(r => r.status === 'error').length}</div>
                  <div>Pending: {Object.values(testResults).filter(r => r.status === 'pending').length}</div>
                  {totalTests > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(successfulTests / totalTests) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((successfulTests / totalTests) * 100)}% Success Rate
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
