import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DateRange } from '@/types';

// Analytics data types
export interface OverviewData {
  totalMessages: number;
  totalContacts: number;
  activeConversations: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  ticketsResolved: number;
  revenue: number;
  growth: {
    messages: number;
    contacts: number;
    conversations: number;
    responseTime: number;
  };
}

export interface MessageVolumeData {
  date: string;
  incoming: number;
  outgoing: number;
  total: number;
}

export interface ResponseTimeData {
  date: string;
  avgResponseTime: number;
  firstResponseTime: number;
  slaCompliance: number;
}

export interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  messagesHandled: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  ticketsResolved: number;
  activeTime: number;
}

export interface CustomerSatisfactionData {
  date: string;
  score: number;
  responses: number;
  ratings: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    terrible: number;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  conversion: number;
}

export interface TopContactData {
  contactId: string;
  contactName: string;
  phone: string;
  messageCount: number;
  lastMessage: string;
  totalSpent: number;
}

interface AnalyticsState {
  // Data
  overview: OverviewData | null;
  messageVolume: MessageVolumeData[];
  responseTime: ResponseTimeData[];
  agentPerformance: AgentPerformanceData[];
  customerSatisfaction: CustomerSatisfactionData[];
  revenue: RevenueData[];
  topContacts: TopContactData[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
}

interface AnalyticsActions {
  // Data fetching
  fetchOverview: (dateRange: DateRange) => Promise<void>;
  fetchMessageVolume: (dateRange: DateRange) => Promise<void>;
  fetchResponseTime: (dateRange: DateRange) => Promise<void>;
  fetchAgentPerformance: (dateRange: DateRange) => Promise<void>;
  fetchCustomerSatisfaction: (dateRange: DateRange) => Promise<void>;
  fetchRevenue: (dateRange: DateRange) => Promise<void>;
  fetchTopContacts: (dateRange: DateRange) => Promise<void>;
  
  // State management
  setDateRange: (dateRange: DateRange) => void;
  clearError: () => void;
  
  // Export
  exportReport: (format: 'pdf' | 'excel', dateRange: DateRange) => Promise<void>;
}

type AnalyticsStore = AnalyticsState & AnalyticsActions;

// Mock data generators for development
const generateMockOverview = (): OverviewData => ({
  totalMessages: 12458,
  totalContacts: 3247,
  activeConversations: 156,
  avgResponseTime: 3.5,
  customerSatisfaction: 4.2,
  ticketsResolved: 89,
  revenue: 125430,
  growth: {
    messages: 15.2,
    contacts: 8.7,
    conversations: -2.1,
    responseTime: -12.3,
  },
});

const generateMockMessageVolume = (days: number): MessageVolumeData[] => {
  const data: MessageVolumeData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      incoming: Math.floor(Math.random() * 200) + 50,
      outgoing: Math.floor(Math.random() * 150) + 30,
      total: 0,
    });
  }
  
  return data.map(item => ({
    ...item,
    total: item.incoming + item.outgoing,
  }));
};

const generateMockResponseTime = (days: number): ResponseTimeData[] => {
  const data: ResponseTimeData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      avgResponseTime: Math.random() * 5 + 1,
      firstResponseTime: Math.random() * 8 + 2,
      slaCompliance: Math.random() * 20 + 80,
    });
  }
  
  return data;
};

const generateMockAgentPerformance = (): AgentPerformanceData[] => [
  {
    agentId: '1',
    agentName: 'John Doe',
    messagesHandled: 245,
    avgResponseTime: 2.3,
    customerSatisfaction: 4.5,
    ticketsResolved: 23,
    activeTime: 8.5,
  },
  {
    agentId: '2',
    agentName: 'Jane Smith',
    messagesHandled: 189,
    avgResponseTime: 3.1,
    customerSatisfaction: 4.2,
    ticketsResolved: 18,
    activeTime: 7.8,
  },
  {
    agentId: '3',
    agentName: 'Mike Johnson',
    messagesHandled: 167,
    avgResponseTime: 4.2,
    customerSatisfaction: 3.9,
    ticketsResolved: 15,
    activeTime: 6.2,
  },
];

const generateMockCustomerSatisfaction = (days: number): CustomerSatisfactionData[] => {
  const data: CustomerSatisfactionData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const responses = Math.floor(Math.random() * 50) + 10;
    const excellent = Math.floor(responses * 0.4);
    const good = Math.floor(responses * 0.3);
    const average = Math.floor(responses * 0.2);
    const poor = Math.floor(responses * 0.08);
    const terrible = responses - excellent - good - average - poor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      score: 3.5 + Math.random() * 1.5,
      responses,
      ratings: {
        excellent,
        good,
        average,
        poor,
        terrible: Math.max(0, terrible),
      },
    });
  }
  
  return data;
};

const generateMockRevenue = (days: number): RevenueData[] => {
  const data: RevenueData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const orders = Math.floor(Math.random() * 20) + 5;
    const avgOrderValue = Math.random() * 200 + 50;
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: orders * avgOrderValue,
      orders,
      avgOrderValue,
      conversion: Math.random() * 5 + 2,
    });
  }
  
  return data;
};

const generateMockTopContacts = (): TopContactData[] => [
  {
    contactId: '1',
    contactName: 'Alice Johnson',
    phone: '+1234567890',
    messageCount: 45,
    lastMessage: 'Thank you for the quick response!',
    totalSpent: 1250.00,
  },
  {
    contactId: '2',
    contactName: 'Bob Wilson',
    phone: '+1234567891',
    messageCount: 38,
    lastMessage: 'When will my order arrive?',
    totalSpent: 890.50,
  },
  {
    contactId: '3',
    contactName: 'Carol Brown',
    phone: '+1234567892',
    messageCount: 32,
    lastMessage: 'Great service as always!',
    totalSpent: 2100.75,
  },
  {
    contactId: '4',
    contactName: 'David Lee',
    phone: '+1234567893',
    messageCount: 28,
    lastMessage: 'Can I get a refund?',
    totalSpent: 450.00,
  },
  {
    contactId: '5',
    contactName: 'Emma Davis',
    phone: '+1234567894',
    messageCount: 25,
    lastMessage: 'Perfect, exactly what I needed',
    totalSpent: 680.25,
  },
];

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      overview: null,
      messageVolume: [],
      responseTime: [],
      agentPerformance: [],
      customerSatisfaction: [],
      revenue: [],
      topContacts: [],
      isLoading: false,
      error: null,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(),
      },

      // Actions
      fetchOverview: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          const overview = generateMockOverview();
          set({ overview, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch overview data', 
            isLoading: false 
          });
        }
      },

      fetchMessageVolume: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          const messageVolume = generateMockMessageVolume(Math.min(days, 90));
          set({ messageVolume, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch message volume data', 
            isLoading: false 
          });
        }
      },

      fetchResponseTime: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          const responseTime = generateMockResponseTime(Math.min(days, 90));
          set({ responseTime, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch response time data', 
            isLoading: false 
          });
        }
      },

      fetchAgentPerformance: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 400));
          const agentPerformance = generateMockAgentPerformance();
          set({ agentPerformance, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch agent performance data', 
            isLoading: false 
          });
        }
      },

      fetchCustomerSatisfaction: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 350));
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          const customerSatisfaction = generateMockCustomerSatisfaction(Math.min(days, 90));
          set({ customerSatisfaction, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch customer satisfaction data', 
            isLoading: false 
          });
        }
      },

      fetchRevenue: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          const revenue = generateMockRevenue(Math.min(days, 90));
          set({ revenue, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch revenue data', 
            isLoading: false 
          });
        }
      },

      fetchTopContacts: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 250));
          const topContacts = generateMockTopContacts();
          set({ topContacts, isLoading: false });
        } catch (error) {
          set({ 
            error: 'Failed to fetch top contacts data', 
            isLoading: false 
          });
        }
      },

      setDateRange: (dateRange: DateRange) => {
        set({ dateRange });
      },

      clearError: () => {
        set({ error: null });
      },

      exportReport: async (format: 'pdf' | 'excel', dateRange: DateRange) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create a mock export
          const filename = `analytics-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          
          // In a real implementation, you would call the API to generate and download the file
          console.log(`Exporting report as ${format}: ${filename}`);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: `Failed to export report as ${format}`, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'analytics-store',
    }
  )
); 