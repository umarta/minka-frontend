import { 
  Agent, 
  AgentFilters, 
  CreateAgentData, 
  UpdateAgentData, 
  PaginatedAgentResponse,
  AgentPerformanceMetrics,
  AgentActivity 
} from '@/types/agent';
import { 
  mockAgents, 
  filterAgents, 
  paginateAgents, 
  generateAgentPerformanceHistory,
  generateAgentActivity 
} from './agent-data';

// Simulate network delay
const delay = (min: number = 300, max: number = 800): Promise<void> => {
  const delayTime = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delayTime));
};

// Mock API responses with realistic delays and error simulation
export const mockAgentApi = {
  // Get all agents with filtering and pagination
  getAll: async (filters: AgentFilters = {}): Promise<PaginatedAgentResponse> => {
    await delay(300, 800);
    
    // Simulate occasional API errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Failed to fetch agents. Please try again.');
    }
    
    const filteredAgents = filterAgents(mockAgents, filters);
    const paginatedResult = paginateAgents(
      filteredAgents, 
      filters.page || 1, 
      filters.limit || 20
    );
    
    return paginatedResult;
  },

  // Get agent by ID
  getById: async (id: string | number): Promise<Agent> => {
    await delay(200, 500);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agent = mockAgents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    return agent;
  },

  // Create new agent
  create: async (data: CreateAgentData): Promise<Agent> => {
    await delay(500, 1000);
    
    // Simulate validation errors
    if (mockAgents.some(a => a.username === data.username)) {
      throw new Error('Username already exists');
    }
    if (mockAgents.some(a => a.email === data.email)) {
      throw new Error('Email already exists');
    }
    
    const newAgent: Agent = {
      id: Math.max(...mockAgents.map(a => a.id)) + 1,
      username: data.username,
      email: data.email,
      role: data.role,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullName: data.fullName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      phone: data.phone,
      department: data.department,
      onlineStatus: 'offline',
      lastSeen: new Date().toISOString(),
      currentTickets: 0,
      totalTicketsHandled: 0,
      avgResponseTime: 5, // Default for new agents
      customerSatisfaction: 3.5, // Default for new agents
      ticketsResolvedToday: 0,
      messagesHandledToday: 0,
      onlineHoursToday: 0,
    };
    
    // Add to mock data (in real app, this would be handled by backend)
    mockAgents.push(newAgent);
    
    return newAgent;
  },

  // Update agent
  update: async (id: string | number, data: UpdateAgentData): Promise<Agent> => {
    await delay(400, 800);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agentIndex = mockAgents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    // Simulate validation errors
    if (data.username && mockAgents.some(a => a.username === data.username && a.id !== agentId)) {
      throw new Error('Username already exists');
    }
    if (data.email && mockAgents.some(a => a.email === data.email && a.id !== agentId)) {
      throw new Error('Email already exists');
    }
    
    const updatedAgent = {
      ...mockAgents[agentIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    // Update mock data
    mockAgents[agentIndex] = updatedAgent;
    
    return updatedAgent;
  },

  // Deactivate agent (soft delete)
  delete: async (id: string | number): Promise<{ success: boolean; message: string }> => {
    await delay(300, 600);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agentIndex = mockAgents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    // Soft delete - set as inactive
    mockAgents[agentIndex] = {
      ...mockAgents[agentIndex],
      isActive: false,
      onlineStatus: 'offline',
      updatedAt: new Date().toISOString(),
    };
    
    return {
      success: true,
      message: 'Agent deactivated successfully',
    };
  },

  // Get agent performance metrics
  getPerformance: async (
    id: string | number, 
    dateRange?: { from: string; to: string }
  ): Promise<AgentPerformanceMetrics[]> => {
    await delay(600, 1200);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agent = mockAgents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    // Calculate days based on date range or default to 30 days
    let days = 30;
    if (dateRange) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return generateAgentPerformanceHistory(agentId, Math.min(days, 90));
  },

  // Get agent activity history
  getActivity: async (
    id: string | number, 
    days: number = 7
  ): Promise<AgentActivity[]> => {
    await delay(400, 700);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agent = mockAgents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    return generateAgentActivity(agentId, days);
  },

  // Update agent status (online/offline/away/busy)
  updateStatus: async (
    id: string | number, 
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<Agent> => {
    await delay(200, 400);
    
    const agentId = typeof id === 'string' ? parseInt(id) : id;
    const agentIndex = mockAgents.findIndex(a => a.id === agentId);
    
    if (agentIndex === -1) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    
    const updatedAgent = {
      ...mockAgents[agentIndex],
      onlineStatus: status,
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Update mock data
    mockAgents[agentIndex] = updatedAgent;
    
    return updatedAgent;
  },

  // Get agent statistics
  getStats: async (): Promise<{
    total: number;
    active: number;
    online: number;
    offline: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }> => {
    await delay(300, 500);
    
    const stats = {
      total: mockAgents.length,
      active: mockAgents.filter(a => a.isActive).length,
      online: mockAgents.filter(a => a.onlineStatus === 'online').length,
      offline: mockAgents.filter(a => a.onlineStatus === 'offline').length,
      byRole: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
    };
    
    // Calculate role distribution
    mockAgents.forEach(agent => {
      stats.byRole[agent.role] = (stats.byRole[agent.role] || 0) + 1;
      stats.byDepartment[agent.department] = (stats.byDepartment[agent.department] || 0) + 1;
    });
    
    return stats;
  },

  // Search agents
  search: async (query: string, filters: AgentFilters = {}): Promise<PaginatedAgentResponse> => {
    await delay(300, 600);
    
    const searchFilters = { ...filters, search: query };
    const filteredAgents = filterAgents(mockAgents, searchFilters);
    const paginatedResult = paginateAgents(
      filteredAgents, 
      filters.page || 1, 
      filters.limit || 20
    );
    
    return paginatedResult;
  },

  // Bulk update agents
  bulkUpdate: async (
    agentIds: number[], 
    updates: Partial<UpdateAgentData>
  ): Promise<{ success: boolean; updated: number; errors: string[] }> => {
    await delay(800, 1500);
    
    const errors: string[] = [];
    let updated = 0;
    
    for (const agentId of agentIds) {
      try {
        await mockAgentApi.update(agentId, updates);
        updated++;
      } catch (error) {
        errors.push(`Failed to update agent ${agentId}: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      updated,
      errors,
    };
  },
};

// Environment-based API switching
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' || 
                      process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// Export the appropriate API based on environment
export const agentApi = USE_MOCK_DATA ? mockAgentApi : null; // Will be replaced with real API later