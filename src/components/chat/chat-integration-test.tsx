"use client";

import React, { useState, useRef } from 'react';
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

  // Tambahan: WebSocket Test State
  const [wsStatus, setWsStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'closed'>('idle');
  const [wsLog, setWsLog] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws/connect';

  const appendLog = (msg: string) => setWsLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleWsConnect = () => {
    if (wsRef.current) {
      appendLog('WebSocket already connected.');
      return;
    }
    setWsStatus('connecting');
    appendLog(`Connecting to ${wsUrl} ...`);
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      appendLog('WebSocket connected!');
      // Optionally send join_room/test message
      ws.send(JSON.stringify({ type: 'join_room', room: 'global' }));
      appendLog('Sent join_room for room "global"');
    };
    ws.onmessage = (event) => {
      appendLog(`Received: ${event.data}`);
    };
    ws.onerror = (event) => {
      setWsStatus('error');
      appendLog('WebSocket error');
    };
    ws.onclose = (event) => {
      setWsStatus('closed');
      appendLog(`WebSocket closed (code: ${event.code})`);
      wsRef.current = null;
    };
  };

  const handleWsDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsStatus('closed');
      appendLog('WebSocket manually disconnected.');
    }
  };

  const handleWsSendTest = () => {
    if (wsRef.current && wsStatus === 'connected') {
      const msg = { type: 'test', data: { hello: 'world' } };
      wsRef.current.send(JSON.stringify(msg));
      appendLog('Sent test message: ' + JSON.stringify(msg));
    } else {
      appendLog('WebSocket not connected.');
    }
  };

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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">WebSocket Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-2">
                  <Button onClick={handleWsConnect} disabled={wsStatus === 'connected' || wsStatus === 'connecting'}>Connect</Button>
                  <Button onClick={handleWsDisconnect} disabled={wsStatus !== 'connected'} variant="destructive">Disconnect</Button>
                  <Button onClick={handleWsSendTest} disabled={wsStatus !== 'connected'}>Send Test Message</Button>
                  <span className="ml-4">Status: <span className={
                    wsStatus === 'connected' ? 'text-green-600' : wsStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                  }>{wsStatus}</span></span>
                </div>
                <div className="bg-gray-100 rounded p-2 h-40 overflow-auto text-xs font-mono">
                  {wsLog.length === 0 ? <div className="text-gray-400">No log yet.</div> : wsLog.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">WebSocket Event Playground</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  {[
                    {event: 'message_received', data: {message_id: 1, ticket_id: 1, session_name: 'default', from: '6281234567890', body: 'Hello!', message_type: 'text', timestamp: new Date().toISOString()}},
                    {event: 'message_sent', data: {message_id: 2, ticket_id: 1, session_name: 'default', to: '6281234567890', body: 'Hi there!', message_type: 'text', timestamp: new Date().toISOString(), sender_admin_id: 1, sender_name: 'Admin'}},
                    {event: 'message_read', data: {message_id: 1, user_name: 'Admin'}},
                    {event: 'message_delivered', data: {message_id: 1, user_name: 'Admin'}},
                    {event: 'message:reaction_added', data: {message_id: 1, emoji: '👍', user_name: 'Admin', admin_id: 1}},
                    {event: 'message:reaction_removed', data: {message_id: 1, emoji: '👍', user_name: 'Admin', admin_id: 1}},
                    {event: 'message:edited', data: {message_id: 1, new_content: 'Edited message', edited_by: 'Admin'}},
                    {event: 'message:deleted', data: {message_id: 1, deleted_by: 'Admin'}},
                    {event: 'ticket_created', data: {ticket_id: 1, subject: 'New Ticket', created_by: 'Admin'}},
                    {event: 'ticket_assigned', data: {ticket_id: 1, assigned_to: 'Agent'}},
                    {event: 'ticket_status_changed', data: {ticket_id: 1, old_status: 'open', new_status: 'closed'}},
                    {event: 'ticket_closed', data: {ticket_id: 1, closed_by: 'Admin'}},
                    {event: 'session_status_changed', data: {session_id: 1, session_name: 'default', old_status: 'offline', new_status: 'online', timestamp: new Date().toISOString()}},
                    {event: 'session_connected', data: {session_id: 1, session_name: 'default', timestamp: new Date().toISOString()}},
                    {event: 'session_disconnected', data: {session_id: 1, session_name: 'default', timestamp: new Date().toISOString()}},
                    {event: 'qr_code_generated', data: {session_id: 1, session_name: 'default', qr_code: 'QR123', expires_at: Date.now() + 60000}},
                    {event: 'qr_code_scanned', data: {session_id: 1, session_name: 'default', phone_number: '6281234567890', user_name: 'User'}},
                    {event: 'qr_code_expired', data: {session_id: 1, session_name: 'default'}},
                    {event: 'typing_start', data: {contact_id: 1, user_name: 'Admin'}},
                    {event: 'typing_stop', data: {contact_id: 1, user_name: 'Admin'}},
                    {event: 'typing:started', data: {contact_id: 1, user_name: 'Admin'}},
                    {event: 'typing:stopped', data: {contact_id: 1, user_name: 'Admin'}},
                    {event: 'admin_online', data: {admin_id: 1, admin_name: 'Admin', timestamp: new Date().toISOString()}},
                    {event: 'admin_offline', data: {admin_id: 1, admin_name: 'Admin', timestamp: new Date().toISOString()}},
                    {event: 'file:upload:progress', data: {file_id: 'file1', file_name: 'test.jpg', progress: 50, status: 'uploading'}},
                    {event: 'file:upload:complete', data: {file_id: 'file1', file_name: 'test.jpg', file_url: 'https://example.com/test.jpg'}},
                    {event: 'draft:saved', data: {contact_id: 1, content: 'Draft content', saved_by: 'Admin'}},
                    {event: 'draft:restored', data: {contact_id: 1, content: 'Draft content'}},
                    {event: 'test_message', data: {message: 'Test message', sender: 'system', timestamp: new Date().toISOString()}},
                    {event: 'custom_event', data: {foo: 'bar', time: new Date().toISOString()}},
                    {event: 'connected', data: {message: 'Connected', admin_id: 1}},
                    {event: 'error', data: {type: 'error', message: 'Something went wrong', details: 'Test error', timestamp: new Date().toISOString()}}
                  ].map(({event, data}) => (
                    <Button key={event} size="sm" variant="outline" disabled={wsStatus !== 'connected'}
                      onClick={() => {
                        if (wsRef.current && wsStatus === 'connected') {
                          const msg = { type: event === 'connected' ? 'success' : event === 'error' ? 'error' : 'event', event, data, room: 'global', timestamp: new Date().toISOString() };
                          wsRef.current.send(JSON.stringify(msg));
                          appendLog('Sent event: ' + event + ' | ' + JSON.stringify(msg));
                        } else {
                          appendLog('WebSocket not connected.');
                        }
                      }}
                    >{event}</Button>
                  ))}
                </div>
                <div className="text-xs text-gray-500">Klik tombol untuk mengirim event ke WebSocket. Semua payload dikirim ke room global.</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
