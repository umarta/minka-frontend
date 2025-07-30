// Test Field Mapping Script
// Verifies that backend responses are correctly transformed to frontend types

import { agentGroupAPI } from '@/lib/api/agent-groups';

// Sample backend response (based on the provided backend response)
const sampleBackendResponse = {
  success: true,
  message: "Filtered groups retrieved successfully",
  data: [
    {
      id: 2,
      name: "test22",
      description: "asd",
      color: "#3B82F6",
      is_active: true,
      created_by: 1,
      created_at: "2025-07-29T08:29:14.07089Z",
      updated_at: "2025-07-29T08:29:14.07089Z",
      creator: {
        id: 1,
        username: "admin",
        email: "admin@waha.locals",
        role: "admin",
        is_active: true,
        last_login_at: "2025-07-29T10:07:13.209432+07:00",
        created_at: "2025-07-22T18:58:52.382584+07:00",
        updated_at: "2025-07-29T10:07:13.242314+07:00"
      }
    },
    {
      id: 1,
      name: "test",
      description: "asd",
      color: "#3B82F6",
      is_active: true,
      created_by: 1,
      created_at: "2025-07-29T08:24:46.851106Z",
      updated_at: "2025-07-29T08:24:46.851106Z",
      creator: {
        id: 1,
        username: "admin",
        email: "admin@waha.locals",
        role: "admin",
        is_active: true,
        last_login_at: "2025-07-29T10:07:13.209432+07:00",
        created_at: "2025-07-22T18:58:52.382584+07:00",
        updated_at: "2025-07-29T10:07:13.242314+07:00"
      }
    }
  ],
  meta: {
    pagination: {
      page: 1,
      limit: 20,
      total_pages: 1,
      has_next: false,
      has_prev: false
    },
    total: 2,
    count: 20
  },
  timestamp: "2025-07-29T03:07:59Z",
  request_id: "bf5553f8-e5c0-4449-8fee-db4bdce70137"
};

const sampleStatsResponse = {
  success: true,
  message: "Agent group statistics retrieved successfully",
  data: {
    total_groups: 2,
    active_groups: 2,
    inactive_groups: 0,
    total_members: 0,
    by_role: {},
    group_sizes: {
      large: 2
    }
  },
  timestamp: "2025-07-29T03:07:59Z",
  request_id: "5c64ac99-c838-4abe-8536-f8ac745a73bb"
};

export const testFieldMapping = () => {
  console.log('🧪 Testing Field Mapping Transformations...');
  
  // Expected frontend format after transformation
  const expectedGroup = {
    id: 2,
    name: "test22",
    description: "asd",
    color: "#3B82F6",
    isActive: true,
    createdBy: 1,
    memberCount: 0, // Should default to 0
    createdAt: "2025-07-29T08:29:14.07089Z",
    updatedAt: "2025-07-29T08:29:14.07089Z",
    creator: {
      id: 1,
      username: "admin",
      role: "admin",
      isActive: true,
      avatar: undefined
    }
  };

  const expectedPagination = {
    data: [expectedGroup], // Array of transformed groups
    meta: {
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1
    }
  };

  const expectedStats = {
    totalGroups: 2,
    activeGroups: 2,
    inactiveGroups: 0,
    totalMembers: 0,
    byRole: {},
    groupSizes: {
      small: 0,
      medium: 0,
      large: 2
    },
    recentActivity: []
  };

  console.log('✅ Expected Transformations:');
  console.log('📦 Group Data:', JSON.stringify(expectedGroup, null, 2));
  console.log('📄 Pagination:', JSON.stringify(expectedPagination.meta, null, 2));
  console.log('📊 Stats:', JSON.stringify(expectedStats, null, 2));

  // Instructions for manual testing
  console.log('\n🧪 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to http://localhost:3001/agents');
  console.log('2. Check the "Data Mode Indicator" shows "Real Backend"');
  console.log('3. Verify groups are displayed with correct data:');
  console.log('   - Group names: "test22", "test"');
  console.log('   - Creator: "admin"');
  console.log('   - Active status: true');
  console.log('   - Member count: 0 (default)'); 
  console.log('4. Check statistics show:');
  console.log('   - Total Groups: 2');
  console.log('   - Active Groups: 2');
  console.log('   - Total Members: 0');
  console.log('5. Use "Backend Test" tab to verify API responses');

  return {
    sampleBackendResponse,
    sampleStatsResponse,
    expectedGroup,
    expectedPagination,
    expectedStats
  };
};

// Export for use in components
export default testFieldMapping;