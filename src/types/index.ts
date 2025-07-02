// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Date range type for analytics and filtering
export interface DateRange {
  from: Date;
  to: Date;
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

// Enhanced Message types with 9 types and interactive features
export interface Message extends BaseEntity {
  contact_id: string;
  session_id: string;
  ticket_id?: string;
  content: string;
  message_type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  
  // Media & File properties
  media_url?: string;
  media_type?: string;
  media_size?: number;
  media_filename?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  
  // Audio/Video specific
  duration?: number;
  waveform?: number[]; // For audio visualization
  resolution?: string; // For images/videos
  
  // Location specific
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  business_name?: string;
  operating_hours?: string;
  
  // Payment specific
  payment_amount?: number;
  payment_currency?: string;
  payment_invoice_id?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_description?: string;
  
  // Link preview
  link_preview?: LinkPreview;
  
  // Timestamps
  read_at?: string;
  delivered_at?: string;
  edited_at?: string;
  
  // Threading & Replies
  reply_to_message_id?: string;
  replied_to_id?: string;
  quoted_message?: Message;
  thread_count?: number;
  
  // Forwarding
  forwarded_from_id?: string;
  forwarded_from?: Message;
  
  // Interactive Features
  reactions?: MessageReaction[];
  read_by?: MessageReadReceipt[];
  can_edit?: boolean;
  can_delete?: boolean;
  can_forward?: boolean;
  can_reply?: boolean;
  
  // External IDs
  waha_message_id?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  edit_history?: EditHistory[];
}

// Enhanced Message Types (9 types)
export type MessageType = 
  | 'text'      // Text with mentions, links, formatting
  | 'audio'     // Voice messages with waveform
  | 'image'     // Images with metadata and preview
  | 'video'     // Videos with player and thumbnails
  | 'document'  // Files, PDFs, office docs
  | 'location'  // GPS coordinates with business info
  | 'payment'   // Payment invoices and links
  | 'link'      // Rich link previews
  | 'system';   // System notifications

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Interactive Message Features
export interface MessageReaction {
  id: string;
  message_id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  read_at: string;
}

export interface EditHistory {
  id: string;
  original_content: string;
  edited_content: string;
  edited_at: string;
  edited_by: string;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  favicon?: string;
  site_name?: string;
}

// Enhanced Message Input Features
export interface MessageInputFeatures {
  // Search Integration
  inChatSearch: boolean;
  messageFilters: boolean;
  
  // File Upload
  fileUpload: {
    photos: boolean;
    documents: boolean;
    videos: boolean;
    location: boolean;
    maxSize: string; // '50MB'
    allowedTypes: string[];
    dragAndDrop: boolean;
    progressIndicators: boolean;
  };
  
  // Voice Recording
  voiceRecording: {
    waveformVisualization: boolean;
    recordingTimer: boolean;
    playbackPreview: boolean;
    noiseReduction: boolean;
  };
  
  // Smart Features
  emojiPicker: boolean;
  quickReplyTemplates: boolean;
  autoSaveDrafts: boolean;
  typingIndicators: boolean;
  mentionSupport: boolean;
  
  // Advanced Features
  paymentLinkGenerator: boolean;
  linkPreview: boolean;
  messagePlanning: boolean;
}

// Quick Reply Templates
export interface QuickReplyTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  usage_count: number;
  admin_id: string;
  created_at: string;
  updated_at: string;
}

// Draft Messages
export interface DraftMessage {
  id: string;
  contact_id: string;
  admin_id: string;
  content: string;
  updated_at: string;
}

// File Upload Progress
export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// Enhanced WebSocket Events
export interface EnhancedWebSocketEvents {
  // Message Events
  'message:received': (data: Message) => void;
  'message:delivered': (data: { messageId: string; deliveredAt: string }) => void;
  'message:read': (data: { messageId: string; readBy: string; readAt: string }) => void;
  'message:edited': (data: { messageId: string; newContent: string; editedAt: string }) => void;
  'message:deleted': (data: { messageId: string; deletedAt: string }) => void;
  
  // Interaction Events
  'reaction:added': (data: { messageId: string; emoji: string; user: string }) => void;
  'reaction:removed': (data: { messageId: string; emoji: string; user: string }) => void;
  
  // Typing Events
  'typing:start': (data: { contactId: string; user: string }) => void;
  'typing:stop': (data: { contactId: string; user: string }) => void;
  
  // Presence Events
  'presence:online': (data: { contactId: string; lastSeen: string }) => void;
  'presence:offline': (data: { contactId: string; lastSeen: string }) => void;
  
  // File Events
  'file:upload:progress': (data: FileUploadProgress) => void;
  'file:upload:complete': (data: { fileId: string; url: string }) => void;
  'file:upload:error': (data: { fileId: string; error: string }) => void;
  
  // Draft Events
  'draft:saved': (data: { contactId: string; content: string }) => void;
  'draft:restored': (data: { contactId: string; content: string }) => void;
}

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

// Enhanced Conversation Management
export interface Conversation {
  id: string;
  contact_id: string;
  contact: Contact;
  session_id?: string;
  session?: Session;
  last_message_id?: string;
  last_message?: Message;
  tickets?: Ticket[];
  created_at: string;
  updated_at: string;
  
  // Enriched fields from backend
  unread_count: number;
  status: ConversationStatus;
  last_activity: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  online_status?: 'online' | 'recent' | 'offline';
  labels: string[];
  assigned_to?: User;
  active_ticket?: Ticket;
  
  // Enhanced features
  ticket_episodes?: TicketEpisode[];
  contact_notes?: ContactNote[];
}

export type ConversationStatus = 'active' | 'pending' | 'resolved' | 'archived';

// Conversation Modes
export type ConversationMode = 'unified' | 'ticket-specific';

export interface UnifiedConversation {
  contact: Contact;
  allMessages: Message[];
  ticketEpisodes: TicketEpisode[];
  labels: Label[];
  notes: ContactNote[];
  timeline: TimelineEvent[];
}

export interface TicketEpisode {
  id: string;
  ticket_id: string;
  title: string;
  status: 'active' | 'completed' | 'automated';
  message_count: number;
  start_date: string;
  end_date?: string;
  assigned_admin?: string;
  category: 'support' | 'sales' | 'billing' | 'general';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  tags: string[];
}

export interface ContactNote {
  id: string;
  contact_id: string;
  content: string;
  type: 'public' | 'private';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  type: 'message' | 'note' | 'ticket_created' | 'ticket_resolved' | 'label_added';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

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
  | 'ticket_updated'
  // Enhanced events
  | 'message_edited'
  | 'message_deleted'
  | 'reaction_added'
  | 'reaction_removed'
  | 'file_upload_progress'
  | 'draft_saved';

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

// Dashboard and Analytics types
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
  reply_to_message_id?: string;
  quoted_message_id?: string;
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

// Media and File types
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

// Sync types
export interface SyncOptions {
  create_if_new: boolean;
  update_if_exists: boolean;
  skip_duplicates: boolean;
  conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
  include_metadata?: boolean;
  batch_size?: number;
  parallel_sync?: boolean;
}

export interface SyncFilters {
  active_sessions_only?: boolean;
  last_activity_hours?: number;
}

export interface SyncContactRequest {
  phone_number: string;
  limit?: number;
  upsert_mode?: boolean;
  sync_options?: SyncOptions;
}

export interface SyncAllRequest {
  limit?: number;
  upsert_mode?: boolean;
  sync_options?: SyncOptions;
  filters?: SyncFilters;
}

export interface SyncResult {
  phone_number: string;
  contact_name?: string;
  new_records: number;
  updated_records: number;
  skipped_records: number;
  total_processed: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  duration: string;
  errors?: string[];
  last_sync_at: string;
}

export interface SyncAllResult {
  total_contacts: number;
  successful_syncs: number;
  failed_syncs: number;
  total_new_records: number;
  total_updated_records: number;
  total_skipped_records: number;
  sync_results: SyncResult[];
  duration: string;
  started_at: string;
  completed_at: string;
}

export interface SyncStatus {
  phone_number: string;
  contact_name?: string;
  last_sync: string | null;
  message_count: number;
  status: 'idle' | 'syncing' | 'completed' | 'failed' | 'conflict';
  sync_progress?: number; // 0-100
  last_error?: string;
  next_sync_at?: string;
  conflict_count?: number;
}

export interface SyncConflict {
  id: string;
  phone_number: string;
  message_id: string;
  local_message: Message;
  remote_message: Message;
  conflict_type: 'content_mismatch' | 'timestamp_conflict' | 'status_conflict';
  created_at: string;
  resolved: boolean;
  resolution?: 'local_kept' | 'remote_kept' | 'merged';
}

export interface SyncHistory {
  id: string;
  phone_number: string;
  sync_type: 'contact' | 'all';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  result?: SyncResult;
  error?: string;
  initiated_by: string; // user ID or 'system'
}

export interface ConflictResolutionRequest {
  phone_number: string;
  conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
  message_ids?: string[];
}

export interface WAHASessionValidation {
  session_name: string;
  phone_number?: string;
  status: SessionStatus;
  is_ready: boolean;
  last_activity?: string;
  can_sync: boolean;
  validation_errors?: string[];
}

export interface PhoneNumberValidation {
  phone_number: string;
  is_valid: boolean;
  formatted_number?: string;
  country_code?: string;
  carrier?: string;
  type?: 'mobile' | 'landline' | 'voip';
  can_receive_whatsapp: boolean;
  validation_errors?: string[];
} 