'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { agentGroupAPI } from '@/lib/api/agent-groups';
import { mockAgentGroupAPI } from '@/lib/mocks/agent-groups-api';

export function ApiIntegrationTest() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const testRealAPI = async () => {
    setLoading(true);
    try {
      const response = await agentGroupAPI.getAll(1, 20);
      setResults(prev => [...prev, {
        type: 'Real API',
        status: 'success',
        data: response,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'Real API',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const testMockAPI = async () => {
    setLoading(true);
    try {
      const response = await mockAgentGroupAPI.getAll(1, 20);
      setResults(prev => [...prev, {
        type: 'Mock API',
        status: 'success',
        data: response,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'Mock API',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API Integration Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test both real backend API and mock API functionality
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testRealAPI} disabled={loading}>
            Test Real API
          </Button>
          <Button onClick={testMockAPI} disabled={loading} variant="outline">
            Test Mock API
          </Button>
          <Button onClick={clearResults} variant="ghost" size="sm">
            Clear Results
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                  {result.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {result.timestamp}
                </span>
              </div>
              
              {result.status === 'success' ? (
                <div className="text-sm">
                  <p><strong>Groups found:</strong> {result.data?.data?.length || 0}</p>
                  <p><strong>Total:</strong> {result.data?.meta?.total || 'N/A'}</p>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No test results yet. Click a button above to test the APIs.
          </div>
        )}
      </CardContent>
    </Card>
  );
}