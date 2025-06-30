// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Authentication types
export interface User extends BaseEntity {
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  profile_image?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'agent' | 'viewer';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  user?: User;
  admin?: User;
  expires_in?: number;
  expires_at?: string;
}

// Contact types
export interface Contact extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  labels: Label[];
  is_blocked: boolean;
  last_seen?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface Label extends BaseEntity {
  name: string;
  color: string;
  description?: string;
}

// Message types
export interface Message extends BaseEntity {
  contact_id: string;
  session_id: string;
  content: string;
  message_type: MessageType;
  direction: MessageDirection;
  media_url?: string;
  media_type?: string;
  media_size?: number;
  media_filename?: string;
  status: MessageStatus;
  read_at?: string;
  delivered_at?: string;
  waha_message_id?: string;
  replied_to_id?: string;
  quoted_message?: Message;
  metadata?: Record<string, any>;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'system';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Session types
export interface Session extends BaseEntity {
  name?: string; // Optional since backend might not include it
  session_name: string;
  phone_number?: string;
  profile_name?: string; // From API response
  profile_picture_url?: string; // From API response
  qr_code?: string;
  status: SessionStatus;
  webhook_url?: string;
  is_default?: boolean;
  is_active?: boolean; // From API response
  last_activity?: string;
  last_seen?: string; // From API response
  assigned_admin_id?: number; // From API response
  config?: SessionConfig;
  // Additional fields from API response
  last_qr_generated_at?: string;
  connection_count?: number;
  messages_sent?: number;
  messages_received?: number;
}

export type SessionStatus = 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED' | 'STOPPED' | 'starting' | 'scan_qr_code' | 'working' | 'failed' | 'stopped';

export interface SessionConfig {
  webhook_url?: string;
  webhook_events?: string[];
  auto_reply?: boolean;
  business_hours?: BusinessHours;
}

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  schedules: DaySchedule[];
}

export interface DaySchedule {
  day: string;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

// Ticket types
export interface Ticket extends BaseEntity {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  contact_id: string;
  assigned_to_id?: string;
  created_by_id: string;
  category?: string;
  tags: string[];
  due_date?: string;
  resolved_at?: string;
  first_response_at?: string;
  sla_breached: boolean;
  contact?: Contact;
  assigned_to?: User;
  created_by?: User;
  messages?: Message[];
}

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

// Chat/Conversation types
export interface Conversation {
  contact: Contact;
  last_message?: Message;
  unread_count: number;
  status: ConversationStatus;
  assigned_to?: User;
  labels: Label[];
  last_activity: string;
  ticket?: Ticket;
}

export type ConversationStatus = 'active' | 'pending' | 'resolved' | 'archived';

// Chat grouping types
export interface ChatGroup {
  id: string;
  name: string;
  count: number;
  conversations: Conversation[];
}

export interface ChatGroups {
  needReply: {
    urgent: Conversation[];
    normal: Conversation[];
    overdue: Conversation[];
  };
  automated: {
    botHandled: Conversation[];
    autoReply: Conversation[];
    workflow: Conversation[];
  };
  completed: {
    resolved: Conversation[];
    closed: Conversation[];
    archived: Conversation[];
  };
}

// WebSocket types
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export type WebSocketEventType = 
  | 'message_received'
  | 'message_sent'
  | 'message_status_update'
  | 'typing_start'
  | 'typing_stop'
  | 'user_online'
  | 'user_offline'
  | 'session_status_update'
  | 'qr_code_update'
  | 'conversation_assigned'
  | 'ticket_created'
  | 'ticket_updated';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Dashboard/Analytics types
export interface DashboardStats {
  total_messages: number;
  total_contacts: number;
  active_sessions: number;
  pending_tickets: number;
  response_time_avg: number;
  messages_today: number;
  new_contacts_today: number;
  resolved_tickets_today: number;
}

export interface AgentPerformance {
  agent: User;
  messages_sent: number;
  conversations_handled: number;
  avg_response_time: number;
  tickets_resolved: number;
  customer_satisfaction: number;
  active_time: number;
}

// Report types
export interface ReportData {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  data: any;
  generated_at: string;
  filters?: ReportFilters;
}

export type ReportType = 
  | 'agent_performance'
  | 'whatsapp_summary'
  | 'template_effectiveness'
  | 'chat_resolution'
  | 'daily_chat'
  | 'contact_labels'
  | 'daily_analytics'
  | 'conversation_labels'
  | 'campaign_tracking'
  | 'agent_assignment';

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  agent_ids?: string[];
  session_ids?: string[];
  contact_ids?: string[];
  status?: string[];
  priority?: string[];
}

// Form types
export interface ContactForm {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  label_ids?: string[];
}

export interface MessageForm {
  content: string;
  message_type: MessageType;
  contact_id: string;
  session_id: string;
  media_file?: File;
}

export interface TicketForm {
  title: string;
  description: string;
  priority: TicketPriority;
  contact_id: string;
  category?: string;
  tags?: string[];
  assigned_to_id?: string;
  due_date?: string;
}

// UI State types
export interface UIState {
  sidebarCollapsed: boolean;
  rightSidebarVisible: boolean;
  activeTab: string;
  selectedConversation?: Conversation;
  selectedContact?: Contact;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

// Media types
export interface MediaFile {
  id: string;
  url: string;
  thumbnail?: string;
  filename: string;
  size: number;
  type: string;
  duration?: number;
  width?: number;
  height?: number;
  uploaded_at: string;
}

// Search types
export interface SearchResult {
  type: 'message' | 'contact' | 'ticket';
  id: string;
  title: string;
  content: string;
  highlight: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  query: string;
  type?: 'message' | 'contact' | 'ticket' | 'all';
  date_from?: string;
  date_to?: string;
  contact_id?: string;
  session_id?: string;
} 