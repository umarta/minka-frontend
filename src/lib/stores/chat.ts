import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Contact, Message, Conversation, ChatGroups, MessageForm } from '@/types';
import { contactsApi, messagesApi } from '@/lib/api';
import { getWebSocketManager } from '@/lib/websocket';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  chatGroups: ChatGroups;
  
  // Active chat
  activeContact: Contact | null;
  activeConversation: Conversation | null;
  selectedContactId: string | null;
  
  // Messages
  messages: Record<string, Message[]>; // contactId -> messages
  messagePages: Record<string, number>; // contactId -> current page
  
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
  typingUsers: Record<string, string[]>; // contactId -> typing usernames
  
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
  
  // Messages
  loadMessages: (contactId: string, page?: number) => Promise<void>;
  sendMessage: (data: MessageForm) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markMessagesAsRead: (contactId: string) => void;
  
  // Real-time updates
  handleIncomingMessage: (message: Message) => void;
  handleMessageStatusUpdate: (messageId: string, status: string) => void;
  handleTypingStart: (contactId: string, username: string) => void;
  handleTypingStop: (contactId: string, username: string) => void;
  
  // Search
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // UI actions
  toggleSidebar: () => void;
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
    activeContact: null,
    activeConversation: null,
    selectedContactId: null,
    messages: {},
    messagePages: {},
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
      set({ isLoadingConversations: true });
      try {
        // Load mock conversations
        const conversations = mockConversations;
        
        // Organize conversations into groups
        const groups: ChatGroups = {
          needReply: {
            urgent: conversations.filter(c => c.unread_count > 0 && c.unread_count >= 2),
            normal: conversations.filter(c => c.unread_count > 0 && c.unread_count === 1),
            overdue: [],
          },
          automated: {
            botHandled: [],
            autoReply: [],
            workflow: [],
          },
          completed: {
            resolved: [],
            closed: [],
            archived: [],
          },
        };

        set({ 
          conversations,
          chatGroups: groups,
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

      set({ chatGroups });
    },

    selectConversation: (contact: Contact) => {
      const conversation = get().conversations.find(c => c.contact.id === contact.id);
      
      set({ 
        activeContact: contact,
        activeConversation: conversation || null,
        selectedContactId: contact.id,
      });
      
      // Load messages for the selected contact
      get().loadMessages(contact.id);
      
      // Join WebSocket room for real-time updates
      const ws = getWebSocketManager();
      if (ws) {
        ws.joinContactRoom(contact.id);
      }
    },

    clearActiveConversation: () => {
      const { activeContact } = get();
      
      // Leave WebSocket room
      const ws = getWebSocketManager();
      if (ws && activeContact) {
        ws.leaveContactRoom(activeContact.id);
      }
      
      set({
        activeContact: null,
        activeConversation: null,
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

    loadMessages: async (contactId, page = 1) => {
      try {
        set({ isLoadingMessages: true, error: null });
        
        // Load mock messages for the contact
        const messages = mockMessages[contactId] || [];
        
        set((state) => ({
          messages: {
            ...state.messages,
            [contactId]: messages,
          },
          messagePages: {
            ...state.messagePages,
            [contactId]: page,
          },
          isLoadingMessages: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load messages',
          isLoadingMessages: false,
        });
      }
    },

    sendMessage: async (data) => {
      try {
        set({ isSendingMessage: true, error: null });
        
        // Create new message with current timestamp
        const newMessage: Message = {
          id: Date.now().toString(),
          content: data.content,
          contact_id: data.contact_id,
          session_id: data.session_id,
          direction: 'outgoing',
          message_type: data.message_type,
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add the message to the store immediately (optimistic update)
        get().addMessage(newMessage);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update message status to delivered
        get().updateMessage(newMessage.id, { status: 'delivered' });
        
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
      set((state) => ({
        messages: {
          ...state.messages,
          [message.contact_id]: [...(state.messages[message.contact_id] || []), message],
        },
      }));
    },

    updateMessage: (messageId: string, updates: Partial<Message>) => {
      set((state) => {
        const newMessages: Record<string, Message[]> = {};
        
        Object.entries(state.messages).forEach(([contactId, contactMessages]) => {
          newMessages[contactId] = contactMessages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        return { messages: newMessages };
      });
    },

    markMessagesAsRead: (contactId) => {
      const messages = get().messages[contactId] || [];
      const unreadMessages = messages.filter(msg => 
        msg.direction === 'incoming' && !msg.read_at
      );
      
      // Mark messages as read in the API
      unreadMessages.forEach(msg => {
        messagesApi.markAsRead(msg.id).catch(console.error);
      });
      
      // Update local state
      set((state) => ({
        messages: {
          ...state.messages,
          [contactId]: state.messages[contactId]?.map(msg =>
            msg.direction === 'incoming' && !msg.read_at
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          ) || [],
        },
        conversations: state.conversations.map(conv =>
          conv.contact.id === contactId
            ? { ...conv, unread_count: 0 }
            : conv
        ),
      }));
      
      // Re-group conversations
      get().groupConversations();
    },

    // Real-time handlers
    handleIncomingMessage: (message) => {
      get().addMessage(message);
    },

    handleMessageStatusUpdate: (messageId, status) => {
      get().updateMessage(messageId, { status: status as any });
    },

    handleTypingStart: (contactId, username) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [contactId]: [
            ...(state.typingUsers[contactId] || []).filter(u => u !== username),
            username,
          ],
        },
      }));
    },

    handleTypingStop: (contactId, username) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [contactId]: (state.typingUsers[contactId] || []).filter(u => u !== username),
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
    useChatStore.getState().handleTypingStart(data.contact_id, data.username);
  });
  
  ws.on('typing_stop', (data) => {
    useChatStore.getState().handleTypingStop(data.contact_id, data.username);
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
  const messages = useChatStore((state) => 
    activeContact ? state.messages[activeContact.id] || [] : []
  );
  
  return { activeContact, activeConversation, messages };
};

export const useChatGroups = () => useChatStore((state) => state.chatGroups);
export const useChatSearch = () => useChatStore((state) => ({
  searchQuery: state.searchQuery,
  searchResults: state.searchResults,
  isSearching: state.isSearching,
  searchMessages: state.searchMessages,
  clearSearch: state.clearSearch,
}));

// Mock data for development
const mockConversations: Conversation[] = [
  {
    contact: {
      id: '1',
      name: 'Yanuar',
      phone: '+6281933393369',
      avatar_url: '',
      last_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '1',
      content: 'Brp??',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    unread_count: 2,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '2',
      name: 'arniadyrendy',
      phone: '+6281234567890',
      avatar_url: '',
      last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '2',
      content: 'Untuk harga pembuatan stiker nya berapa ka?',
      contact_id: '2',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 2,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '3',
      name: 'RAJA ES PISANG IJO KHAS MAKASAR',
      phone: '+6281345678901',
      avatar_url: '',
      last_seen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '3',
      content: 'Saya mau bikin stiker',
      contact_id: '3',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    unread_count: 2,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '4',
      name: 'ابو عدنان',
      phone: '+6281456789012',
      avatar_url: '',
      last_seen: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '4',
      content: '🤝 Halo kak ابو عدنان, ada yang bisa Kame bantu? Jam Operasional Cs...',
      contact_id: '4',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '5',
      name: 'IAP',
      phone: '+6281567890123',
      avatar_url: '',
      last_seen: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '5',
      content: '🤝 Halo kak IAP, ada yang bisa Kame bantu? Jam Operasional Cs...',
      contact_id: '5',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '6',
      name: 'Umi Astuti',
      phone: '+6281678901234',
      avatar_url: '',
      last_seen: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '6',
      content: '🤝 Halo kak Umi Astuti, ada yang bisa Kame bantu? Jam Operasional...',
      contact_id: '6',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '7',
      name: 'Warkop11_12',
      phone: '+6281789012345',
      avatar_url: '',
      last_seen: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '7',
      content: '🤝 Halo kak Warkop11_12, ada yang bisa Kame bantu? Jam Operasional...',
      contact_id: '7',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '8',
      name: 'A. Rahman',
      phone: '+6281890123456',
      avatar_url: '',
      last_seen: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '8',
      content: '🤝 Halo kak A. Rahman, ada yang bisa Kame bantu? Jam Operasional...',
      contact_id: '8',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
  {
    contact: {
      id: '9',
      name: 'Tri Irawanto',
      phone: '+6281901234567',
      avatar_url: '',
      last_seen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      is_blocked: false,
      labels: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_message: {
      id: '9',
      content: '🤝 Halo kak Tri Irawanto, ada yang bisa Kame bantu? Jam Operasional...',
      contact_id: '9',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    status: 'active',
    assigned_to: undefined,
    labels: [],
  },
];

// Mock messages data for each contact
const mockMessages: Record<string, Message[]> = {
  '1': [ // Yanuar
    {
      id: '1-1',
      content: 'Halo kak, mau tanya dong',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-2',
      content: 'Halo! Ada yang bisa saya bantu?',
      contact_id: '1',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-3',
      content: 'Saya mau order stiker untuk usaha saya',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-4',
      content: 'Siap kak! Stiker untuk apa ya? Dan kira-kira berapa quantity yang dibutuhkan?',
      contact_id: '1',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 90000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-5',
      content: 'Untuk branding produk makanan saya',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 120000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-6',
      content: 'Kira-kira butuh sekitar 100-200 pcs',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 125000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '1-7',
      content: 'Brp??',
      contact_id: '1',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '2': [ // arniadyrendy
    {
      id: '2-1',
      content: 'Halo admin',
      contact_id: '2',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2-2',
      content: 'Selamat pagi! Ada yang bisa kami bantu?',
      contact_id: '2',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 60000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2-3',
      content: 'Untuk harga pembuatan stiker nya berapa ka?',
      contact_id: '2',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2-4',
      content: 'Untuk stiker custom mulai dari 25rb/set (10 stiker). Mau design sendiri atau kita buatkan?',
      contact_id: '2',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 120000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '3': [ // RAJA ES PISANG IJO KHAS MAKASAR
    {
      id: '3-1',
      content: '🤝 Halo kak RAJA ES PISANG IJO KHAS MAKASAR, ada yang bisa Kame bantu? Jam Operasional Customer Service kami 08.00-17.00 WIB',
      contact_id: '3',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3-2',
      content: 'Saya mau bikin stiker',
      contact_id: '3',
      session_id: '1',
      direction: 'incoming',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3-3',
      content: 'Siap kak! Untuk stiker custom kami ada beberapa paket:\n\n📦 Paket A: 10 stiker - 25rb\n📦 Paket B: 20 stiker - 45rb\n📦 Paket C: 50 stiker - 100rb\n\nSemua include design dan cetak berkualitas tinggi. Mau pilih yang mana?',
      contact_id: '3',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 180000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '4': [ // ابو عدنان
    {
      id: '4-1',
      content: '🤝 Halo kak ابو عدنان, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '4',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '5': [ // IAP
    {
      id: '5-1',
      content: '🤝 Halo kak IAP, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '5',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '6': [ // Umi Astuti
    {
      id: '6-1',
      content: '🤝 Halo kak Umi Astuti, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '6',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '7': [ // Warkop11_12
    {
      id: '7-1',
      content: '🤝 Halo kak Warkop11_12, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '7',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '8': [ // A. Rahman
    {
      id: '8-1',
      content: '🤝 Halo kak A. Rahman, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '8',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  '9': [ // Tri Irawanto
    {
      id: '9-1',
      content: '🤝 Halo kak Tri Irawanto, ada yang bisa Kame bantu? Jam Operasional Cs kami 08.00-17.00 WIB',
      contact_id: '9',
      session_id: '1',
      direction: 'outgoing',
      message_type: 'text',
      status: 'delivered',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}; 