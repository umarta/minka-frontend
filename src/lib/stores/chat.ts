import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  Contact,
  Message,
  Conversation,
  ChatGroups,
  MessageForm,
  Ticket,
  QuickReplyTemplate,
  ContactNote,
  DraftMessage,
  ConversationGroup,
} from "@/types";
import {
  contactsApi,
  messagesApi,
  ticketsApi,
  quickReplyApi,
  contactNotesApi,
  draftMessagesApi,
  conversationsApi,
  antiBlockingApi,
  labelsApi,
} from "@/lib/api";
import {
  uploadMediaWithProgress,
  uploadWithRetry,
  validateFile,
} from "@/lib/utils/upload";
import { createWebSocketManager, getWebSocketManager } from "@/lib/websocket";
import { shallow } from "zustand/shallow";
import { useAntiBlockingStore } from "./antiBlocking";

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
  category: "PERLU_DIBALAS" | "OTOMATIS" | "SELESAI";
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
  conversationMode: "unified" | "ticket-specific"; // Toggle between views
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

  // Label Management
  labels: any[]; // Available labels
  conversationLabels: Record<string, any[]>; // contactId -> labels
  isLoadingLabels: boolean;

  // Bulk Operations
  bulkOperations: {
    selectedConversations: string[];
    isProcessing: boolean;
  };

  // Response Time Metrics
  responseTimeMetrics: Record<string, number>; // conversationId -> response time

  // UI state
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Upload progress
  uploadProgress: Record<
    string,
    {
      messageId: string;
      fileName: string;
      progress: number;
      status: "uploading" | "complete" | "error";
      error?: string;
    }
  >; // fileId -> upload progress

  // Sidebar state
  sidebarCollapsed: boolean;
  rightSidebarVisible: boolean;
  rightSidebarMode: "auto" | "always" | "never"; // NEW: mode for info panel

  // Search
  searchQuery: string;
  searchResults: Message[];
  isSearching: boolean;

  // Typing indicators
  typingUsers: Record<string, string[]>; // ticketId -> typing usernames

  // Errors
  error: string | null;

  // Group management
  selectedGroup: ConversationGroup;

  // Conversation counts
  conversationCounts: {
    advisor: number;
    ai_agent: number;
    done: number;
  };

  // Pagination state
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  isLoadingMore: boolean;
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
  loadContactMessages: (
    contactId: string,
    page?: number,
    query?: string,
    append?: boolean
  ) => Promise<any>;
  loadTicketEpisodes: (contactId: string) => Promise<void>;
  selectTicketEpisode: (ticketId: string) => void;
  toggleConversationMode: () => void;
  toggleTicketHistory: () => void;

  // Messages
  loadMessages: (
    ticketId: string,
    page?: number,
    forceRefresh?: boolean
  ) => Promise<void>;
  appendMessages: (ticketId: string, page?: number) => Promise<void>;
  refreshMessages: (ticketId: string) => Promise<void>;
  updateSingleMessage: (
    ticketId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  addSingleMessage: (ticketId: string, message: Message) => void;
  sendMessage: (data: MessageForm) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markMessagesAsRead: (contactId: string) => void;

  // Quick Reply Templates
  loadQuickReplyTemplates: () => Promise<void>;
  createQuickReply: (data: {
    title: string;
    content: string;
    category: string;
  }) => Promise<void>;
  updateQuickReply: (
    id: string,
    data: { title?: string; content?: string; category?: string }
  ) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  useQuickReply: (id: string) => Promise<void>;

  // Contact Notes
  loadContactNotes: (contactId: string) => Promise<void>;
  createContactNote: (
    contactId: string,
    data: { content: string; type: "public" | "private" }
  ) => Promise<void>;
  updateContactNote: (
    id: string,
    data: { content?: string; type?: "public" | "private" }
  ) => Promise<void>;
  deleteContactNote: (id: string) => Promise<void>;

  // Draft Messages
  loadDraftMessage: (contactId: string) => Promise<void>;
  saveDraftMessage: (contactId: string, content: string) => Promise<void>;
  deleteDraftMessage: (contactId: string) => Promise<void>;
  autoSaveDraft: (contactId: string, content: string) => Promise<void>;

  // Label Management
  loadLabels: () => Promise<void>;
  createLabel: (data: {
    name: string;
    color: string;
    description?: string;
  }) => Promise<any>;
  updateLabel: (
    id: string,
    data: { name?: string; color?: string; description?: string }
  ) => Promise<any>;
  deleteLabel: (id: string) => Promise<void>;

  // Conversation Label Management
  addLabelsToConversation: (
    conversationId: string,
    labelIds: string[]
  ) => Promise<void>;
  removeLabelsFromConversation: (
    conversationId: string,
    labelIds: string[]
  ) => Promise<void>;

  // Bulk Operations
  selectConversationForBulk: (id: string) => void;
  selectAllConversations: () => void;
  clearBulkSelection: () => void;
  bulkUpdateConversations: (updates: any) => Promise<void>;

  // Response Time Tracking
  loadResponseTimeMetrics: () => Promise<void>;
  trackResponseTime: (conversationId: string, responseTime: number) => void;

  // Real-time updates
  handleIncomingMessage: (message: Message) => void;
  handleMessageStatusUpdate: (messageId: string, status: string) => void;
  handleTypingStart: (ticketId: string, username: string) => void;
  handleTypingStop: (ticketId: string, username: string) => void;

  // Search
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Upload progress
  setUploadProgress: (
    fileId: string,
    progress: {
      messageId: string;
      fileName: string;
      progress: number;
      status: "uploading" | "complete" | "error";
      error?: string;
    }
  ) => void;
  removeUploadProgress: (fileId: string) => void;
  clearUploadProgress: () => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightSidebar: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRightSidebarMode: (mode: "auto" | "always" | "never") => void; // NEW
  getActiveTicket: () => any; // Helper method to get active ticket

  // Group management
  loadConversationsByGroup: (
    group: ConversationGroup,
    page?: number,
    limit?: number
  ) => Promise<void>;
  moveConversationToGroup: (
    conversationId: string,
    group: string
  ) => Promise<void>;
  setSelectedGroup: (group: ConversationGroup) => void;

  // Conversation counts
  loadConversationCounts: () => Promise<void>;

  // Pagination methods
  loadMoreConversations: () => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    chatGroups: {
      // New conversation grouping
      advisor: [],
      ai_agent: [],
      done: [],
      // Legacy grouping (for backward compatibility)
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
    conversationMode: "unified",
    showTicketHistory: false,
    quickReplyTemplates: [],
    isLoadingQuickReplies: false,
    contactNotes: {},
    isLoadingContactNotes: false,
    draftMessages: {},
    isLoadingDraftMessages: false,
    labels: [],
    conversationLabels: {},
    isLoadingLabels: false,
    bulkOperations: {
      selectedConversations: [],
      isProcessing: false,
    },
    responseTimeMetrics: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    uploadProgress: {},
    sidebarCollapsed: false,
    rightSidebarVisible: false,
    rightSidebarMode: "auto", // NEW
    searchQuery: "",
    searchResults: [],
    isSearching: false,
    typingUsers: {},
    error: null,
    selectedGroup: "ai_agent" as ConversationGroup,
    conversationCounts: {
      advisor: 0,
      ai_agent: 0,
      done: 0,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
    isLoadingMore: false,

    // Actions
    loadConversations: async () => {
      // Use paginated loading for better performance
      // await get().loadConversationsWithPagination(1, 20);
    },

    groupConversations: () => {
      const { conversations } = get();
      const chatGroups = groupConversationsIntoCategories(conversations);
      set({ chatGroups });
    },

    selectConversation: async (contact: Contact) => {
      try {
        // Find the conversation for this contact
        const conversation = get().conversations.find(
          (c) => c.contact.id === contact.id
        );

        set({
          activeContact: contact,
          activeConversation: conversation || null,
          selectedContactId: contact.id,
          isLoadingMessages: true,
          error: null,
        });

        // Load contact conversation for info panel
        await get().loadContactConversation(contact.id);

        // Load all messages for this contact using the unified endpoint
        await get().loadContactMessages(contact.id, 1);

        // Join WebSocket room for real-time updates
        const ws = getWebSocketManager();
        if (ws) {
          console.log("[WS] Join contact room:", contact.id);
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
        }

        set({ isLoadingMessages: false });
      } catch (error) {
        console.error("Failed to select conversation:", error);
        set({
          error: "Failed to load conversation details",
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
        conversations: state.conversations.map((conv) =>
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
      try {
        // Load all tickets for this contact (for info panel)
        const tickets = await ticketsApi.getByContact(contactId);

        // Create ticket episodes for info panel
        const episodes: TicketEpisode[] = tickets.map((ticket: any) => ({
          ticket,
          messageCount: ticket.message_count || 0,
          startDate: ticket.created_at,
          endDate:
            ticket.resolved_at ||
            (ticket.status === "CLOSED" ? ticket.updated_at : undefined),
          status: ticket.status,
          category: getTicketCategory(ticket),
          unreadCount: ticket.unread_count || 0,
          lastMessage: ticket.last_message,
        }));

        // Get contact info
        const contact = get().conversations.find(
          (c) => c.contact.id === contactId
        )?.contact;
        if (!contact) throw new Error("Contact not found");

        // Find current active ticket (most recent open)
        const currentTicket =
          tickets.find((t) => t.status === "OPEN") || tickets[0];

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
        console.error("Failed to load contact conversation:", error);
        set({
          error: "Failed to load contact conversation",
        });
      }
    },

    loadContactMessages: async (
      contactId: string,
      page = 1,
      query?: string,
      append = false
    ) => {
      try {
        set({ isLoadingMessages: true, error: null });

        // Use the unified contact messages endpoint with DESC order for reverse pagination
        const response = await messagesApi.getByContact(contactId, {
          page,
          limit: 20,
          query,
          order: "timestamp DESC", // Get newest messages first
        });

        // Handle different response formats
        let messages: Message[] = [];
        if (response.data?.messages) {
          messages = response.data.messages;
        } else if (response.data && Array.isArray(response.data)) {
          messages = response.data;
        } else if (response.data && response.data.data) {
          messages = response.data.data;
        }

        const total =
          response.meta?.total || response.data?.meta?.total || messages.length;

        // Convert backend message format to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || "default",
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as "incoming" | "outgoing",
          message_type: msg.message_type || "text",
          content: msg.content || msg.body || "",
          body: msg.content || msg.body || "",
          status: msg.status?.toLowerCase() || "sent",
          media_url: msg.media_url,
          created_at:
            msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
          sender_name: msg.sender?.username,
        }));

        // For reverse pagination: reverse the messages to show oldest to newest
        const reversedMessages = formattedMessages.reverse();

        set((state) => {
          const existingMessages = state.contactMessages[contactId] || [];
          let newMessages: Message[];

          if (append && page > 1) {
            // Create a more comprehensive unique check for appending older messages
            const existingIds = new Set(
              existingMessages.map((msg) => `${msg.id}-${msg.created_at}`)
            );

            // Filter out any duplicates from new messages
            const uniqueNewMessages = reversedMessages.filter(
              (msg) => !existingIds.has(`${msg.id}-${msg.created_at}`)
            );

            // Append older messages to the beginning (for pagination)
            newMessages = [...uniqueNewMessages, ...existingMessages];
          } else {
            // Replace messages (for initial load or refresh)
            // Also deduplicate in case of any issues
            const uniqueMessages = reversedMessages.reduce(
              (unique: Message[], msg) => {
                const isDuplicate = unique.some(
                  (existing) =>
                    existing.id === msg.id &&
                    existing.created_at === msg.created_at
                );
                if (!isDuplicate) {
                  unique.push(msg);
                }
                return unique;
              },
              []
            );

            newMessages = uniqueMessages;
          }

          return {
            contactMessages: {
              ...state.contactMessages,
              [contactId]: newMessages,
            },
            searchQuery: query || "",
            searchResults: query ? newMessages : [],
            isLoadingMessages: false,
          };
        });

        // Return the response so we can access pagination metadata
        return response;
      } catch (error) {
        console.error("Failed to load contact messages:", error);
        set({
          error: "Failed to load messages",
          isLoadingMessages: false,
        });
        throw error;
      }
    },

    loadOlderMessages: async (contactId: string, page: number) => {
      try {
        set({ isLoadingMessages: true, error: null });

        // Load older messages (higher page number = older messages)
        const response = await messagesApi.getByContact(contactId, {
          page,
          limit: 20,
          order: "timestamp DESC", // Get older messages
        });

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
          session_id: msg.session_id || "default",
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as "incoming" | "outgoing",
          message_type: msg.message_type || "text",
          content: msg.content || msg.body || "",
          body: msg.content || msg.body || "",
          status: msg.status?.toLowerCase() || "sent",
          media_url: msg.media_url,
          created_at:
            msg.timestamp || msg.created_at || new Date().toISOString(),
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
      } catch (error) {
        console.error("Failed to load contact messages:", error);
        set({
          error: "Failed to load messages",
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
          endDate:
            ticket.resolved_at ||
            (ticket.status === "CLOSED" ? ticket.updated_at : undefined),
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
        console.error("Failed to load ticket episodes:", error);
      }
    },

    selectTicketEpisode: (ticketId: string) => {
      // Switch to specific ticket view
      set({ conversationMode: "ticket-specific" });
      get().loadMessages(ticketId);

      // Update active ticket
      const conversation = get().conversations.find(
        (c) => c.active_ticket?.id?.toString() === ticketId
      );
      if (conversation) {
        set({
          activeTicket: conversation.active_ticket,
          activeConversation: conversation,
        });
      }
    },

    toggleConversationMode: () => {
      set((state) => ({
        conversationMode:
          state.conversationMode === "unified" ? "ticket-specific" : "unified",
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
        if (
          !forceRefresh &&
          existingMessages.length > 0 &&
          existingPage === page
        ) {
          set({ isLoadingMessages: false });
          return;
        }

        // Load messages from backend
        const messages = await messagesApi.getByTicket(ticketId, {
          page,
          per_page: 1000,
          order: "created_at ASC",
        });

        // Convert backend messages to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || "default",
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as "incoming" | "outgoing",
          message_type: msg.message_type || "text",
          content: msg.body || msg.content || "",
          body: msg.body || msg.content || "",
          status: msg.status?.toLowerCase() || "sent",
          media_url: msg.media_url,
          created_at:
            msg.timestamp || msg.created_at || new Date().toISOString(),
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
        console.error("Failed to load messages:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to load messages",
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
          order: "created_at ASC",
        });

        // Convert backend messages to frontend format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id?.toString(),
          ticket_id: msg.ticket_id?.toString(),
          contact_id: msg.contact_id?.toString(),
          session_id: msg.session_id || "default",
          wa_message_id: msg.wa_message_id,
          direction: msg.direction?.toLowerCase() as "incoming" | "outgoing",
          message_type: msg.message_type || "text",
          content: msg.body || msg.content || "",
          body: msg.body || msg.content || "",
          status: msg.status?.toLowerCase() || "sent",
          media_url: msg.media_url,
          created_at:
            msg.timestamp || msg.created_at || new Date().toISOString(),
          updated_at: msg.updated_at || new Date().toISOString(),
          read_at: msg.read_at,
        }));

        // Append new messages to existing ones, avoiding duplicates
        const existingIds = new Set(existingMessages.map((msg) => msg.id));
        const newMessages = formattedMessages.filter(
          (msg) => !existingIds.has(msg.id)
        );

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
        console.error("Failed to append messages:", error);
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to append messages",
          isLoadingMessages: false,
        });
      }
    },

    refreshMessages: async (ticketId: string) => {
      return get().loadMessages(ticketId, 1, true);
    },

    updateSingleMessage: (
      ticketId: string,
      messageId: string,
      updates: Partial<Message>
    ) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]:
            state.messages[ticketId]?.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ) || [],
        },
      }));
    },

    addSingleMessage: (ticketId: string, message: Message) => {
      set((state) => {
        const existingMessages = state.messages[ticketId] || [];
        const existingIds = new Set(existingMessages.map((msg) => msg.id));

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

    sendMessage: async (data: MessageForm) => {
      try {
        set({ isSendingMessage: true, error: null });
        const { activeContact } = get();
        let ticketToUse = get().getActiveTicket();

        if (!activeContact) {
          throw new Error("No active contact selected");
        }

        // If no active ticket, try to create one or send without ticket
        if (!ticketToUse) {
          // Option 1: Try to create a ticket automatically
          try {
            const ticketResponse = await ticketsApi.create({
              contact_id: parseInt(activeContact.id),
              session_id: 1, // Default session
              subject: `Chat with ${activeContact.name || activeContact.phone_number}`,
              description: "Auto-created ticket from chat",
              priority: "MEDIUM",
            });

            if (ticketResponse) {
              ticketToUse = ticketResponse;
              // Update active ticket in state
              set({ activeTicket: ticketResponse });
            }
          } catch (ticketError) {
            console.warn(
              "[Chat] Failed to create ticket automatically:",
              ticketError
            );
            // Continue without ticket - will send message without ticket association
          }
        }

        const phoneNumber =
          activeContact.phone ||
          activeContact.phone_number ||
          activeContact.PhoneNumber;
        if (!phoneNumber) {
          throw new Error("Contact phone number is required");
        }

        // Create message object for UI
        const newMessage: Message = {
          id: Date.now().toString(),
          ticket_id: ticketToUse ? ticketToUse.id.toString() : null, // Can be null if no ticket
          contact_id: activeContact.id,
          session_id: data.session_id || "default",
          direction: "outgoing",
          message_type: data.message_type || "text",
          content: data.content,
          status: "pending", // Start with pending status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add message to UI immediately
        get().addMessage(newMessage);

        try {
          let response = null;

          // Handle different message types
          if (
            data.media_file &&
            ["image", "video", "audio", "document"].includes(data.message_type)
          ) {
            // Validate file before upload
            const validation = validateFile(data.media_file, {
              maxSize: 50 * 1024 * 1024, // 50MB
              allowedTypes: ["image/*", "video/*", "audio/*", "application/*"],
            });

            if (!validation.valid) {
              throw new Error(validation.error || "Invalid file");
            }

            // Set a custom property in the upload progress to track status
            // We'll use the standard message status for the message itself

            // Track upload progress (only if not drag and drop)
            const updateProgress = (progress: number) => {
              // Only show progress in MessageInput if it's not from drag & drop
              if (!data.isDragAndDrop) {
                set((state) => ({
                  uploadProgress: {
                    ...state.uploadProgress,
                    [newMessage.id]: {
                      messageId: newMessage.id,
                      fileName: data.media_file?.name || "unknown",
                      progress: progress,
                      status: "uploading",
                    },
                  },
                }));
              }
            };

            // Send media message using presigned URL flow
            response = await messagesApi.sendMedia(
              {
                file: data.media_file,
                contact_id: activeContact.id,
                session_id: data.session_id || "default",
                content: data.content || "",
                message_type: data.message_type,
                reply_to_message_id: data.reply_to_message_id,
                phone_number: activeContact.phone_number, // Pass the phone number we already have
                // Ticket is optional in our system, but backend requires it
                // We'll handle this in the API layer
              },
              updateProgress
            );

            // Update progress to complete (only if not drag and drop)
            if (!data.isDragAndDrop) {
              set((state) => ({
                uploadProgress: {
                  ...state.uploadProgress,
                  [newMessage.id]: {
                    messageId: newMessage.id,
                    fileName: data.media_file?.name || "unknown",
                    progress: 100,
                    status: "complete",
                  },
                },
              }));
            }
          } else {
            // Send text message
            response = await messagesApi.send({
              contact_id: activeContact.id,
              session_id: data.session_id || "default",
              content: data.content,
              message_type: "text",
              to:
                activeContact.wa_id ||
                activeContact.phone_number ||
                activeContact.phone ||
                "",
              reply_to_message_id: data.reply_to_message_id,
              ticket_id: ticketToUse ? ticketToUse.id.toString() : undefined, // Pass ticket ID if available
            });
          }

          // Update message with response data if available
          if (response && response.id) {
            get().updateMessage(newMessage.id, {
              id: response.id.toString(),
              status: response.status || "sent",
              media_url: response.media_url || undefined,
              thumbnail_url: response.thumbnail_url || undefined,
            });
          } else {
            // Update status to sent if no response ID
            get().updateMessage(newMessage.id, { status: "sent" });
          }
        } catch (sendError) {
          console.error("[Chat] Failed to send message:", sendError);

          // Update upload progress to error if it was a media message (only if not drag and drop)
          if (data.media_file && !data.isDragAndDrop) {
            set((state) => ({
              uploadProgress: {
                ...state.uploadProgress,
                [newMessage.id]: {
                  messageId: newMessage.id,
                  fileName: data.media_file?.name || "unknown",
                  progress: 0,
                  status: "error",
                  error:
                    sendError instanceof Error
                      ? sendError.message
                      : "Upload failed",
                },
              },
            }));
          }

          // Update message status to failed
          get().updateMessage(newMessage.id, {
            status: "failed",
          });
          throw new Error("Failed to send message to server");
        }

        // Refresh messages to ensure we have the latest data
        if (activeContact?.id) {
          await get().loadContactMessages(activeContact.id, 1);
        }

        set({ isSendingMessage: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to send message",
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

      // Move conversation to top when new message is added
      set((state) => {
        const existingConvIndex = state.conversations.findIndex(
          (conv) => conv.contact.id?.toString() === contactId
        );

        if (existingConvIndex !== -1) {
          const updatedConversation = {
            ...state.conversations[existingConvIndex],
          };
          const otherConversations = state.conversations.filter(
            (_, i) => i !== existingConvIndex
          );

          return {
            conversations: [updatedConversation, ...otherConversations],
          };
        }

        return state;
      });
    },

    updateMessage: (messageId: string, updates: Partial<Message>) => {
      set((state) => {
        // Update in contact-based messages
        const newContactMessages: Record<string, Message[]> = {};
        Object.entries(state.contactMessages).forEach(
          ([contactId, contactMessages]) => {
            newContactMessages[contactId] = contactMessages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            );
          }
        );

        // Update in ticket-based messages
        const newMessages: Record<string, Message[]> = {};
        Object.entries(state.messages).forEach(([ticketId, ticketMessages]) => {
          newMessages[ticketId] = ticketMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
        });

        return {
          contactMessages: newContactMessages,
          messages: newMessages,
        };
      });
    },

    markMessagesAsRead: async (contactId: string) => {
      try {
        // Mark messages as read in the backend
        await messagesApi.markAsRead(contactId);

        // Update local state - mark all messages for this contact as read
        set((state) => ({
          contactMessages: {
            ...state.contactMessages,
            [contactId]:
              state.contactMessages[contactId]?.map((msg) =>
                msg.direction === "incoming" && !msg.read_at
                  ? { ...msg, read_at: new Date().toISOString() }
                  : msg
              ) || [],
          },
          conversations: state.conversations.map((conv) =>
            conv.contact.id?.toString() === contactId
              ? { ...conv, unread_count: 0 }
              : conv
          ),
        }));

        // Re-group conversations
        get().groupConversations();
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    },

    // Real-time handlers
    handleIncomingMessage: async (message) => {
      console.log("[WS] handleIncomingMessage called:", message);
      get().addMessage(message);

      const contactId = message.contact_id;
      const state = get();
      const { selectedGroup } = state;
      const existingConv = state.conversations.find(
        (conv) => conv.contact.id?.toString() === contactId
      );

      if (!existingConv) {
        // Fetch conversation detail dari backend
        try {
          const conv = await conversationsApi.getById(contactId);
          if (conv) {
            if (conv.conversation_group === selectedGroup) {
              set((state) => ({
                conversations: [conv, ...state.conversations],
              }));
            }

            // Always update counts regardless of current group
            get().loadConversationCounts();
          }
        } catch (err) {
          console.error("Failed to fetch new conversation:", err);
        }
      } else {
        // Update existing conversation
        set((state) => {
          let updatedConversation = null;
          const otherConversations = state.conversations.filter((conv) => {
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
              if (message.direction === "incoming") unread += 1;
              // Update label jika ada perubahan
              let labels = conv.labels;
              if (
                "labels" in message &&
                Array.isArray((message as any).labels) &&
                (message as any).labels.length
              ) {
                labels = (message as any).labels;
              }
              // Update contact name jika belum ada
              let contact = { ...conv.contact };
              const msgContact = (message as any).contact || conv.contact;
              if (
                (!contact.name || contact.name === "") &&
                msgContact &&
                msgContact.name &&
                msgContact.name !== ""
              ) {
                contact.name = msgContact.name;
              }
              // Update admin incharge dan takeover flag jika ada di message.contact
              let assigned_to = conv.assigned_to;
              if (msgContact && msgContact.assigned_to) {
                assigned_to = msgContact.assigned_to;
              }
              let is_takeover_by_bot = false;
              if (
                msgContact &&
                typeof msgContact.is_takeover_by_bot !== "undefined"
              ) {
                is_takeover_by_bot = msgContact.is_takeover_by_bot;
              }

              // Check if conversation group changed
              let conversation_group = conv.conversation_group;
              const msgContactAny = msgContact as any;
              if (msgContactAny && msgContactAny.conversation_group) {
                conversation_group = msgContactAny.conversation_group;
              }

              updatedConversation = {
                ...conv,
                last_message: lastMsg,
                unread_count: unread,
                labels,
                contact,
                assigned_to,
                is_takeover_by_bot,
                conversation_group,
                last_activity: message.created_at,
              };

              // Remove from current view if group changed
              return conversation_group === selectedGroup;
            }
            return true; // Keep other conversations
          });

          // Place updated conversation at the top if it belongs to current group
          const finalConversations =
            updatedConversation &&
            (updatedConversation as any).conversation_group === selectedGroup
              ? [updatedConversation, ...otherConversations]
              : otherConversations;

          return {
            conversations: finalConversations,
          };
        });

        // Always update counts
        get().loadConversationCounts();
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
            ...(state.typingUsers[ticketId] || []).filter(
              (u) => u !== username
            ),
            username,
          ],
        },
      }));
    },

    handleTypingStop: (ticketId, username) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [ticketId]: (state.typingUsers[ticketId] || []).filter(
            (u) => u !== username
          ),
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
          error: error instanceof Error ? error.message : "Search failed",
          isSearching: false,
        });
      }
    },

    clearSearch: () => {
      set({
        searchQuery: "",
        searchResults: [],
        isSearching: false,
      });
    },

    // Upload progress actions
    setUploadProgress: (fileId: string, progress) => {
      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileId]: progress,
        },
      }));
    },

    removeUploadProgress: (fileId: string) => {
      set((state) => {
        const { [fileId]: removed, ...rest } = state.uploadProgress;
        return { uploadProgress: rest };
      });
    },

    clearUploadProgress: () => {
      set({ uploadProgress: {} });
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
      set({ isLoadingQuickReplies: true, error: null });
      try {
        const quickReplyTemplates = await quickReplyApi.getAll();
        set({ quickReplyTemplates, isLoadingQuickReplies: false });
      } catch (error) {
        console.error("Failed to load quick reply templates:", error);
        set({
          error: "Failed to load quick reply templates",
          isLoadingQuickReplies: false,
        });
      }
    },

    createQuickReply: async (data) => {
      try {
        const quickReply = await quickReplyApi.create(data);
        set({
          quickReplyTemplates: [...get().quickReplyTemplates, quickReply],
        });
      } catch (error) {
        console.error("Failed to create quick reply:", error);
        set({ error: "Failed to create quick reply" });
      }
    },

    updateQuickReply: async (id, data) => {
      try {
        const quickReply = await quickReplyApi.update(id, data);
        set({
          quickReplyTemplates: get().quickReplyTemplates.map((qr) =>
            qr.id === id ? quickReply : qr
          ),
        });
      } catch (error) {
        console.error("Failed to update quick reply:", error);
        set({ error: "Failed to update quick reply" });
      }
    },

    deleteQuickReply: async (id) => {
      try {
        await quickReplyApi.delete(id);
        set({
          quickReplyTemplates: get().quickReplyTemplates.filter(
            (qr) => qr.id !== id
          ),
        });
      } catch (error) {
        console.error("Failed to delete quick reply:", error);
        set({ error: "Failed to delete quick reply" });
      }
    },

    useQuickReply: async (id) => {
      try {
        const quickReply = await quickReplyApi.incrementUsage(id);
        set({
          quickReplyTemplates: get().quickReplyTemplates.map((qr) =>
            qr.id === id ? quickReply : qr
          ),
        });
      } catch (error) {
        console.error("Failed to use quick reply:", error);
        set({ error: "Failed to use quick reply" });
      }
    },

    // Contact Notes
    loadContactNotes: async (contactId) => {
      try {
        const contactNotes = await contactNotesApi.getByContact(contactId);
        set({ contactNotes: { [contactId]: contactNotes } });
      } catch (error) {
        console.error("Failed to load contact notes:", error);
        set({ error: "Failed to load contact notes" });
      }
    },

    createContactNote: async (contactId, data) => {
      try {
        const contactNote = await contactNotesApi.create({
          ...data,
          contact_id: contactId,
        });
        set({
          contactNotes: {
            ...get().contactNotes,
            [contactId]: [
              ...(get().contactNotes[contactId] || []),
              contactNote,
            ],
          },
        });
      } catch (error) {
        console.error("Failed to create contact note:", error);
        set({ error: "Failed to create contact note" });
      }
    },

    updateContactNote: async (id, data) => {
      try {
        const contactNote = await contactNotesApi.update(id, data);
        set({
          contactNotes: {
            ...get().contactNotes,
            [get().activeContactConversation?.contact.id || ""]:
              get().contactNotes[
                get().activeContactConversation?.contact.id || ""
              ].map((n) => (n.id === id ? contactNote : n)),
          },
        });
      } catch (error) {
        console.error("Failed to update contact note:", error);
        set({ error: "Failed to update contact note" });
      }
    },

    deleteContactNote: async (id) => {
      try {
        await contactNotesApi.delete(id);
        set({
          contactNotes: {
            ...get().contactNotes,
            [get().activeContactConversation?.contact.id || ""]:
              get().contactNotes[
                get().activeContactConversation?.contact.id || ""
              ].filter((n) => n.id !== id),
          },
        });
      } catch (error) {
        console.error("Failed to delete contact note:", error);
        set({ error: "Failed to delete contact note" });
      }
    },

    // Draft Messages
    loadDraftMessage: async (contactId) => {
      try {
        const draftMessage = await draftMessagesApi.getByContact(contactId);
        set({ draftMessages: { [contactId]: draftMessage } });
      } catch (error) {
        console.error("Failed to load draft message:", error);
        set({ error: "Failed to load draft message" });
      }
    },

    saveDraftMessage: async (contactId, content) => {
      try {
        const draftMessage = await draftMessagesApi.create({
          contact_id: contactId,
          content,
        });
        set({
          draftMessages: { ...get().draftMessages, [contactId]: draftMessage },
        });
      } catch (error) {
        console.error("Failed to save draft message:", error);
        set({ error: "Failed to save draft message" });
      }
    },

    deleteDraftMessage: async (contactId) => {
      try {
        await draftMessagesApi.delete(contactId);
        const { [contactId]: deleted, ...remainingDrafts } =
          get().draftMessages;
        set({ draftMessages: remainingDrafts });
      } catch (error) {
        console.error("Failed to delete draft message:", error);
        set({ error: "Failed to delete draft message" });
      }
    },

    autoSaveDraft: async (contactId, content) => {
      try {
        const draftMessage = await draftMessagesApi.update(contactId, {
          content,
        });
        set({
          draftMessages: { ...get().draftMessages, [contactId]: draftMessage },
        });
      } catch (error) {
        console.error("Failed to auto-save draft message:", error);
        set({ error: "Failed to auto-save draft message" });
      }
    },

    // Label Management
    loadLabels: async () => {
      set({ isLoadingLabels: true, error: null });
      try {
        const labels = await labelsApi.getAll();
        set({ labels, isLoadingLabels: false });
      } catch (error) {
        console.error("Failed to load labels:", error);
        set({ error: "Failed to load labels", isLoadingLabels: false });
      }
    },

    createLabel: async (data) => {
      try {
        const newLabel = await labelsApi.create(data);
        set({ labels: [...get().labels, newLabel] });
        return newLabel;
      } catch (error) {
        console.error("Failed to create label:", error);
        set({ error: "Failed to create label" });
        throw error;
      }
    },

    updateLabel: async (id, data) => {
      try {
        const updatedLabel = await labelsApi.update(id, data);
        set({
          labels: get().labels.map((label) =>
            label.id === id ? updatedLabel : label
          ),
        });
        return updatedLabel;
      } catch (error) {
        console.error("Failed to update label:", error);
        set({ error: "Failed to update label" });
        throw error;
      }
    },

    deleteLabel: async (id) => {
      try {
        await labelsApi.delete(id);
        set({ labels: get().labels.filter((label) => label.id !== id) });
      } catch (error) {
        console.error("Failed to delete label:", error);
        set({ error: "Failed to delete label" });
      }
    },

    // Conversation Label Management
    addLabelsToConversation: async (conversationId, labelIds) => {
      try {
        const res = await conversationsApi.addLabels(conversationId, labelIds);

        if (res && res.labels !== undefined) {
          set({
            conversationLabels: {
              ...get().conversationLabels,
              [conversationId]: res.labels || [],
            },
          });
        } else {
          const labels = get().labels.filter((label) =>
            labelIds.includes(label.id)
          );
          set({
            conversationLabels: {
              ...get().conversationLabels,
              [conversationId]: labels,
            },
          });
        }

        if (res && res.labels !== undefined) {
          set((state) => ({
            conversations: state.conversations.map((conv) => {
              const matchesConversationId =
                conv.id?.toString() === conversationId.toString();
              const matchesContactId =
                conv.contact?.id?.toString() === conversationId.toString();

              if (matchesConversationId || matchesContactId) {
                return {
                  ...conv,
                  labels: res.labels || [],
                };
              }
              return conv;
            }),
          }));
        }
      } catch (error) {
        console.error("Failed to add labels to conversation:", error);
        set({ error: "Failed to add labels to conversation" });
      }
    },

    removeLabelsFromConversation: async (conversationId, labelIds) => {
      try {
        const res = await conversationsApi.removeLabels(
          conversationId,
          labelIds
        );

        // Update conversationLabels based on response
        if (res && res.labels !== undefined) {
          set({
            conversationLabels: {
              ...get().conversationLabels,
              [conversationId]: res.labels || [], // Use response labels directly
            },
          });
        } else {
          // Fallback: filter existing labels if no response labels
          const currentLabels = get().conversationLabels[conversationId] || [];
          const updatedLabels = currentLabels.filter(
            (label) => !labelIds.includes(label.id)
          );
          set({
            conversationLabels: {
              ...get().conversationLabels,
              [conversationId]: updatedLabels,
            },
          });
        }

        // Update conversations state - always use response labels
        if (res && res.labels !== undefined) {
          set((state) => ({
            conversations: state.conversations.map((conv) => {
              const matchesConversationId =
                conv.id?.toString() === conversationId.toString();
              const matchesContactId =
                conv.contact?.id?.toString() === conversationId.toString();

              if (matchesConversationId || matchesContactId) {
                return {
                  ...conv,
                  labels: res.labels || [], // Use response labels or empty array if null
                };
              }
              return conv;
            }),
          }));
        }
      } catch (error) {
        console.error("Failed to remove labels from conversation:", error);
        set({ error: "Failed to remove labels from conversation" });
      }
    },

    // Bulk Operations
    selectConversationForBulk: (id) => {
      const { selectedConversations } = get().bulkOperations;
      const isSelected = selectedConversations.includes(id);

      set({
        bulkOperations: {
          ...get().bulkOperations,
          selectedConversations: isSelected
            ? selectedConversations.filter((convId) => convId !== id)
            : [...selectedConversations, id],
        },
      });
    },

    selectAllConversations: () => {
      const allConversationIds = get().conversations.map((conv) => conv.id);
      set({
        bulkOperations: {
          ...get().bulkOperations,
          selectedConversations: allConversationIds,
        },
      });
    },

    clearBulkSelection: () => {
      set({
        bulkOperations: {
          ...get().bulkOperations,
          selectedConversations: [],
        },
      });
    },

    bulkUpdateConversations: async (updates) => {
      const { selectedConversations } = get().bulkOperations;
      if (selectedConversations.length === 0) return;

      set({ bulkOperations: { ...get().bulkOperations, isProcessing: true } });

      try {
        await conversationsApi.bulkUpdate(selectedConversations, updates);

        // Update local state based on the updates
        if (updates.status) {
          set({
            conversations: get().conversations.map((conv) =>
              selectedConversations.includes(conv.id)
                ? { ...conv, status: updates.status }
                : conv
            ),
          });
        }

        // Clear selection after successful update
        get().clearBulkSelection();

        // Re-group conversations
        get().groupConversations();
      } catch (error) {
        console.error("Failed to bulk update conversations:", error);
        set({ error: "Failed to bulk update conversations" });
      } finally {
        set({
          bulkOperations: { ...get().bulkOperations, isProcessing: false },
        });
      }
    },

    // Response Time Tracking
    loadResponseTimeMetrics: async () => {
      try {
        // This would typically load from an analytics endpoint
        // For now, we'll use placeholder data
        const metrics = {}; // await analyticsApi.getResponseTimeMetrics();
        set({ responseTimeMetrics: metrics });
      } catch (error) {
        console.error("Failed to load response time metrics:", error);
        set({ error: "Failed to load response time metrics" });
      }
    },

    trackResponseTime: (conversationId, responseTime) => {
      set({
        responseTimeMetrics: {
          ...get().responseTimeMetrics,
          [conversationId]: responseTime,
        },
      });
    },

    setRightSidebarMode: (mode) => {
      set({ rightSidebarMode: mode });
      if (mode === "always") set({ rightSidebarVisible: true });
      if (mode === "never") set({ rightSidebarVisible: false });
    },

    // Helper method to get active ticket from multiple sources
    getActiveTicket: () => {
      const state = get();
      return (
        state.activeTicket ||
        state.activeContactConversation?.currentTicket ||
        state.activeConversation?.active_ticket
      );
    },

    // === Group management ===
    loadConversationsByGroup: async (group, page = 1, limit = 20) => {
      // Only show loading for initial load (page 1), not for load more
      if (page === 1) {
        set({ isLoadingConversations: true, error: null });
      }

      try {
        const {
          conversations,
          total,
          page: responsePage,
          limit: responseLimit,
          hasNext,
        } = await conversationsApi.getByGroup(group, page, limit);

        // Smart data management: only replace on page 1, append for load more
        const currentConversations = get().conversations;
        let newConversations: Conversation[];

        if (page === 1) {
          // Initial load: replace all data
          newConversations = conversations;
        } else {
          // Load more: append new data to existing
          newConversations = [...currentConversations, ...conversations];
        }

        set({
          conversations: newConversations,
          pagination: {
            page: responsePage,
            limit: responseLimit,
            total,
            hasMore: hasNext,
          },
          isLoadingConversations: false,
          error: null,
        });

        // Optionally, re-group if needed
        get().groupConversations();
      } catch (error) {
        console.error("❌ Error loading conversations by group:", error);
        set({
          conversations: [],
          error: "Failed to load conversations by group",
          isLoadingConversations: false,
        });
      }
    },
    moveConversationToGroup: async (conversationId, group) => {
      try {
        await conversationsApi.moveToGroup(conversationId, group);

        const { selectedGroup } = get();

        // Remove conversation from current state immediately to reflect the change
        set((state) => ({
          conversations: state.conversations.filter(
            (conv) => conv.id !== conversationId
          ),
        }));

        // Reload current group and target group
        await get().loadConversationsByGroup(selectedGroup);
        await get().loadConversationsByGroup(group as ConversationGroup);
        await get().loadConversationCounts();
      } catch (error) {
        set({ error: "Failed to move conversation to group" });
        throw error;
      }
    },
    setSelectedGroup: (group) => {
      set({ selectedGroup: group });
    },

    // Conversation counts
    loadConversationCounts: async () => {
      try {
        const counts = await conversationsApi.getCounts();
        set({ conversationCounts: counts });
      } catch (error) {
        console.error("Failed to load conversation counts:", error);
        set({
          conversationCounts: { advisor: 0, ai_agent: 0, done: 0 },
          error: "Failed to load conversation counts",
        });
      }
    },

    // Pagination methods

    loadMoreConversations: async () => {
      const { pagination, isLoadingMore, selectedGroup, conversations } = get();
      if (isLoadingMore || !pagination.hasMore) return;

      set({ isLoadingMore: true });
      try {
        // Load only new data without affecting existing data
        await get().loadConversationsByGroup(
          selectedGroup,
          pagination.page + 1,
          pagination.limit
        );
      } finally {
        set({ isLoadingMore: false });
      }
    },
  }))
);

// Helper function to group conversations into categories
function groupConversationsIntoCategories(
  conversations: Conversation[]
): ChatGroups {
  const chatGroups: ChatGroups = {
    // New conversation grouping
    advisor: [],
    ai_agent: [],
    done: [],
    // Legacy grouping (for backward compatibility)
    needReply: { urgent: [], normal: [], overdue: [] },
    automated: { botHandled: [], autoReply: [], workflow: [] },
    completed: { resolved: [], closed: [], archived: [] },
  };

  const now = new Date();

  conversations.forEach((conversation) => {
    // New grouping logic based on conversation_group field
    if (conversation.conversation_group) {
      switch (conversation.conversation_group) {
        case "advisor":
          chatGroups.advisor.push(conversation);
          break;
        case "ai_agent":
          chatGroups.ai_agent.push(conversation);
          break;
        case "done":
          chatGroups.done.push(conversation);
          break;
        default:
          chatGroups.ai_agent.push(conversation); // Default to AI Agent
      }
    } else {
      // Fallback to legacy grouping if conversation_group is not set
      // Also add to new grouping based on status
      if (
        conversation.status === "closed" ||
        conversation.status === "resolved"
      ) {
        chatGroups.done.push(conversation);
      } else {
        chatGroups.ai_agent.push(conversation); // Default to AI Agent
      }

      // Legacy grouping logic
      const lastActivity = new Date(conversation.last_activity);
      const minutesSinceLastActivity =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60);

      if (conversation.status === "active" && conversation.unread_count > 0) {
        if (minutesSinceLastActivity > 120) {
          // 2 hours
          chatGroups.needReply.overdue.push(conversation);
        } else if (minutesSinceLastActivity > 30) {
          // 30 minutes
          chatGroups.needReply.urgent.push(conversation);
        } else {
          chatGroups.needReply.normal.push(conversation);
        }
      } else if (conversation.status === "pending") {
        chatGroups.automated.autoReply.push(conversation);
      } else if (conversation.status === "resolved") {
        chatGroups.completed.resolved.push(conversation);
      } else if (conversation.status === "closed") {
        chatGroups.completed.closed.push(conversation);
      }
    }
  });

  return chatGroups;
}

// Helper function to get media type from file
function getMediaType(file: File): string {
  const type = file.type.split("/")[0];
  switch (type) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    default:
      return "document";
  }
}

// Helper function to determine ticket category
function getTicketCategory(
  ticket: any
): "PERLU_DIBALAS" | "OTOMATIS" | "SELESAI" {
  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    return "SELESAI";
  }

  // Check if ticket has automation labels
  if (ticket.labels && Array.isArray(ticket.labels)) {
    const hasAutoLabel = ticket.labels.some((label: any) =>
      ["OTOMATIS", "AUTO", "BOT", "AUTOMATED"].includes(
        label.name?.toUpperCase()
      )
    );
    if (hasAutoLabel) {
      return "OTOMATIS";
    }
  }

  // If open and has unread messages, needs reply
  if (ticket.status === "OPEN" && (ticket.unread_count || 0) > 0) {
    return "PERLU_DIBALAS";
  }

  // Default to needs reply for open tickets
  return "PERLU_DIBALAS";
}

// Helper function to calculate conversation age
function calculateConversationAge(startDate?: string): string {
  if (!startDate) return "Baru";

  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan`;

  return `${Math.floor(diffDays / 365)} tahun`;
}

// Setup WebSocket listeners when store is created
console.log("[WS] Chat store loaded");
let ws = getWebSocketManager();
if (!ws) {
  ws = createWebSocketManager();
  console.log("[WS] WebSocketManager auto-created in chat store");
}
if (ws && typeof window !== "undefined") {
  // Join global room for notifications
  ws.joinRoom("global");
  console.log("[WS] Joined global room for notifications");

  if (!window.__wsMessageReceivedHandler) {
    window.__wsMessageReceivedHandler = (data: any) => {
      console.log("[WS] message_received event:", data);

      // Get current state to check selectedGroup
      const currentState = useChatStore.getState();
      const currentTab = currentState.selectedGroup;

      // Check if the data.tab matches current tab (if tab is provided)
      if (data.tab && data.tab !== currentTab) {
        console.log(
          `[WS] Ignoring message_received for tab ${data.tab}, current tab is ${currentTab}`
        );
        return;
      }

      console.log(
        `[WS] Processing message_received for matching tab: ${data.tab || "no tab specified"}`
      );

      const message = {
        id: (data.message_id || data.id || Date.now()).toString(),
        ticket_id: (
          data.ticket_id ||
          (data.ticket && data.ticket.id) ||
          ""
        ).toString(),
        contact_id: (
          data.contact_id ||
          (data.contact && data.contact.id) ||
          ""
        ).toString(),
        session_id: data.session_name || "default",
        wa_message_id: data.wa_message_id || "",
        direction: data.direction,
        message_type: data.message_type || "text",
        content: data.body || data.content || "",
        status: data.status || "received",
        media_url: data.media_url || "",
        created_at: data.timestamp || new Date().toISOString(),
        updated_at: data.timestamp || new Date().toISOString(),
        read_at: data.read_at || null,
      };
      if (!message.content && message.message_type === "text") {
        console.warn("[WS] message_received: content kosong!", data);
      }
      // Play notification sound hanya untuk pesan incoming
      if (message.direction === "incoming") {
        window.playNotificationSound && window.playNotificationSound();
      }
      useChatStore.getState().addMessage(message);
    };
    ws.off("message_received");
    ws.on("message_received", window.__wsMessageReceivedHandler);
    console.log("[WS] message_received handler registered ONCE (named)");
  } else {
    ws.off("message_received", window.__wsMessageReceivedHandler);
    ws.on("message_received", window.__wsMessageReceivedHandler);
    console.log("[WS] message_received handler re-registered (named)");
  }
  ws.on("message_sent", (data) => {
    console.log("[WS] message_sent event:", data);
    useChatStore.getState().handleIncomingMessage(data);
  });
  ws.on("message_status_update", (data) => {
    // message_status_update digunakan untuk delivered/read
    console.log("[WS] message_status_update event:", data);
    if (data.status === "delivered") {
      useChatStore
        .getState()
        .updateMessage(data.message_id, { status: "delivered" });
    } else if (data.status === "read") {
      useChatStore
        .getState()
        .updateMessage(data.message_id, { read_at: new Date().toISOString() });
    }
  });
  ws.on("typing_start", (data) => {
    console.log("[WS] typing_start event:", data);
    useChatStore
      .getState()
      .handleTypingStart(data.ticket_id, data.user_name || data.username);
  });
  ws.on("typing_stop", (data) => {
    console.log("[WS] typing_stop event:", data);
    useChatStore
      .getState()
      .handleTypingStop(data.ticket_id, data.user_name || data.username);
  });
  ws.on("ticket_created", (data) => {
    console.log("[WS] ticket_created event:", data);
    // Optionally reload conversations or add ticket to state
  });
  ws.on("session_status_update", (data) => {
    console.log("[WS] session_status_update event:", data);
    // Optionally update session status in state
  });
  ws.on("qr_code_update", (data) => {
    console.log("[WS] qr_code_update event:", data);
    // Optionally update QR code state
  });
  ws.on("conversation_updated", (data) => {
    console.log("[WS] conversation_updated event:", data);

    // Get current state to check selectedGroup
    const currentState = useChatStore.getState();
    const currentTab = currentState.selectedGroup;

    // Check if the data.tab matches current tab
    if (data.tab !== currentTab) {
      console.log(
        `[WS] Ignoring conversation_updated for tab ${data.tab}, current tab is ${currentTab}`
      );
      return;
    }

    console.log(
      `[WS] Processing conversation_updated for matching tab: ${data.tab}`
    );

    // Update or insert conversation in state and move to top
    useChatStore.setState((state) => {
      const idx = state.conversations.findIndex(
        (conv) => conv.id === data.id || conv.contact.id === data.contact_id
      );
      let newConversations;
      if (idx !== -1) {
        // Update existing conversation and move to top
        const updatedConversation = { ...state.conversations[idx], ...data };
        const otherConversations = state.conversations.filter(
          (_, i) => i !== idx
        );
        newConversations = [updatedConversation, ...otherConversations];
      } else {
        // Insert new conversation at top
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

  // Label management events
  ws.on("label_created", (data) => {
    console.log("[WS] label_created event:", data);
    useChatStore.setState((state) => ({
      labels: [...state.labels, data],
    }));
  });

  ws.on("label_updated", (data) => {
    console.log("[WS] label_updated event:", data);
    useChatStore.setState((state) => ({
      labels: state.labels.map((label) =>
        label.id === data.id ? { ...label, ...data } : label
      ),
    }));
  });

  ws.on("label_deleted", (data) => {
    console.log("[WS] label_deleted event:", data);
    useChatStore.setState((state) => ({
      labels: state.labels.filter((label) => label.id !== data.id),
    }));
  });

  ws.on("conversation_labels_updated", (data) => {
    console.log("[WS] conversation_labels_updated event:", data);
    useChatStore.setState((state) => ({
      conversationLabels: {
        ...state.conversationLabels,
        [data.conversation_id]: data.labels,
      },
    }));
  });

  // Status update events
  ws.on("conversation_status_updated", (data) => {
    console.log("[WS] conversation_status_updated event:", data);
    useChatStore.setState((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === data.conversation_id
          ? { ...conv, status: data.status }
          : conv
      ),
    }));
    // Re-group conversations after status change
    useChatStore.getState().groupConversations();
  });

  // Bulk operation events
  ws.on("bulk_operation_completed", (data) => {
    console.log("[WS] bulk_operation_completed event:", data);
    // Reload conversations to reflect bulk changes
    useChatStore.getState().loadConversations();
  });

  // Response time tracking events
  ws.on("response_time_tracked", (data) => {
    console.log("[WS] response_time_tracked event:", data);
    useChatStore.setState((state) => ({
      responseTimeMetrics: {
        ...state.responseTimeMetrics,
        [data.conversation_id]: data.response_time,
      },
    }));
  });
} else {
  console.warn("[WS] WebSocketManager is null in chat store");
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
export const useChatSearch = () =>
  useChatStore((state) => ({
    searchQuery: state.searchQuery,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    searchMessages: state.searchMessages,
    clearSearch: state.clearSearch,
  }));

export const useSidebarCollapsed = () =>
  useChatStore((state) => state.sidebarCollapsed);
export const useRightSidebarVisible = () =>
  useChatStore((state) => state.rightSidebarVisible);
export const useToggleSidebar = () =>
  useChatStore((state) => state.toggleSidebar);
export const useSetSidebarCollapsed = () =>
  useChatStore((state) => state.setSidebarCollapsed);
export const useToggleRightSidebar = () =>
  useChatStore((state) => state.toggleRightSidebar);
export const useRightSidebarMode = () =>
  useChatStore((state) => state.rightSidebarMode);
export const useSetRightSidebarMode = () =>
  useChatStore((state) => state.setRightSidebarMode);

export const useChatError = () =>
  useChatStore((state) => ({
    error: state.error,
    setError: state.setError,
    clearError: state.clearError,
  }));

export const useUploadProgress = () =>
  useChatStore((state) => ({
    uploadProgress: state.uploadProgress,
    setUploadProgress: state.setUploadProgress,
    removeUploadProgress: state.removeUploadProgress,
    clearUploadProgress: state.clearUploadProgress,
  }));

// Tambahkan deklarasi global untuk window.__wsMessageReceivedHandler
declare global {
  interface Window {
    __wsMessageReceivedHandler?: (data: any) => void;
    playNotificationSound?: () => void;
  }
}

if (typeof window !== "undefined" && !window.playNotificationSound) {
  window.playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.wav");
      audio.play();
    } catch (e) {
      console.warn("Failed to play notification sound", e);
    }
  };
}
