import { Agent, AgentPerformanceMetrics, AgentActivity } from '@/types/agent';

// Helper function to generate realistic timestamps
const generateTimestamp = (daysAgo: number = 0, hoursAgo: number = 0, minutesAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

// Helper function to generate random number within range
const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Helper function to generate random integer within range
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to pick random item from array
const randomPick = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Sample data arrays
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
  'James', 'Mary', 'William', 'Patricia', 'Richard', 'Jennifer', 'Charles',
  'Linda', 'Joseph', 'Elizabeth', 'Thomas', 'Barbara', 'Christopher', 'Susan',
  'Daniel', 'Jessica', 'Paul', 'Ashley', 'Mark', 'Kimberly', 'Donald', 'Amy'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark'
];

const departments = ['Sales', 'Support', 'Technical', 'Billing', 'Management', 'Quality Assurance'];

const onlineStatuses: Array<'online' | 'offline' | 'away' | 'busy'> = ['online', 'offline', 'away', 'busy'];

// Generate mock agents
export const generateMockAgents = (count: number = 50): Agent[] => {
  const agents: Agent[] = [];
  
  // Role distribution: 15 admin, 25 cs, 10 viewer
  const roleDistribution = [
    ...Array(15).fill('admin'),
    ...Array(25).fill('cs'),
    ...Array(10).fill('viewer')
  ];

  for (let i = 1; i <= count; i++) {
    const firstName = randomPick(firstNames);
    const lastName = randomPick(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const email = `${username}@company.com`;
    const role = roleDistribution[i - 1] || randomPick(['admin', 'cs', 'viewer']);
    const department = randomPick(departments);
    
    // Generate realistic activity patterns
    const isActive = Math.random() > 0.1; // 90% active
    const onlineStatus = isActive ? randomPick(onlineStatuses) : 'offline';
    const lastLoginDaysAgo = isActive ? randomInt(0, 7) : randomInt(7, 30);
    const lastSeenHoursAgo = onlineStatus === 'online' ? 0 : randomInt(1, 24);
    
    // Performance metrics based on role and experience
    const experienceLevel = Math.random();
    const basePerformance = experienceLevel * 0.7 + 0.3; // 0.3 to 1.0
    
    const agent: Agent = {
      id: i,
      username,
      email,
      role: role as 'admin' | 'cs' | 'viewer',
      isActive,
      lastLoginAt: isActive ? generateTimestamp(lastLoginDaysAgo) : null,
      createdAt: generateTimestamp(randomInt(30, 365)), // Created 1 month to 1 year ago
      updatedAt: generateTimestamp(randomInt(0, 7)), // Updated within last week
      fullName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      phone: `+1${randomInt(100, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
      department,
      onlineStatus,
      lastSeen: generateTimestamp(0, lastSeenHoursAgo),
      currentTickets: onlineStatus === 'online' ? randomInt(0, 8) : 0,
      totalTicketsHandled: Math.floor(basePerformance * randomInt(50, 500)),
      avgResponseTime: Math.max(1, 10 - (basePerformance * 8)), // 1-10 minutes, better performers respond faster
      customerSatisfaction: Math.min(5, 2 + (basePerformance * 3)), // 2-5 scale
      ticketsResolvedToday: onlineStatus === 'online' ? randomInt(0, 12) : 0,
      messagesHandledToday: onlineStatus === 'online' ? randomInt(10, 150) : 0,
      onlineHoursToday: onlineStatus === 'online' ? randomBetween(1, 8) : 0,
    };
    
    agents.push(agent);
  }
  
  return agents;
};

// Generate performance metrics for an agent over time
export const generateAgentPerformanceHistory = (
  agentId: number, 
  days: number = 30
): AgentPerformanceMetrics[] => {
  const metrics: AgentPerformanceMetrics[] = [];
  const baseAgent = mockAgents.find(a => a.id === agentId);
  
  if (!baseAgent) return [];
  
  const basePerformance = baseAgent.customerSatisfaction / 5; // Normalize to 0-1
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some variance to metrics over time
    const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
    const dayPerformance = Math.max(0.1, Math.min(1, basePerformance + variance));
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const workingDay = !isWeekend && Math.random() > 0.1; // 90% chance of working on weekdays
    
    metrics.push({
      agentId,
      date: date.toISOString().split('T')[0],
      messagesHandled: workingDay ? Math.floor(dayPerformance * randomInt(20, 200)) : 0,
      avgResponseTime: workingDay ? Math.max(1, 10 - (dayPerformance * 8)) : 0,
      customerSatisfaction: workingDay ? Math.min(5, 2 + (dayPerformance * 3)) : 0,
      ticketsResolved: workingDay ? Math.floor(dayPerformance * randomInt(2, 15)) : 0,
      onlineHours: workingDay ? randomBetween(4, 9) : 0,
      slaCompliance: workingDay ? Math.min(100, 60 + (dayPerformance * 40)) : 0,
    });
  }
  
  return metrics;
};

// Generate activity history for an agent
export const generateAgentActivity = (agentId: number, days: number = 7): AgentActivity[] => {
  const activities: AgentActivity[] = [];
  const agent = mockAgents.find(a => a.id === agentId);
  
  if (!agent) return [];
  
  const activityTypes = ['login', 'logout', 'status_change', 'ticket_assigned', 'ticket_resolved', 'message_sent'];
  
  for (let day = days - 1; day >= 0; day--) {
    const activitiesPerDay = agent.onlineStatus === 'online' ? randomInt(5, 20) : randomInt(0, 5);
    
    for (let i = 0; i < activitiesPerDay; i++) {
      const activityType = randomPick(activityTypes);
      const timestamp = generateTimestamp(day, randomInt(0, 23), randomInt(0, 59));
      
      let description = '';
      let metadata = {};
      
      switch (activityType) {
        case 'login':
          description = `${agent.fullName} logged in`;
          break;
        case 'logout':
          description = `${agent.fullName} logged out`;
          break;
        case 'status_change':
          const newStatus = randomPick(['online', 'away', 'busy']);
          description = `${agent.fullName} changed status to ${newStatus}`;
          metadata = { previousStatus: agent.onlineStatus, newStatus };
          break;
        case 'ticket_assigned':
          const ticketId = randomInt(1000, 9999);
          description = `Ticket #${ticketId} assigned to ${agent.fullName}`;
          metadata = { ticketId, priority: randomPick(['low', 'normal', 'high', 'urgent']) };
          break;
        case 'ticket_resolved':
          const resolvedTicketId = randomInt(1000, 9999);
          description = `${agent.fullName} resolved ticket #${resolvedTicketId}`;
          metadata = { ticketId: resolvedTicketId, resolutionTime: randomInt(10, 120) };
          break;
        case 'message_sent':
          description = `${agent.fullName} sent ${randomInt(1, 10)} messages`;
          metadata = { messageCount: randomInt(1, 10) };
          break;
      }
      
      activities.push({
        id: `${agentId}-${timestamp}-${i}`,
        agentId,
        type: activityType as any,
        description,
        timestamp,
        metadata,
      });
    }
  }
  
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate the main mock agents dataset
export const mockAgents = generateMockAgents(50);

// Helper functions for filtering and searching
export const filterAgents = (agents: Agent[], filters: any): Agent[] => {
  return agents.filter(agent => {
    if (filters.role && agent.role !== filters.role) return false;
    if (filters.status && (filters.status === 'active' ? !agent.isActive : agent.isActive)) return false;
    if (filters.onlineStatus && agent.onlineStatus !== filters.onlineStatus) return false;
    if (filters.department && agent.department !== filters.department) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${agent.fullName} ${agent.username} ${agent.email} ${agent.department}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }
    if (filters.performanceLevel) {
      const level = agent.customerSatisfaction >= 4 ? 'high' : agent.customerSatisfaction >= 3 ? 'medium' : 'low';
      if (level !== filters.performanceLevel) return false;
    }
    return true;
  });
};

export const paginateAgents = (agents: Agent[], page: number = 1, limit: number = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = agents.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    meta: {
      total: agents.length,
      page,
      limit,
      totalPages: Math.ceil(agents.length / limit),
    },
  };
};

// Realistic agent scenarios for testing
export const getAgentScenarios = () => {
  const allAgents = mockAgents;
  
  return {
    highPerformer: allAgents.find(a => a.customerSatisfaction >= 4.5),
    newAgent: allAgents.find(a => new Date(a.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    partTimeAgent: allAgents.find(a => a.onlineHoursToday < 4 && a.onlineHoursToday > 0),
    teamLead: allAgents.find(a => a.role === 'admin'),
    strugglingAgent: allAgents.find(a => a.customerSatisfaction < 3),
    inactiveAgent: allAgents.find(a => !a.isActive),
  };
};