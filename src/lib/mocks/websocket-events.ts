import { AgentActivity } from '@/types/agent';

// Mock WebSocket events for agent management
export interface MockWebSocketEvent {
  event: string;
  data: any;
  delay?: number; // Optional delay before emitting
}

// Generate realistic WebSocket events for development
export const generateMockWebSocketEvents = (): MockWebSocketEvent[] => {
  const events: MockWebSocketEvent[] = [];
  const agentIds = Array.from({ length: 50 }, (_, i) => i + 1);
  
  // Generate various event types
  const eventTypes = [
    'agent_online',
    'agent_offline', 
    'agent_status_change',
    'agent_activity',
    'performance_update'
  ];

  // Create a realistic sequence of events
  let timeOffset = 0;

  // Morning login rush (8-10 AM)
  for (let i = 0; i < 15; i++) {
    const agentId = agentIds[Math.floor(Math.random() * 25)]; // First 25 agents
    events.push({
      event: 'agent_online',
      data: { agentId, timestamp: new Date(Date.now() + timeOffset).toISOString() },
      delay: timeOffset,
    });
    timeOffset += Math.random() * 5000; // 0-5 second intervals
  }

  // Status changes throughout the day
  for (let i = 0; i < 30; i++) {
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
    const statuses = ['busy', 'away', 'online'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    events.push({
      event: 'agent_status_change',
      data: { 
        agentId, 
        status, 
        timestamp: new Date(Date.now() + timeOffset).toISOString() 
      },
      delay: timeOffset,
    });
    timeOffset += Math.random() * 10000; // 0-10 second intervals
  }

  // Activity events
  for (let i = 0; i < 50; i++) {
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
    const activityTypes = ['ticket_assigned', 'ticket_resolved', 'message_sent'];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    let description = '';
    let metadata = {};
    
    switch (type) {
      case 'ticket_assigned':
        const ticketId = Math.floor(Math.random() * 9000) + 1000;
        description = `Ticket #${ticketId} assigned`;
        metadata = { ticketId, priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)] };
        break;
      case 'ticket_resolved':
        const resolvedTicketId = Math.floor(Math.random() * 9000) + 1000;
        description = `Ticket #${resolvedTicketId} resolved`;
        metadata = { ticketId: resolvedTicketId, resolutionTime: Math.floor(Math.random() * 120) + 10 };
        break;
      case 'message_sent':
        const messageCount = Math.floor(Math.random() * 5) + 1;
        description = `${messageCount} messages sent`;
        metadata = { messageCount };
        break;
    }

    const activity: AgentActivity = {
      id: `mock-${Date.now()}-${i}`,
      agentId,
      type: type as any,
      description,
      timestamp: new Date(Date.now() + timeOffset).toISOString(),
      metadata,
    };

    events.push({
      event: 'agent_activity',
      data: activity,
      delay: timeOffset,
    });
    timeOffset += Math.random() * 15000; // 0-15 second intervals
  }

  // Performance updates
  for (let i = 0; i < 20; i++) {
    const agentId = agentIds[Math.floor(Math.random() * agentIds.length)];
    const metrics = ['responseTime', 'customerSatisfaction', 'ticketsResolved'];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    
    let value = 0;
    switch (metric) {
      case 'responseTime':
        value = Math.random() * 8 + 1; // 1-9 minutes
        break;
      case 'customerSatisfaction':
        value = Math.random() * 2 + 3; // 3-5 rating
        break;
      case 'ticketsResolved':
        value = Math.floor(Math.random() * 5) + 1; // 1-5 tickets
        break;
    }

    events.push({
      event: 'performance_update',
      data: { agentId, metric, value, timestamp: new Date(Date.now() + timeOffset).toISOString() },
      delay: timeOffset,
    });
    timeOffset += Math.random() * 20000; // 0-20 second intervals
  }

  // Evening logout (5-7 PM)
  for (let i = 0; i < 10; i++) {
    const agentId = agentIds[Math.floor(Math.random() * 20)]; // Subset of agents
    events.push({
      event: 'agent_offline',
      data: { agentId, timestamp: new Date(Date.now() + timeOffset).toISOString() },
      delay: timeOffset,
    });
    timeOffset += Math.random() * 8000; // 0-8 second intervals
  }

  return events.sort((a, b) => (a.delay || 0) - (b.delay || 0));
};

// WebSocket event simulator for development
export class MockWebSocketEventSimulator {
  private events: MockWebSocketEvent[];
  private eventIndex: number = 0;
  private isRunning: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private callbacks: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.events = generateMockWebSocketEvents();
  }

  // Start simulating events
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNextEvent();
    console.log('[Mock WS] Started WebSocket event simulation');
  }

  // Stop simulating events
  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    console.log('[Mock WS] Stopped WebSocket event simulation');
  }

  // Subscribe to events
  on(event: string, callback: (data: any) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  // Unsubscribe from events
  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      this.callbacks.delete(event);
    }
  }

  // Emit event to subscribers
  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Mock WS] Error in event callback:', error);
        }
      });
    }
  }

  // Schedule the next event
  private scheduleNextEvent() {
    if (!this.isRunning || this.eventIndex >= this.events.length) {
      // Restart from beginning when all events are processed
      this.eventIndex = 0;
      this.events = generateMockWebSocketEvents();
    }

    const event = this.events[this.eventIndex];
    const delay = event.delay || 1000;

    this.timeoutId = setTimeout(() => {
      if (this.isRunning) {
        console.log(`[Mock WS] Emitting ${event.event}:`, event.data);
        this.emit(event.event, event.data);
        this.eventIndex++;
        this.scheduleNextEvent();
      }
    }, delay);
  }

  // Manually trigger an event (for testing)
  triggerEvent(event: string, data: any) {
    console.log(`[Mock WS] Manually triggering ${event}:`, data);
    this.emit(event, data);
  }

  // Get remaining events count
  getRemainingEvents(): number {
    return this.events.length - this.eventIndex;
  }

  // Reset event simulation
  reset() {
    this.stop();
    this.eventIndex = 0;
    this.events = generateMockWebSocketEvents();
  }
}

// Singleton instance
let mockWebSocketSimulator: MockWebSocketEventSimulator | null = null;

export const getMockWebSocketSimulator = (): MockWebSocketEventSimulator => {
  if (!mockWebSocketSimulator) {
    mockWebSocketSimulator = new MockWebSocketEventSimulator();
  }
  return mockWebSocketSimulator;
};

// Auto-start simulation in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const simulator = getMockWebSocketSimulator();
  
  // Start simulation after a short delay
  setTimeout(() => {
    simulator.start();
  }, 2000);
  
  // Expose to window for debugging
  (window as any).mockWebSocketSimulator = simulator;
}