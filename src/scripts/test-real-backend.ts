// Real Backend Testing Script
// Tests the actual backend API endpoints for agent groups

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  statusCode?: number;
  message: string;
  data?: any;
}

class BackendTester {
  private results: TestResult[] = [];

  async testEndpoint(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<TestResult> {
    const url = `${BACKEND_URL}${endpoint}`;
    
    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const result: TestResult = {
        endpoint,
        method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: response.ok 
          ? `${method} ${endpoint} succeeded`
          : `${method} ${endpoint} failed: ${response.status} ${response.statusText}`,
        data: responseData
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        endpoint,
        method,
        status: 'error',
        message: `${method} ${endpoint} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };

      this.results.push(result);
      return result;
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Testing Real Backend API Endpoints...');
    console.log(`Backend URL: ${BACKEND_URL}`);
    
    // Test basic API connectivity
    await this.testEndpoint('/', 'GET');
    
    // Test agent groups endpoints
    await this.testEndpoint('/admin/groups', 'GET');
    await this.testEndpoint('/admin/groups/stats', 'GET');
    
    // Test pagination
    await this.testEndpoint('/admin/groups?page=1&limit=5', 'GET');
    
    // Test search (even if no results)
    await this.testEndpoint('/admin/groups/search?query=test', 'GET');
    
    // Test filter
    await this.testEndpoint('/admin/groups/filter?isActive=true', 'GET');

    // Test with specific ID (might 404, but should be structured)
    await this.testEndpoint('/admin/groups/1', 'GET');
    await this.testEndpoint('/admin/groups/1/members', 'GET');

    return this.results;
  }

  printResults(): void {
    console.log('\n📊 Backend Test Results:');
    console.log('========================');
    
    let successCount = 0;
    let errorCount = 0;

    this.results.forEach((result, index) => {
      const emoji = result.status === 'success' ? '✅' : '❌';
      const status = result.statusCode ? ` (${result.statusCode})` : '';
      
      console.log(`${index + 1}. ${emoji} ${result.method} ${result.endpoint}${status}`);
      console.log(`   ${result.message}`);
      
      if (result.status === 'success') {
        successCount++;
        if (result.data && typeof result.data === 'object') {
          if (Array.isArray(result.data)) {
            console.log(`   Response: Array with ${result.data.length} items`);
          } else if (result.data.data) {
            console.log(`   Response: ${typeof result.data.data} data`);
          } else {
            console.log(`   Response: ${typeof result.data} object`);
          }
        }
      } else {
        errorCount++;
      }
      console.log('');
    });

    console.log(`📈 Summary: ${successCount} passed, ${errorCount} failed`);
    
    if (successCount > 0) {
      console.log('🎉 Backend is responding! Real data integration is working.');
    } else {
      console.log('⚠️  Backend connection issues detected. Check your backend server.');
    }
  }

  getSuccessfulEndpoints(): string[] {
    return this.results
      .filter(r => r.status === 'success')
      .map(r => `${r.method} ${r.endpoint}`);
  }

  getFailedEndpoints(): string[] {
    return this.results
      .filter(r => r.status === 'error')
      .map(r => `${r.method} ${r.endpoint}`);
  }
}

// Export for use in components or run directly
export const testRealBackend = async (): Promise<TestResult[]> => {
  const tester = new BackendTester();
  const results = await tester.runAllTests();
  tester.printResults();
  return results;
};

// Run if called directly (for Node.js testing)
if (typeof window === 'undefined' && require.main === module) {
  testRealBackend().catch(console.error);
}

export default BackendTester;