'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  PlayCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { useAgentStore } from '@/lib/stores/agent';

export function FieldMappingTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [realDataCheck, setRealDataCheck] = useState<boolean | null>(null);

  const { groups, loadGroups, groupStats, loadGroupStats } = useAgentStore();

  useEffect(() => {
    // Check if using real data
    const isUsingRealData = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true' ||
                           (process.env.NODE_ENV === 'development' && 
                            process.env.NEXT_PUBLIC_USE_MOCK_GROUPS === 'false');
    setRealDataCheck(isUsingRealData);
  }, []);

  const runFieldMappingTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    const addResult = (test: string, status: 'pass' | 'fail', message: string, data?: any) => {
      setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toLocaleTimeString() }]);
    };

    try {
      // Test 1: Load groups and check field mapping
      addResult('field-check', 'pass', 'Starting field mapping test...', null);
      
      await loadGroups();
      
      if (groups.length > 0) {
        const firstGroup = groups[0];
        
        // Check required fields exist and have correct types
        const fieldTests = [
          { field: 'id', value: firstGroup.id, type: 'number' },
          { field: 'name', value: firstGroup.name, type: 'string' },
          { field: 'description', value: firstGroup.description, type: 'string' },
          { field: 'color', value: firstGroup.color, type: 'string' },
          { field: 'isActive', value: firstGroup.isActive, type: 'boolean' },
          { field: 'createdBy', value: firstGroup.createdBy, type: 'number' },
          { field: 'memberCount', value: firstGroup.memberCount, type: 'number' },
          { field: 'createdAt', value: firstGroup.createdAt, type: 'string' },
          { field: 'updatedAt', value: firstGroup.updatedAt, type: 'string' },
        ];

        let passedTests = 0;
        fieldTests.forEach(({ field, value, type }) => {
          const actualType = typeof value;
          const isCorrectType = actualType === type;
          const hasValue = value !== null && value !== undefined;
          
          if (isCorrectType && hasValue) {
            passedTests++;
            addResult(`field-${field}`, 'pass', `✓ ${field}: ${actualType} = ${value}`, { field, value, expectedType: type, actualType });
          } else {
            addResult(`field-${field}`, 'fail', `✗ ${field}: expected ${type}, got ${actualType} = ${value}`, { field, value, expectedType: type, actualType });
          }
        });

        // Test creator field mapping if present
        if (firstGroup.creator) {
          const creator = firstGroup.creator;
          const creatorTests = [
            { field: 'creator.id', value: creator.id, type: 'number' },
            { field: 'creator.username', value: creator.username, type: 'string' },
            { field: 'creator.role', value: creator.role, type: 'string' },
            { field: 'creator.isActive', value: creator.isActive, type: 'boolean' },
          ];

          creatorTests.forEach(({ field, value, type }) => {
            const actualType = typeof value;
            const isCorrectType = actualType === type;
            const hasValue = value !== null && value !== undefined;
            
            if (isCorrectType && hasValue) {
              passedTests++;
              addResult(`creator-${field}`, 'pass', `✓ ${field}: ${actualType} = ${value}`, { field, value, expectedType: type, actualType });
            } else {
              addResult(`creator-${field}`, 'fail', `✗ ${field}: expected ${type}, got ${actualType} = ${value}`, { field, value, expectedType: type, actualType });
            }
          });
        }

        addResult('group-summary', 'pass', `Found ${groups.length} groups with ${passedTests} fields mapped correctly`, { totalGroups: groups.length, passedTests });

      } else {
        addResult('groups-load', 'fail', 'No groups found - check backend connection', null);
      }

      // Test 2: Load stats and check field mapping
      await loadGroupStats();
      
      if (groupStats) {
        const statsTests = [
          { field: 'totalGroups', value: groupStats.totalGroups, type: 'number' },
          { field: 'activeGroups', value: groupStats.activeGroups, type: 'number' },
          { field: 'inactiveGroups', value: groupStats.inactiveGroups, type: 'number' },
          { field: 'totalMembers', value: groupStats.totalMembers, type: 'number' },
          { field: 'byRole', value: groupStats.byRole, type: 'object' },
          { field: 'groupSizes', value: groupStats.groupSizes, type: 'object' },
        ];

        let statsPassedTests = 0;
        statsTests.forEach(({ field, value, type }) => {
          const actualType = typeof value;
          const isCorrectType = actualType === type;
          const hasValue = value !== null && value !== undefined;
          
          if (isCorrectType && hasValue) {
            statsPassedTests++;
            addResult(`stats-${field}`, 'pass', `✓ ${field}: ${actualType} = ${JSON.stringify(value)}`, { field, value, expectedType: type, actualType });
          } else {
            addResult(`stats-${field}`, 'fail', `✗ ${field}: expected ${type}, got ${actualType} = ${value}`, { field, value, expectedType: type, actualType });
          }
        });

        addResult('stats-summary', 'pass', `Group stats loaded with ${statsPassedTests} fields mapped correctly`, { statsPassedTests });
      } else {
        addResult('stats-load', 'fail', 'Group stats not loaded', null);
      }

      addResult('test-complete', 'pass', 'Field mapping test completed successfully!', null);

    } catch (error) {
      addResult('test-error', 'fail', `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Field Mapping Test
            {realDataCheck !== null && (
              <Badge variant={realDataCheck ? 'default' : 'secondary'}>
                {realDataCheck ? 'Real Data' : 'Mock Data'}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={runFieldMappingTest} 
              disabled={isRunning}
              size="sm"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isRunning ? 'Testing...' : 'Run Test'}
            </Button>
            <Button onClick={clearResults} variant="ghost" size="sm">
              Clear Results
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Tests field mapping from backend snake_case to frontend camelCase. 
          {realDataCheck ? 'Using real backend data.' : 'Using mock data - switch to real data for accurate testing.'}
        </p>
      </CardHeader>
      <CardContent>
        {testResults.length === 0 && !isRunning && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click "Run Test" to verify field mapping transformations</p>
            </div>
          </div>
        )}

        {(testResults.length > 0 || isRunning) && (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {result.test}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      {result.message}
                    </p>
                    {result.data && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          View data
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              
              {isRunning && (
                <div className="flex items-center gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700">Testing field mappings...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {testResults.length > 0 && !isRunning && (
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="font-medium text-sm mb-2">Test Summary</h4>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-green-600">
                  ✅ {testResults.filter(r => r.status === 'pass').length} passed
                </span>
                <span className="text-red-600">
                  ❌ {testResults.filter(r => r.status === 'fail').length} failed
                </span>
              </div>
              <Badge variant="outline">
                Total: {testResults.length} tests
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}