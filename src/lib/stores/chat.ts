import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Contact, Message, Conversation, ChatGroups, MessageForm, Ticket, QuickReplyTemplate, ContactNote, DraftMessage } from '@/types';
import { contactsApi, messagesApi, ticketsApi, quickReplyApi, contactNotesApi, draftMessagesApi, conversationsApi, antiBlockingApi } from '@/lib/api';
import { createWebSocketManager, getWebSocketManager } from '@/lib/websocket';
import { shallow } from 'zustand/shallow';
import { useAntiBlockingStore } from './antiBlocking';

/**
 * OPTIMIZED MESSAGE LOADING STRATEGY
 * 
 * This store implements several optimizations to avoid unnecessary API calls and data replacements:
 * 
 * 1. SMART LOADING (loadMessages):
 *    - Checks if messages already exist for the ticket/page combination
 *    - Skips loading if data is already available (unless forceRefresh=true)
 *    - Reduces unnecessary API calls and UI flickering
 * 
 * 2. APPEND LOADING (appendMessages):
 *    - Loads additional pages without replacing existing messages
 *    - Avoids duplicates by checking message IDs
 *    - Useful for pagination or loading older messages
 * 
 * 3. SINGLE MESSAGE OPERATIONS:
 *    - updateSingleMessage: Updates one message without reloading all
 *    - addSingleMessage: Adds one message without reloading all
 *    - Preserves existing state and optimistically updates UI
 * 
 * 4. DUAL STORAGE STRATEGY:
 *    - contactMessages: For unified conversation view (all messages per contact)
 *    - messages: For ticket-specific view (messages per ticket)
 *    - Both are kept in sync automatically
 * 
 * 5. CACHING:
 *    - Messages are cached by ticket ID and page
 *    - Prevents redundant API calls for same data
 *    - Manual refresh available via refreshMessages()
 * 
 * USAGE EXAMPLES:
 * 
 * // Load messages for first time
 * loadMessages(ticketId, 1)
 * 
 * // Load more messages (pagination)
 * appendMessages(ticketId, 2)
 * 
 * // Force refresh (ignore cache)
 * refreshMessages(ticketId)
 * 
 * // Update single message (e.g., mark as read)
 * updateSingleMessage(ticketId, messageId, { read_at: new Date().toISOString() })
 * 
 * // Add new message (e.g., from WebSocket)
 * addSingleMessage(ticketId, newMessage)
 */

// New types for contact-based conversations
interface TicketEpisode {
  ticket: Ticket;
  messageCount: number;
  startDate: string;
  endDate?: string;
  duration?: string;
  status: string;
  category: 'PERLU_DIBALAS' | 'OTOMATIS' | 'SELESAI';
  unreadCount: number;
  lastMessage?: Message;
}

interface ContactConversation {
  contact: Contact;
  allMessages: Message[];
  ticketEpisodes: TicketEpisode[];
  currentTicket?: Ticket;
  totalMessages: number;
  unreadCount: number;
  lastActivity: string;
  conversationAge: string;
}

interface ChatState {
  // Contact-based conversations
  conversations: Conversation[];
  chatGroups: ChatGroups;
  
  // New: Contact conversation management
  activeContactConversation: ContactConversation | null;
  contactMessages: Record<string, Message[]>; // contactId -> all messages
  ticketEpisodes: Record<string, TicketEpisode[]>; // contactId -> episodes
  
  // Active chat
  activeContact: Contact | null;
  activeConversation: Conversation | null;
  activeTicket: Ticket | null;
  selectedContactId: string | null;
  
  // Messages (keeping for backward compatibility)
  messages: Record<string, Message[]>; // ticketId -> messages
  messagePages: Record<string, number>; // ticketId -> current page
  
  // New: Conversation mode
  conversationMode: 'unified' | 'ticket-specific'; // Toggle between views
  showTicketHistory: boolean;
  
  // Quick Reply Templates
  quickReplyTemplates: QuickReplyTemplate[];
  isLoadingQuickReplies: boolean;
  
  // Contact Notes
  contactNotes: Record<string, ContactNote[]>; // contactId -> notes
  isLoadingContactNotes: boolean;
  
  // Draft Messages
  draftMessages: Record<string, DraftMessage>; // contactId -> draft
  isLoadingDraftMessages: boolean;
  
  // UI state
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  rightSidebarVisible: boolean;
  rightSidebarMode: 'auto' | 'always' | 'never'; // NEW: mode for info panel
  
  // Search
  searchQuery: string;
  searchResults: Message[];
  isSearching: boolean;
  
  // Typing indicators
  typingUsers: Record<string, string[]>; // ticketId -> typing usernames
  
  // Errors
  error: string | null;
}

interface ChatActions {
  // Conversations
  loadConversations: () => Promise<void>;
  groupConversations: () => void;
  selectConversation: (contact: Contact) => void;
  clearActiveConversation: () => void;
  updateConversationStatus: (contactId: string, status: string) => void;
  
  // New: Contact-based conversation actions
  loadContactConversation: (contactId: string) => Promise<void>;
  loadContactMessages: (contactId: string, page?: number, query?: string, append?: boolean) => Promise<any>;
  loadTicketEpisodes: (contactId: string) => Promise<void>;
  selectTicketEpisode: (ticketId: string) => void;
  toggleConversationMode: () => void;
  toggleTicketHistory: () => void;
  
  // Messages
  loadMessages: (ticketId: string, page?: number, forceRefresh?: boolean) => Promise<void>;
  appendMessages: (ticketId: string, page?: number) => Promise<void>;
  refreshMessages: (ticketId: string) => Promise<void>;
  updateSingleMessage: (ticketId: string, messageId: string, updates: Partial<Message>) => void;
  addSingleMessage: (ticketId: string, message: Message) => void;
  sendMessage: (data: MessageForm) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markMessagesAsRead: (ticketId: string) => void;
  
  // Quick Reply Templates
  loadQuickReplyTemplates: () => Promise<void>;
  createQuickReply: (data: { title: string; content: string; category: string }) => Promise<void>;
  updateQuickReply: (id: string, data: { title?: string; content?: string; category?: string }) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  useQuickReply: (id: string) => Promise<void>;
  
  // Contact Notes
  loadContactNotes: (contactId: string) => Promise<void>;
  createContactNote: (contactId: string, data: { content: string; type: 'public' | 'private' }) => Promise<void>;
  updateContactNote: (id: string, data: { content?: string; type?: 'public' | 'private' }) => Promise<void>;
  deleteContactNote: (id: string) => Promise<void>;
  
  // Draft Messages
  loadDraftMessage: (contactId: string) => Promise<void>;
  saveDraftMessage: (contactId: string, content: string) => Promise<void>;
  deleteDraftMessage: (contactId: string) => Promise<void>;
  autoSaveDraft: (contactId: string, content: string) => Promise<void>;
  
  // Real-time updates
  handleIncomingMessage: (message: Message) => void;
  handleMessageStatusUpdate: (messageId: string, status: string) => void;
  handleTypingStart: (ticketId: string, username: string) => void;
  handleTypingStop: (ticketId: string, username: string) => void;
  
  // Search
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightSidebar: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRightSidebarMode: (mode: 'auto' | 'always' | 'never') => void; // NEW
  getActiveTicket: () => any; // Helper method to get active ticket
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    chatGroups: {
      needReply: { urgent: [], normal: [], overdue: [] },
      automated: { botHandled: [], autoReply: [], workflow: [] },
      completed: { resolved: [], closed: [], archived: [] },
    },
    activeContactConversation: null,
    contactMessages: {},
    ticketEpisodes: {},
    activeContact: null,
    activeConversation: null,
    activeTicket: null,
    selectedContactId: null,
    messages: {},
    messagePages: {},
    conversationMode: 'unified',
    showTicketHistory: false,
    quickReplyTemplates: [],
    isLoadingQuickReplies: false,
    contactNotes: {},
    isLoadingContactNotes: false,
    draftMessages: {},
    isLoadingDraftMessages: false,
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    sidebarCollapsed: false,
    rightSidebarVisible: false,
    rightSidebarMode: 'auto', // NEW
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    typingUsers: {},
    error: null,

    // Actions
    loadConversations: async () => {
      set({ isLoadingConversations: true, error: null });
      try {
        // Load conversations from backend using the API with proper authentication
        const conversations = await conversationsApi.getAll();
        console.log('conversations', conversations);
        set({
          conversations,
          isLoadingConversations: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to load conversations:', error);
        set({
          conversations: [],
          error: 'Failed to load conversations',
          isLoadingConversations: false
        });
      }
    },

    groupConversations: () => {
      const { conversations } = get();
      const chatGroups = groupConversationsIntoCategories(conversations);
      set({ chatGroups });
    },

    selectConversation: async (contact: Contact) => {
      try {
        // Find the conversation for this contact
        const conversation = get().conversations.find(c => c.contact.id === contact.id);
        
        set({ 
          activeContact: contact,
          activeConversation: conversation || null,
          selectedContactId: contact.id,
          isLoadingMessages: true,
          error: null,
        });
        
        // Load contact conversation for info panel
        console.log('DEBUG selectConversation: loading contact conversation for:', contact.id);
        await get().loadContactConversation(contact.id);
        
        // Load all messages for this contact using the unified endpoint
        await get().loadContactMessages(contact.id, 1);
        
        // Join WebSocket room for real-time updates
        const ws = getWebSocketManager();
        if (ws) {
          console.log('[WS] Join contact room:', contact.id);
          ws.joinContactRoom(contact.id.toString());
          console.log(`[WS] User joined chat room: contact_${contact.id}`);
        }
        
        // Set active ticket - prioritize from conversation, then from contact conversation
        let activeTicket = conversation?.active_ticket;
        
        if (!activeTicket) {
          // Try to get from contact conversation
          const contactConversation = get().activeContactConversation;
          activeTicket = contactConversation?.currentTicket;
        }
        
        if (activeTicket) {
          set({ activeTicket });
        } else {
          console.log('No active ticket found for contact:', contact.id, '- this is normal for new conversations');
        }
        
        set({ isLoadingMessages: false });
        
      } catch (error) {
        console.error('Failed to select conversation:', error);
        set({ 
          error: 'Failed to load conversation details',
          isLoadingMessages: false,
        });
      }
    },

    clearActiveConversation: () => {
      const { activeContact } = get();
      
      // Leave WebSocket room
      const ws = getWebSocketManager();
      if (ws && activeContact) {
        ws.leaveContactRoom(activeContact.id.toString());
        console.log(`[WS] User left chat room: contact_${activeContact.id}`);
      }
      
      set({
        activeContact: null,
        activeConversation: null,
        activeTicket: null,
        selectedContactId: null,
      });
    },

    updateConversationStatus: (contactId, status) => {
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.contact.id === contactId
            ? { ...conv, status: status as any }
            : conv
        ),
      }));
      
      // Re-group conversations after status update
      get().groupConversations();
    },

    // New: Contact-based conversation actions
    loadContactConversation: async (contactId: string) => {
      console.log('DEBUG loadContactConversation called with contactId:', contactId);
      try {
        // Load all tickets for this contact (for info panel)
        console.log('DEBUG loading tickets for contact:', contactId);
        const tickets = await ticketsApi.getByContact(contactId);
        console.log('DEBUG tickets loaded:', tickets);
        
        // Create ticket episodes for info panel
        const episodes: TicketEpisode[] = tickets.map((ticket: any) => ({
          ticket,
          messageCount: ticket.message_count || 0,
          startDate: ticket.created_at,
          endDate: ticket.resolved_at || (ticket.status === 'CLOSED' ? ticket.updated_at : undefined),
          status: ticket.status,
          category: getTicketCategory(ticket),
          unreadCount: ticket.unread_count || 0,
          lastMessage: ticket.last_message,
        }));
        
        // Get contact info
        const contact = get().conversations.find(c => c.contact.id === contactId)?.contact;
        if (!contact) throw new Error('Contact not found');
        
        // Find current active ticket (most recent open)
        const currentTicket = tickets.find(t => t.status === 'OPEN') || tickets[0];
        
        const conversation: ContactConversation = {
          contact,
          allMessages: [], // Messages will be loaded separately by loadContactMessages
          ticketEpisodes: episodes,
          currentTicket,
          totalMessages: episodes.reduce((sum, ep) => sum + ep.messageCount, 0),
          unreadCount: episodes.reduce((sum, ep) => sum + ep.unreadCount, 0),
          lastActivity: currentTicket?.updated_at || new Date().toISOString(),
          conversationAge: calculateConversationAge(currentTicket?.created_at),
        };
        
        set((state) => ({
          activeContactConversation: conversation,
          ticketEpisodes: {
            ...state.ticketEpisodes,
            [contactId]: episodes,
          },
          // Also set active ticket if not already set
          activeTicket: state.activeTicket || currentTicket,
        }));
        
      } catch (error) {
        console.error('Failed to load contact conversation:', error);
        set({
          error: 'Failed to load contact conversation',
        });
      }
    },

    loadContactMessages: async (contactId: string, page = 1, query?: string, append = false) => {
      try {
        console.log('🔍 loadContactMessages called with:', { contactId, page, query, append });
        set({ isLoadingMessages: true, error: null });
        
        // Use the unified contact messages endpoint with DESC order for reverse pagination
        const response = await messagesApi.getByContact(contactId, { 
          page, 
          limit: 20, 
          query,
          order: 'timestamp DESC' // Get newest messages first
        });
        
        console.log('🔍 API response:', response);
        
        // Handle different response formats
        let messages: Message[] = [];
        if (response.data?.messages) {
          messages = response.data.messages;
        } else if (response.data && Array.isArray(response.data)) {
          messages = response.data;
        } else if (response.data && response.data.data) {
          messages = response.data.data;
        }
        
        const total = response.meta?.total || response.data?.meta?.total || messages.length;
        
        console.log('🔍 Processed messages:', messages.length, 'total:', total);
        
        // Convert backend message format to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || 'default',
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as 'incoming' | 'outgoing',
          message_type: msg.message_type || 'text',
          content: msg.content || msg.body || '',
          body: msg.content || msg.body || '',
          status: msg.status?.toLowerCase() || 'sent',
          media_url: msg.media_url,
          created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
        }));
        
        // For reverse pagination: reverse the messages to show oldest to newest
        const reversedMessages = formattedMessages.reverse();
        
        set((state) => {
          const existingMessages = state.contactMessages[contactId] || [];
          let newMessages: Message[];
          
          if (append && page > 1) {
            // Append older messages to the beginning (for pagination)
            newMessages = [...reversedMessages, ...existingMessages];
          } else {
            // Replace messages (for initial load or refresh)
            newMessages = reversedMessages;
          }
          
          return {
            contactMessages: {
              ...state.contactMessages,
              [contactId]: newMessages,
            },
            searchQuery: query || '',
            searchResults: query ? newMessages : [],
            isLoadingMessages: false,
          };
        });
        
        console.log('🔍 Search state updated:', { searchQuery: query, searchResultsCount: query ? formattedMessages.length : 0 });
        
        // Return the response so we can access pagination metadata
        return response;
        
      } catch (error) {
        console.error('Failed to load contact messages:', error);
        set({
          error: 'Failed to load messages',
          isLoadingMessages: false,
        });
        throw error;
      }
    },

    loadOlderMessages: async (contactId: string, page: number) => {
      try {
        console.log('🔍 loadOlderMessages called with:', { contactId, page });
        set({ isLoadingMessages: true, error: null });
        
        // Load older messages (higher page number = older messages)
        const response = await messagesApi.getByContact(contactId, { 
          page, 
          limit: 20, 
          order: 'timestamp DESC' // Get older messages
        });
        
        console.log('🔍 API response for older messages:', response);
        
        // Handle different response formats
        let messages: Message[] = [];
        if (response.data?.messages) {
          messages = response.data.messages;
        } else if (response.data && Array.isArray(response.data)) {
          messages = response.data;
        } else if (response.data && response.data.data) {
          messages = response.data.data;
        }
        
        // Convert backend message format to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || 'default',
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as 'incoming' | 'outgoing',
          message_type: msg.message_type || 'text',
          content: msg.content || msg.body || '',
          body: msg.content || msg.body || '',
          status: msg.status?.toLowerCase() || 'sent',
          media_url: msg.media_url,
          created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
        }));
        
        // For reverse pagination: reverse the messages to show oldest to newest
        const reversedMessages = formattedMessages.reverse();
        
        // Append older messages to the beginning
        set((state) => {
          const existingMessages = state.contactMessages[contactId] || [];
          const newMessages = [...reversedMessages, ...existingMessages];
          
          return {
            contactMessages: {
              ...state.contactMessages,
              [contactId]: newMessages,
            },
            isLoadingMessages: false,
          };
        });
        
        console.log('🔍 Messages loaded:', { contactId, messageCount: reversedMessages.length });
        
      } catch (error) {
        console.error('Failed to load contact messages:', error);
        set({
          error: 'Failed to load messages',
          isLoadingMessages: false,
        });
      }
    },

    loadTicketEpisodes: async (contactId: string) => {
      try {
        const tickets = await ticketsApi.getByContact(contactId);
        
        const episodes: TicketEpisode[] = tickets.map((ticket: any) => ({
          ticket,
          messageCount: ticket.message_count || 0,
          startDate: ticket.created_at,
          endDate: ticket.resolved_at || (ticket.status === 'CLOSED' ? ticket.updated_at : undefined),
          status: ticket.status,
          category: getTicketCategory(ticket),
          unreadCount: ticket.unread_count || 0,
          lastMessage: ticket.last_message,
        }));
        
        set((state) => ({
          ticketEpisodes: {
            ...state.ticketEpisodes,
            [contactId]: episodes,
          },
        }));
        
      } catch (error) {
        console.error('Failed to load ticket episodes:', error);
      }
    },

    selectTicketEpisode: (ticketId: string) => {
      // Switch to specific ticket view
      set({ conversationMode: 'ticket-specific' });
      get().loadMessages(ticketId);
      
      // Update active ticket
      const conversation = get().conversations.find(c => c.active_ticket?.id?.toString() === ticketId);
      if (conversation) {
        set({ 
          activeTicket: conversation.active_ticket,
          activeConversation: conversation,
        });
      }
    },

    toggleConversationMode: () => {
      set((state) => ({
        conversationMode: state.conversationMode === 'unified' ? 'ticket-specific' : 'unified',
      }));
    },

    toggleTicketHistory: () => {
      set((state) => ({
        showTicketHistory: !state.showTicketHistory,
      }));
    },

    loadMessages: async (ticketId: string, page = 1, forceRefresh = false) => {
      try {
        set({ isLoadingMessages: true, error: null });
        
        // Check if we already have messages for this ticket and page
        const existingMessages = get().messages[ticketId] || [];
        const existingPage = get().messagePages[ticketId] || 0;
        
        // Skip loading if we already have the data and not forcing refresh
        if (!forceRefresh && existingMessages.length > 0 && existingPage === page) {
          set({ isLoadingMessages: false });
          return;
        }
        
        // Load messages from backend
        const messages = await messagesApi.getByTicket(ticketId, {
          page,
          per_page: 1000,
          order: 'created_at ASC'
        });
        
        // Convert backend messages to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || 'default',
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as 'incoming' | 'outgoing',
          message_type: msg.message_type || 'text',
          content: msg.body || msg.content || '',
          body: msg.body || msg.content || '',
          status: msg.status?.toLowerCase() || 'sent',
          media_url: msg.media_url,
          created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
        }));
        
        set((state) => ({
          messages: {
            ...state.messages,
            [ticketId]: formattedMessages,
          },
          messagePages: {
            ...state.messagePages,
            [ticketId]: page,
          },
          isLoadingMessages: false,
        }));
      } catch (error) {
        console.error('Failed to load messages:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load messages',
          isLoadingMessages: false,
        });
      }
    },

    appendMessages: async (ticketId: string, page = 1) => {
      try {
        set({ isLoadingMessages: true, error: null });
        
        const existingMessages = get().messages[ticketId] || [];
        
        // Load messages from backend
        const messages = await messagesApi.getByTicket(ticketId, {
          page,
          per_page: 1000,
          order: 'created_at ASC'
        });
        
        // Convert backend messages to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || 'default',
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as 'incoming' | 'outgoing',
          message_type: msg.message_type || 'text',
          content: msg.body || msg.content || '',
          body: msg.body || msg.content || '',
          status: msg.status?.toLowerCase() || 'sent',
          media_url: msg.media_url,
          created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
        }));
        
        // Append new messages to existing ones, avoiding duplicates
        const existingIds = new Set(existingMessages.map(msg => msg.id));
        const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id));
        
        set((state) => ({
          messages: {
            ...state.messages,
            [ticketId]: [...existingMessages, ...newMessages],
          },
          messagePages: {
            ...state.messagePages,
            [ticketId]: page,
          },
          isLoadingMessages: false,
        }));
      } catch (error) {
        console.error('Failed to append messages:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to append messages',
          isLoadingMessages: false,
        });
      }
    },

    refreshMessages: async (ticketId: string) => {
      return get().loadMessages(ticketId, 1, true);
    },

    updateSingleMessage: (ticketId: string, messageId: string, updates: Partial<Message>) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: state.messages[ticketId]?.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || [],
        },
      }));
    },

    addSingleMessage: (ticketId: string, message: Message) => {
      set((state) => {
        const existingMessages = state.messages[ticketId] || [];
        const existingIds = new Set(existingMessages.map(msg => msg.id));
        
        // Don't add if message already exists
        if (existingIds.has(message.id)) {
          return state;
        }
        
        return {
          messages: {
            ...state.messages,
            [ticketId]: [...existingMessages, message],
          },
        };
      });
    },

    sendMessage: async (data) => {
      try {
        set({ isSendingMessage: true, error: null });
        const { activeContact } = get();
        let ticketToUse = get().getActiveTicket();
        
        if (!activeContact) {
          throw new Error('No active contact selected');
        }

        console.log('activeContact check chat ts', activeContact);

        // If no active ticket, try to create one or send without ticket
        if (!ticketToUse) {
          console.log('[Chat] No active ticket found, attempting to create ticket or send without ticket');
          
          // Option 1: Try to create a ticket automatically
          try {
            const ticketResponse = await ticketsApi.create({
              contact_id: parseInt(activeContact.id),
              session_id: 1, // Default session
              subject: `Chat with ${activeContact.name || activeContact.phone_number}`,
              description: 'Auto-created ticket from chat',
              priority: 'MEDIUM',
            });
            
            if (ticketResponse) {
              ticketToUse = ticketResponse;
              // Update active ticket in state
              set({ activeTicket: ticketResponse });
              console.log('[Chat] Created new ticket:', ticketResponse.id);
            }
          } catch (ticketError) {
            console.warn('[Chat] Failed to create ticket automatically:', ticketError);
            // Continue without ticket - will send message without ticket association
          }
        }

        const phoneNumber = activeContact.phone || activeContact.phone_number || activeContact.PhoneNumber;
        if (!phoneNumber) {
          throw new Error('Contact phone number is required');
        }

        // Send message directly without anti-blocking
        console.log('[Chat] Sending message directly without anti-blocking');
        
        // Create message object for UI
        const newMessage: Message = {
          id: Date.now().toString(),
          ticket_id: ticketToUse ? ticketToUse.id.toString() : null, // Can be null if no ticket
          contact_id: activeContact.id,
          session_id: 'default',
          direction: 'outgoing',
          message_type: data.message_type || 'text',
          content: data.content,
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };


        // Add message to UI immediately
        get().addMessage(newMessage);
        
        // Send message via regular messages API
        try {
          const response = await messagesApi.send({
            session_name: 'default',
            ticket_id: ticketToUse ? parseInt(ticketToUse.id.toString()) : 0, // Required field
            to: activeContact.wa_id, // Required field - phone number
            text: data.content, // Required field - message content
            admin_id: 1, // Required field - will be overridden by backend
          });
          
          // Update message with response data if available
          if (response && response.id) {
            get().updateMessage(newMessage.id, {
              id: response.id.toString(),
              status: response.status || 'sent',
            });
          }
        } catch (sendError) {
          console.error('[Chat] Failed to send message:', sendError);
          // Update message status to failed
          get().updateMessage(newMessage.id, {
            status: 'failed',
          });
          throw new Error('Failed to send message to server');
        }
        
        if (activeContact?.id) {
          await get().loadContactMessages(activeContact.id, 1);
        }
        
        set({ isSendingMessage: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to send message',
          isSendingMessage: false,
        });
        throw error;
      }
    },

    addMessage: (message: Message) => {
      const contactId = message.contact_id;
      const ticketId = message.ticket_id;
      if (!contactId) return;
      
      // Add to contact-based messages (for unified view)
      set((state) => ({
        contactMessages: {
          ...state.contactMessages,
          [contactId]: [...(state.contactMessages[contactId] || []), message],
        },
      }));
      
      // Also add to ticket-based messages if ticketId exists
      if (ticketId) {
        get().addSingleMessage(ticketId, message);
      }
    },

    updateMessage: (messageId: string, updates: Partial<Message>) => {
      set((state) => {
        // Update in contact-based messages
        const newContactMessages: Record<string, Message[]> = {};
        Object.entries(state.contactMessages).forEach(([contactId, contactMessages]) => {
          newContactMessages[contactId] = contactMessages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        // Update in ticket-based messages
        const newMessages: Record<string, Message[]> = {};
        Object.entries(state.messages).forEach(([ticketId, ticketMessages]) => {
          newMessages[ticketId] = ticketMessages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        return { 
          contactMessages: newContactMessages,
          messages: newMessages 
        };
      });
    },

    markMessagesAsRead: async (ticketId: string) => {
      try {
        // Mark messages as read in the backend
        await messagesApi.markAsRead(ticketId);
        
        // Update local state
        set((state) => ({
          messages: {
            ...state.messages,
            [ticketId]: state.messages[ticketId]?.map(msg =>
              msg.direction === 'incoming' && !msg.read_at
                ? { ...msg, read_at: new Date().toISOString() }
                : msg
            ) || [],
          },
          conversations: state.conversations.map(conv =>
            conv.active_ticket?.id?.toString() === ticketId
              ? { ...conv, unread_count: 0 }
              : conv
          ),
        }));
        
        // Re-group conversations
        get().groupConversations();
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    },

    // Real-time handlers
    handleIncomingMessage: async (message) => {
      console.log('[WS] handleIncomingMessage called:', message);
      get().addMessage(message);

      const contactId = message.contact_id;
      const state = get();
      const existingConv = state.conversations.find(conv => conv.contact.id?.toString() === contactId);
      if (!existingConv) {
        // Fetch conversation detail dari backend
        try {
          const conv = await conversationsApi.getById(contactId);
          if (conv) {
            set((state) => ({
              conversations: [conv, ...state.conversations],
            }));
            get().groupConversations();
          }
        } catch (err) {
          console.error('Failed to fetch new conversation:', err);
        }
      } else {
        // Update conversation's last message, unread count, label, contact name, admin incharge, takeover flag
        set((state) => ({
          conversations: state.conversations.map(conv => {
            if (conv.contact.id?.toString() === contactId) {
              // Update last_message
              const lastMsg = {
                id: message.id,
                ticket_id: message.ticket_id,
                contact_id: message.contact_id,
                session_id: message.session_id,
                direction: message.direction,
                message_type: message.message_type,
                content: message.content,
                status: message.status,
                created_at: message.created_at,
                updated_at: message.updated_at,
              };
              // Update unread_count (hanya untuk incoming)
              let unread = conv.unread_count || 0;
              if (message.direction === 'incoming') unread += 1;
              // Update label jika ada perubahan
              let labels = conv.labels;
              if ('labels' in message && Array.isArray((message as any).labels) && (message as any).labels.length) {
                labels = (message as any).labels;
              }
              // Update contact name jika belum ada
              let contact = { ...conv.contact };
              const msgContact = (message as any).contact || conv.contact;
              if ((!contact.name || contact.name === '') && msgContact && msgContact.name && msgContact.name !== '') {
                contact.name = msgContact.name;
              }
              // Update admin incharge dan takeover flag jika ada di message.contact
              let assigned_to = conv.assigned_to;
              if (msgContact && msgContact.assigned_to) {
                assigned_to = msgContact.assigned_to;
              }
              let is_takeover_by_bot = false;
              if (msgContact && typeof msgContact.is_takeover_by_bot !== 'undefined') {
                is_takeover_by_bot = msgContact.is_takeover_by_bot;
              }
              return {
                ...conv,
                last_message: lastMsg,
                unread_count: unread,
                labels,
                contact,
                assigned_to,
                is_takeover_by_bot,
                last_activity: message.created_at,
              };
            }
            return conv;
          }),
        }));
        get().groupConversations();
      }
    },

    handleMessageStatusUpdate: (messageId, status) => {
      get().updateMessage(messageId, { status: status as any });
    },

    handleTypingStart: (ticketId, username) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [ticketId]: [
            ...(state.typingUsers[ticketId] || []).filter(u => u !== username),
            username,
          ],
        },
      }));
    },

    handleTypingStop: (ticketId, username) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [ticketId]: (state.typingUsers[ticketId] || []).filter(u => u !== username),
        },
      }));
    },

    // Search
    searchMessages: async (query) => {
      if (!query.trim()) {
        get().clearSearch();
        return;
      }
      
      try {
        set({ isSearching: true, searchQuery: query });
        
        const results = await messagesApi.search(query);
        
        set({
          searchResults: results as Message[],
          isSearching: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Search failed',
          isSearching: false,
        });
      }
    },

    clearSearch: () => {
      set({
        searchQuery: '',
        searchResults: [],
        isSearching: false,
      });
    },

    // UI actions
    toggleSidebar: () => {
      set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      }));
    },

    setSidebarCollapsed: (collapsed: boolean) => {
      set({ sidebarCollapsed: collapsed });
    },

    toggleRightSidebar: () => {
      set((state) => ({
        rightSidebarVisible: !state.rightSidebarVisible,
      }));
    },

    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    // Quick Reply Templates
    loadQuickReplyTemplates: async () => {
      try {
        const quickReplyTemplates = await quickReplyApi.getAll();
        set({ quickReplyTemplates });
      } catch (error) {
        console.error('Failed to load quick reply templates:', error);
        set({ error: 'Failed to load quick reply templates' });
      }
    },

    createQuickReply: async (data) => {
      try {
        const quickReply = await quickReplyApi.create(data);
        set({ quickReplyTemplates: [...get().quickReplyTemplates, quickReply] });
      } catch (error) {
        console.error('Failed to create quick reply:', error);
        set({ error: 'Failed to create quick reply' });
      }
    },

    updateQuickReply: async (id, data) => {
      try {
        const quickReply = await quickReplyApi.update(id, data);
        set({ quickReplyTemplates: get().quickReplyTemplates.map(qr =>
          qr.id === id ? quickReply : qr
        ) });
      } catch (error) {
        console.error('Failed to update quick reply:', error);
        set({ error: 'Failed to update quick reply' });
      }
    },

    deleteQuickReply: async (id) => {
      try {
        await quickReplyApi.delete(id);
        set({ quickReplyTemplates: get().quickReplyTemplates.filter(qr => qr.id !== id) });
      } catch (error) {
        console.error('Failed to delete quick reply:', error);
        set({ error: 'Failed to delete quick reply' });
      }
    },

    useQuickReply: async (id) => {
      try {
        const quickReply = await quickReplyApi.incrementUsage(id);
        set({ quickReplyTemplates: get().quickReplyTemplates.map(qr =>
          qr.id === id ? quickReply : qr
        ) });
      } catch (error) {
        console.error('Failed to use quick reply:', error);
        set({ error: 'Failed to use quick reply' });
      }
    },

    // Contact Notes
    loadContactNotes: async (contactId) => {
      try {
        const contactNotes = await contactNotesApi.getByContact(contactId);
        set({ contactNotes: { [contactId]: contactNotes } });
      } catch (error) {
        console.error('Failed to load contact notes:', error);
        set({ error: 'Failed to load contact notes' });
      }
    },

    createContactNote: async (contactId, data) => {
      try {
        const contactNote = await contactNotesApi.create({ ...data, contact_id: contactId });
        set({ contactNotes: { ...get().contactNotes, [contactId]: [...(get().contactNotes[contactId] || []), contactNote] } });
      } catch (error) {
        console.error('Failed to create contact note:', error);
        set({ error: 'Failed to create contact note' });
      }
    },

    updateContactNote: async (id, data) => {
      try {
        const contactNote = await contactNotesApi.update(id, data);
        set({ contactNotes: { ...get().contactNotes, [get().activeContactConversation?.contact.id || '']: get().contactNotes[get().activeContactConversation?.contact.id || ''].map(n =>
          n.id === id ? contactNote : n
        ) } });
      } catch (error) {
        console.error('Failed to update contact note:', error);
        set({ error: 'Failed to update contact note' });
      }
    },

    deleteContactNote: async (id) => {
      try {
        await contactNotesApi.delete(id);
        set({ contactNotes: { ...get().contactNotes, [get().activeContactConversation?.contact.id || '']: get().contactNotes[get().activeContactConversation?.contact.id || ''].filter(n => n.id !== id) } });
      } catch (error) {
        console.error('Failed to delete contact note:', error);
        set({ error: 'Failed to delete contact note' });
      }
    },

    // Draft Messages
    loadDraftMessage: async (contactId) => {
      try {
        const draftMessage = await draftMessagesApi.getByContact(contactId);
        set({ draftMessages: { [contactId]: draftMessage } });
      } catch (error) {
        console.error('Failed to load draft message:', error);
        set({ error: 'Failed to load draft message' });
      }
    },

    saveDraftMessage: async (contactId, content) => {
      try {
        const draftMessage = await draftMessagesApi.create({ contact_id: contactId, content });
        set({ draftMessages: { ...get().draftMessages, [contactId]: draftMessage } });
      } catch (error) {
        console.error('Failed to save draft message:', error);
        set({ error: 'Failed to save draft message' });
      }
    },

    deleteDraftMessage: async (contactId) => {
      try {
        await draftMessagesApi.delete(contactId);
        const { [contactId]: deleted, ...remainingDrafts } = get().draftMessages;
        set({ draftMessages: remainingDrafts });
      } catch (error) {
        console.error('Failed to delete draft message:', error);
        set({ error: 'Failed to delete draft message' });
      }
    },

    autoSaveDraft: async (contactId, content) => {
      try {
        const draftMessage = await draftMessagesApi.update(contactId, { content });
        set({ draftMessages: { ...get().draftMessages, [contactId]: draftMessage } });
      } catch (error) {
        console.error('Failed to auto-save draft message:', error);
        set({ error: 'Failed to auto-save draft message' });
      }
    },

    setRightSidebarMode: (mode) => {
      set({ rightSidebarMode: mode });
      if (mode === 'always') set({ rightSidebarVisible: true });
      if (mode === 'never') set({ rightSidebarVisible: false });
    },

    // Helper method to get active ticket from multiple sources
    getActiveTicket: () => {
      const state = get();
      return state.activeTicket || 
             state.activeContactConversation?.currentTicket || 
             state.activeConversation?.active_ticket;
    },
  }))
);

// Helper function to group conversations into categories
function groupConversationsIntoCategories(conversations: Conversation[]): ChatGroups {
  const chatGroups: ChatGroups = {
    needReply: { urgent: [], normal: [], overdue: [] },
    automated: { botHandled: [], autoReply: [], workflow: [] },
    completed: { resolved: [], closed: [], archived: [] },
  };

  const now = new Date();
  
  conversations.forEach((conversation) => {
    const lastActivity = new Date(conversation.last_activity);
    const minutesSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    
    if (conversation.status === 'active' && conversation.unread_count > 0) {
      if (minutesSinceLastActivity > 120) { // 2 hours
        chatGroups.needReply.overdue.push(conversation);
      } else if (minutesSinceLastActivity > 30) { // 30 minutes
        chatGroups.needReply.urgent.push(conversation);
      } else {
        chatGroups.needReply.normal.push(conversation);
      }
    } else if (conversation.status === 'pending') {
      chatGroups.automated.autoReply.push(conversation);
    } else if (conversation.status === 'resolved') {
      chatGroups.completed.resolved.push(conversation);
    } else if (conversation.status === 'archived') {
      chatGroups.completed.archived.push(conversation);
    }
  });

  return chatGroups;
}

// Helper function to get media type from file
function getMediaType(file: File): string {
  const type = file.type.split('/')[0];
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      return 'document';
  }
}

// Helper function to determine ticket category
function getTicketCategory(ticket: any): 'PERLU_DIBALAS' | 'OTOMATIS' | 'SELESAI' {
  if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
    return 'SELESAI';
  }
  
  // Check if ticket has automation labels
  if (ticket.labels && Array.isArray(ticket.labels)) {
    const hasAutoLabel = ticket.labels.some((label: any) => 
      ['OTOMATIS', 'AUTO', 'BOT', 'AUTOMATED'].includes(label.name?.toUpperCase())
    );
    if (hasAutoLabel) {
      return 'OTOMATIS';
    }
  }
  
  // If open and has unread messages, needs reply
  if (ticket.status === 'OPEN' && (ticket.unread_count || 0) > 0) {
    return 'PERLU_DIBALAS';
  }
  
  // Default to needs reply for open tickets
  return 'PERLU_DIBALAS';
}

// Helper function to calculate conversation age
function calculateConversationAge(startDate?: string): string {
  if (!startDate) return 'Baru';
  
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan`;
  
  return `${Math.floor(diffDays / 365)} tahun`;
}

// Setup WebSocket listeners when store is created
console.log('[WS] Chat store loaded');
let ws = getWebSocketManager();
if (!ws) {
  ws = createWebSocketManager();
  console.log('[WS] WebSocketManager auto-created in chat store');
}
if (ws && typeof window !== 'undefined') {
  // Join global room for notifications
  ws.joinRoom('global');
  console.log('[WS] Joined global room for notifications');
  
  if (!window.__wsMessageReceivedHandler) {
    window.__wsMessageReceivedHandler = (data: any) => {
      console.log('[WS] message_received event:', data);
      const message = {
        id: (data.message_id || data.id || Date.now()).toString(),
        ticket_id: (data.ticket_id || (data.ticket && data.ticket.id) || '').toString(),
        contact_id: (data.contact_id || (data.contact && data.contact.id) || '').toString(),
        session_id: data.session_name || 'default',
        wa_message_id: data.wa_message_id || '',
        direction: 'incoming' as 'incoming',
        message_type: data.message_type || 'text',
        content: data.body || data.content || '',
        status: data.status || 'received',
        media_url: data.media_url || '',
        created_at: data.timestamp || new Date().toISOString(),
        updated_at: data.timestamp || new Date().toISOString(),
        read_at: data.read_at || null,
      };
      if (!message.content && message.message_type === 'text') {
        console.warn('[WS] message_received: content kosong!', data);
      }
      // Play notification sound hanya untuk pesan incoming
      if (message.direction === 'incoming') {
        window.playNotificationSound && window.playNotificationSound();
      }
      useChatStore.getState().addMessage(message);
    };
    ws.off('message_received');
    ws.on('message_received', window.__wsMessageReceivedHandler);
    console.log('[WS] message_received handler registered ONCE (named)');
  } else {
    ws.off('message_received', window.__wsMessageReceivedHandler);
    ws.on('message_received', window.__wsMessageReceivedHandler);
    console.log('[WS] message_received handler re-registered (named)');
  }
  ws.on('message_sent', (data) => {
    console.log('[WS] message_sent event:', data);
    useChatStore.getState().handleIncomingMessage(data);
  });
  ws.on('message_status_update', (data) => {
    // message_status_update digunakan untuk delivered/read
    console.log('[WS] message_status_update event:', data);
    if (data.status === 'delivered') {
      useChatStore.getState().updateMessage(data.message_id, { status: 'delivered' });
    } else if (data.status === 'read') {
      useChatStore.getState().updateMessage(data.message_id, { read_at: new Date().toISOString() });
    }
  });
  ws.on('typing_start', (data) => {
    console.log('[WS] typing_start event:', data);
    useChatStore.getState().handleTypingStart(data.ticket_id, data.user_name || data.username);
  });
  ws.on('typing_stop', (data) => {
    console.log('[WS] typing_stop event:', data);
    useChatStore.getState().handleTypingStop(data.ticket_id, data.user_name || data.username);
  });
  ws.on('ticket_created', (data) => {
    console.log('[WS] ticket_created event:', data);
    // Optionally reload conversations or add ticket to state
  });
  ws.on('session_status_update', (data) => {
    console.log('[WS] session_status_update event:', data);
    // Optionally update session status in state
  });
  ws.on('qr_code_update', (data) => {
    console.log('[WS] qr_code_update event:', data);
    // Optionally update QR code state
  });
  ws.on('conversation_updated', (data) => {
    console.log('[WS] conversation_updated event:', data);
    // Update or insert conversation in state
    useChatStore.setState((state) => {
      const idx = state.conversations.findIndex(
        (conv) => conv.id === data.id || conv.contact.id === data.contact_id
      );
      let newConversations;
      if (idx !== -1) {
        // Update existing conversation
        newConversations = [...state.conversations];
        newConversations[idx] = { ...newConversations[idx], ...data };
      } else {
        // Insert new conversation
        newConversations = [data, ...state.conversations];
      }
      return {
        conversations: newConversations,
        // Optionally, update chatGroups if needed
      };
    });
    // Optionally, re-group conversations
    useChatStore.getState().groupConversations();
  });
} else {
  console.warn('[WS] WebSocketManager is null in chat store');
}

// Selectors
export const useChat = () => {
  const {
    conversations,
    chatGroups,
    activeContact,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    markMessagesAsRead,
  } = useChatStore();

  return {
    conversations,
    chatGroups,
    activeContact,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    markMessagesAsRead,
  };
};

export const useActiveChat = () => {
  const activeContact = useChatStore((state) => state.activeContact);
  const activeConversation = useChatStore((state) => state.activeConversation);
  const activeTicket = useChatStore((state) => state.activeTicket);
  const messages = useChatStore((state) => 
    activeTicket ? state.messages[activeTicket.id.toString()] || [] : []
  );
  
  return { activeContact, activeConversation, activeTicket, messages };
};

export const useChatGroups = () => useChatStore((state) => state.chatGroups);
export const useChatSearch = () => useChatStore((state) => ({
  searchQuery: state.searchQuery,
  searchResults: state.searchResults,
  isSearching: state.isSearching,
  searchMessages: state.searchMessages,
  clearSearch: state.clearSearch,
}));

export const useSidebarCollapsed = () => useChatStore((state) => state.sidebarCollapsed);
export const useRightSidebarVisible = () => useChatStore((state) => state.rightSidebarVisible);
export const useToggleSidebar = () => useChatStore((state) => state.toggleSidebar);
export const useSetSidebarCollapsed = () => useChatStore((state) => state.setSidebarCollapsed);
export const useToggleRightSidebar = () => useChatStore((state) => state.toggleRightSidebar);
export const useRightSidebarMode = () => useChatStore((state) => state.rightSidebarMode);
export const useSetRightSidebarMode = () => useChatStore((state) => state.setRightSidebarMode);

export const useChatError = () => useChatStore((state) => ({
  error: state.error,
  setError: state.setError,
  clearError: state.clearError,
}));

// Tambahkan deklarasi global untuk window.__wsMessageReceivedHandler
declare global {
  interface Window {
    __wsMessageReceivedHandler?: (data: any) => void;
    playNotificationSound?: () => void;
  }
}

if (typeof window !== 'undefined' && !window.playNotificationSound) {
  window.playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.wav');
      audio.play();
    } catch (e) {
      console.warn('Failed to play notification sound', e);
    }
  };
}