'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Server, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Globe,
  Activity
} from 'lucide-react';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  message: string;
  data?: any;
}

export function BackendConnectivityTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ success: number; error: number } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  const testEndpoint = async (
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
  ): Promise<TestResult> => {
    const url = `${BACKEND_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        endpoint,
        method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok 
          ? `${method} ${endpoint} succeeded`
          : `${method} ${endpoint} failed: ${response.status} ${response.statusText}`,
        data: responseData
      };
    } catch (error) {
      return {
        endpoint,
        method,
        status: 'error',
        message: `${method} ${endpoint} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    const tests = [
      { endpoint: '/', method: 'GET' as const, name: 'API Root' },
      { endpoint: '/admin/groups', method: 'GET' as const, name: 'Groups List' },
      { endpoint: '/admin/groups/stats', method: 'GET' as const, name: 'Groups Stats' },
      { endpoint: '/admin/groups?page=1&limit=5', method: 'GET' as const, name: 'Groups Pagination' },
      { endpoint: '/admin/groups/search?query=test', method: 'GET' as const, name: 'Groups Search' },
      { endpoint: '/admin/groups/filter?isActive=true', method: 'GET' as const, name: 'Groups Filter' },
      { endpoint: '/admin/groups/1', method: 'GET' as const, name: 'Single Group' },
      { endpoint: '/admin/groups/1/members', method: 'GET' as const, name: 'Group Members' },
    ];

    const testResults: TestResult[] = [];

    for (const test of tests) {
      const result = await testEndpoint(test.endpoint, test.method);
      testResults.push(result);
      setResults([...testResults]); // Update UI progressively
      
      // Small delay to make the testing visible
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Calculate summary
    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;
    setSummary({ success: successCount, error: errorCount });

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'success' | 'error') => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getResponseInfo = (result: TestResult) => {
    if (result.status === 'error') return null;
    
    if (result.data && typeof result.data === 'object') {
      if (Array.isArray(result.data)) {
        return `Array with ${result.data.length} items`;
      } else if (result.data.data) {
        return `Response data: ${typeof result.data.data}`;
      } else {
        return `Object response`;
      }
    }
    return 'Response received';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Connectivity Test
          </CardTitle>
          <div className="flex items-center gap-2">
            {summary && (
              <div className="flex gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {summary.success} passed
                </Badge>
                {summary.error > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {summary.error} failed
                  </Badge>
                )}
              </div>
            )}
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              size="sm"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          Backend URL: <code className="text-xs bg-muted px-1 rounded">{BACKEND_URL}</code>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !isRunning && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click "Run Tests" to test backend connectivity</p>
            </div>
          </div>
        )}

        {(results.length > 0 || isRunning) && (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {result.method}
                      </Badge>
                      <code className="text-xs bg-muted px-1 rounded">
                        {result.endpoint}
                      </code>
                      {result.statusCode && (
                        <Badge 
                          variant={result.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.statusCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      {result.message}
                    </p>
                    {result.status === 'success' && getResponseInfo(result) && (
                      <p className="text-xs text-muted-foreground">
                        {getResponseInfo(result)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isRunning && (
                <div className="flex items-center gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700">Running backend tests...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {summary && !isRunning && (
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-medium text-sm mb-2">Test Summary</h4>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-green-600">
                  ✅ {summary.success} endpoints working
                </span>
                {summary.error > 0 && (
                  <span className="text-red-600">
                    ❌ {summary.error} endpoints failed
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {summary.success > 0 ? (
                  <span className="text-green-600 font-medium">
                    🎉 Backend is responding!
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    ⚠️ Backend connection issues
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}