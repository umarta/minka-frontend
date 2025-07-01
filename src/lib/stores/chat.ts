import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Contact, Message, Conversation, ChatGroups, MessageForm, Ticket } from '@/types';
import { contactsApi, messagesApi, ticketsApi } from '@/lib/api';
import { getWebSocketManager } from '@/lib/websocket';

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
  
  // UI state
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  rightSidebarVisible: boolean;
  
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
  loadContactMessages: (contactId: string, page?: number) => Promise<void>;
  loadTicketEpisodes: (contactId: string) => Promise<void>;
  selectTicketEpisode: (ticketId: string) => void;
  toggleConversationMode: () => void;
  toggleTicketHistory: () => void;
  
  // Messages
  loadMessages: (ticketId: string, page?: number) => Promise<void>;
  sendMessage: (data: MessageForm) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markMessagesAsRead: (ticketId: string) => void;
  
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
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    sidebarCollapsed: false,
    rightSidebarVisible: false,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    typingUsers: {},
    error: null,

    // Actions
    loadConversations: async () => {
      set({ isLoadingConversations: true, error: null });
      try {
        // Load tickets from backend - these represent our conversations
        const response = await ticketsApi.getAll({
          page: 1,
          per_page: 100,
          include: 'contact,messages,assignedAdmin',
          status: 'OPEN,IN_PROGRESS,RESOLVED'
        });

        const tickets = response.data || [];
        
        // Convert tickets to conversations format
        const conversations: Conversation[] = tickets.map((ticket: any) => ({
          id: ticket.id.toString(),
          contact: {
            id: ticket.contact?.id?.toString() || ticket.contact_id?.toString(),
            name: ticket.contact?.name || ticket.contact?.phone || 'Unknown Contact',
            phone: ticket.contact?.phone || '',
            avatar_url: ticket.contact?.avatar_url || '',
            wa_id: ticket.contact?.wa_id || ticket.contact?.phone || '',
            labels: ticket.contact?.labels || [],
            is_blocked: ticket.contact?.is_blocked || false,
            last_seen: ticket.contact?.last_seen || new Date().toISOString(),
            created_at: ticket.contact?.created_at || new Date().toISOString(),
            updated_at: ticket.contact?.updated_at || new Date().toISOString(),
          },
          ticket_id: ticket.id,
          last_message: ticket.messages?.[0] ? {
            id: ticket.messages[0].id?.toString(),
            content: ticket.messages[0].body || ticket.messages[0].content || '',
            direction: ticket.messages[0].direction?.toLowerCase() as 'incoming' | 'outgoing',
            created_at: ticket.messages[0].created_at || new Date().toISOString(),
          } : null,
          last_activity: ticket.updated_at || new Date().toISOString(),
          unread_count: ticket.unread_count || 0,
          status: ticket.status?.toLowerCase() || 'active',
          priority: ticket.priority?.toLowerCase() || 'normal',
          assigned_admin: ticket.assigned_admin ? {
            id: ticket.assigned_admin.id?.toString(),
            name: ticket.assigned_admin.name,
            email: ticket.assigned_admin.email,
          } : null,
        }));

        // Group conversations
        const chatGroups = groupConversationsIntoCategories(conversations);

        set({ 
          conversations,
          chatGroups,
          isLoadingConversations: false,
          error: null 
        });
      } catch (error) {
        console.error('Failed to load conversations:', error);
        set({ 
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
        });
        
        // If we have a conversation with a ticket, load messages
        if (conversation?.ticket_id) {
          set({ activeTicket: { id: conversation.ticket_id } as Ticket });
          await get().loadMessages(conversation.ticket_id.toString());
        } else {
          // Create a new ticket for this contact if none exists
          try {
            const newTicket = await ticketsApi.create({
              contact_id: parseInt(contact.id),
              subject: `Chat with ${contact.name}`,
              description: 'Auto-created ticket for chat conversation',
              priority: 'NORMAL',
              status: 'OPEN',
            });
            
            set({ activeTicket: newTicket });
            await get().loadMessages(newTicket.id.toString());
            
            // Refresh conversations to include the new ticket
            get().loadConversations();
          } catch (ticketError) {
            console.error('Failed to create ticket for contact:', ticketError);
            set({ error: 'Failed to create conversation' });
          }
        }
        
        // Join WebSocket room for real-time updates
        const ws = getWebSocketManager();
        if (ws && conversation?.ticket_id) {
          ws.joinContactRoom(conversation.ticket_id.toString());
        }
      } catch (error) {
        console.error('Failed to select conversation:', error);
        set({ error: 'Failed to select conversation' });
      }
    },

    clearActiveConversation: () => {
      const { activeTicket } = get();
      
      // Leave WebSocket room
      const ws = getWebSocketManager();
      if (ws && activeTicket) {
        ws.leaveContactRoom(activeTicket.id.toString());
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
      try {
        set({ isLoadingMessages: true, error: null });
        
        // Load all tickets for this contact
        const ticketsResponse = await ticketsApi.getByContact(contactId);
        const tickets = ticketsResponse.data || [];
        
        // Load all messages for this contact (across all tickets)
        const allMessages: Message[] = [];
        const episodes: TicketEpisode[] = [];
        
        for (const ticket of tickets) {
          // Load messages for each ticket
          const messagesResponse = await messagesApi.getByTicket(ticket.id.toString());
          const ticketMessages = messagesResponse.data || [];
          
          // Add to all messages
          allMessages.push(...ticketMessages.map((msg: any) => ({
            id: msg.id?.toString(),
            ticket_id: ticket.id.toString(),
            contact_id: contactId,
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
          })));
          
          // Create ticket episode
          const ticketCategory = getTicketCategory(ticket);
          const unreadCount = ticketMessages.filter((msg: any) => 
            msg.direction === 'incoming' && !msg.read_at
          ).length;
          
          episodes.push({
            ticket,
            messageCount: ticketMessages.length,
            startDate: ticket.created_at,
            endDate: ticket.resolved_at || (ticket.status === 'CLOSED' ? ticket.updated_at : undefined),
            status: ticket.status,
            category: ticketCategory,
            unreadCount,
            lastMessage: ticketMessages[ticketMessages.length - 1],
          });
        }
        
        // Sort messages by timestamp
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Find current active ticket (most recent open)
        const currentTicket = tickets.find(t => t.status === 'OPEN') || tickets[0];
        
        // Get contact info
        const contact = get().conversations.find(c => c.contact.id === contactId)?.contact;
        if (!contact) throw new Error('Contact not found');
        
        const conversation: ContactConversation = {
          contact,
          allMessages,
          ticketEpisodes: episodes,
          currentTicket,
          totalMessages: allMessages.length,
          unreadCount: episodes.reduce((sum, ep) => sum + ep.unreadCount, 0),
          lastActivity: allMessages[allMessages.length - 1]?.created_at || new Date().toISOString(),
          conversationAge: calculateConversationAge(allMessages[0]?.created_at),
        };
        
        set((state) => ({
          activeContactConversation: conversation,
          contactMessages: {
            ...state.contactMessages,
            [contactId]: allMessages,
          },
          ticketEpisodes: {
            ...state.ticketEpisodes,
            [contactId]: episodes,
          },
          isLoadingMessages: false,
        }));
        
      } catch (error) {
        console.error('Failed to load contact conversation:', error);
        set({
          error: 'Failed to load contact conversation',
          isLoadingMessages: false,
        });
      }
    },

    loadContactMessages: async (contactId: string, page = 1) => {
      // This method loads all messages for a contact across all tickets
      await get().loadContactConversation(contactId);
    },

    loadTicketEpisodes: async (contactId: string) => {
      try {
        const ticketsResponse = await ticketsApi.getByContact(contactId);
        const tickets = ticketsResponse.data || [];
        
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
      const conversation = get().conversations.find(c => c.ticket_id?.toString() === ticketId);
      if (conversation) {
        set({ 
          activeTicket: { id: parseInt(ticketId) } as Ticket,
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

    loadMessages: async (ticketId: string, page = 1) => {
      try {
        set({ isLoadingMessages: true, error: null });
        
        // Load messages from backend
        const response = await messagesApi.getByTicket(ticketId, {
          page,
          per_page: 50,
          order: 'created_at ASC'
        });
        
        const messages = response.data || [];
        
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

    sendMessage: async (data) => {
      try {
        set({ isSendingMessage: true, error: null });
        
        const { activeTicket, activeContact } = get();
        
        if (!activeTicket || !activeContact) {
          throw new Error('No active conversation');
        }

        // Prepare message data for backend
        const messageData = {
          session_name: 'default', // TODO: Get from session store
          ticket_id: parseInt(activeTicket.id.toString()),
          to: activeContact.phone,
          text: data.content,
          admin_id: 1, // TODO: Get from auth store
        };

        let response;
        
        if (data.media_file) {
          // Send media message
          const formData = new FormData();
          formData.append('session_name', messageData.session_name);
          formData.append('ticket_id', messageData.ticket_id.toString());
          formData.append('to', messageData.to);
          formData.append('caption', data.content);
          formData.append('admin_id', messageData.admin_id.toString());
          formData.append('media', data.media_file);
          formData.append('media_type', data.message_type || getMediaType(data.media_file));
          
          response = await messagesApi.sendMedia(formData);
        } else {
          // Send text message
          response = await messagesApi.send(messageData);
        }

        // The message will be added via WebSocket or we can add it optimistically
        const newMessage: Message = {
          id: response.id?.toString() || Date.now().toString(),
          ticket_id: activeTicket.id.toString(),
          contact_id: activeContact.id,
          session_id: 'default',
          direction: 'outgoing',
          message_type: data.message_type || 'text',
          content: data.content,
          body: data.content,
          status: 'sent',
          media_url: response.media_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        get().addMessage(newMessage);
        
        set({ isSendingMessage: false });
      } catch (error) {
        console.error('Failed to send message:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to send message',
          isSendingMessage: false,
        });
        throw error;
      }
    },

    addMessage: (message: Message) => {
      const ticketId = message.ticket_id;
      if (!ticketId) return;
      
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: [...(state.messages[ticketId] || []), message],
        },
      }));
    },

    updateMessage: (messageId: string, updates: Partial<Message>) => {
      set((state) => {
        const newMessages: Record<string, Message[]> = {};
        
        Object.entries(state.messages).forEach(([ticketId, ticketMessages]) => {
          newMessages[ticketId] = ticketMessages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        return { messages: newMessages };
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
            conv.ticket_id?.toString() === ticketId
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
    handleIncomingMessage: (message) => {
      get().addMessage(message);
      
      // Update conversation's last message and unread count
      const ticketId = message.ticket_id;
      if (ticketId) {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.ticket_id?.toString() === ticketId
              ? {
                  ...conv,
                  last_message: {
                    id: message.id,
                    content: message.content,
                    direction: message.direction,
                    created_at: message.created_at,
                  },
                  unread_count: (conv.unread_count || 0) + 1,
                  last_activity: message.created_at,
                }
              : conv
          ),
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
const ws = getWebSocketManager();
if (ws) {
  ws.on('message_received', (data) => {
    useChatStore.getState().handleIncomingMessage(data);
  });
  
  ws.on('message_status_update', (data) => {
    useChatStore.getState().handleMessageStatusUpdate(data.message_id, data.status);
  });
  
  ws.on('typing_start', (data) => {
    useChatStore.getState().handleTypingStart(data.ticket_id, data.username);
  });
  
  ws.on('typing_stop', (data) => {
    useChatStore.getState().handleTypingStop(data.ticket_id, data.username);
  });
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

export const useChatUI = () => useChatStore((state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  rightSidebarVisible: state.rightSidebarVisible,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  toggleRightSidebar: state.toggleRightSidebar,
}));

export const useChatError = () => useChatStore((state) => ({
  error: state.error,
  setError: state.setError,
  clearError: state.clearError,
})); 