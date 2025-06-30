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
      try {
        set({ isLoadingConversations: true, error: null });
        
        const contacts = await contactsApi.getAll();
        
        // Transform contacts to conversations (this would be more complex in real app)
        const conversations: Conversation[] = (contacts as any).data.map((contact: Contact) => ({
          contact,
          last_message: undefined,
          unread_count: 0,
          status: 'active' as const,
          assigned_to: undefined,
          labels: contact.labels || [],
          last_activity: contact.updated_at,
          ticket: undefined,
        }));
        
        set({ 
          conversations,
          isLoadingConversations: false,
        });
        
        // Group conversations after loading
        get().groupConversations();
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load conversations',
          isLoadingConversations: false,
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

    selectConversation: (contact) => {
      const conversation = get().conversations.find(c => c.contact.id === contact.id);
      
      set({
        activeContact: contact,
        activeConversation: conversation || null,
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
        
        const response = await messagesApi.getByContact(contactId, { page, per_page: 50 });
        const messages = (response as any).data;
        
        set((state) => ({
          messages: {
            ...state.messages,
            [contactId]: page === 1 ? messages : [...(state.messages[contactId] || []), ...messages],
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
        
        let response;
        if (data.media_file) {
          const formData = new FormData();
          formData.append('contact_id', data.contact_id);
          formData.append('session_id', data.session_id);
          formData.append('content', data.content);
          formData.append('message_type', data.message_type);
          formData.append('media', data.media_file);
          
          response = await messagesApi.sendMedia(formData);
        } else {
          response = await messagesApi.send(data);
        }
        
        // Add optimistic message update
        const message = response as Message;
        get().addMessage(message);
        
        set({ isSendingMessage: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to send message',
          isSendingMessage: false,
        });
        throw error;
      }
    },

    addMessage: (message) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [message.contact_id]: [
            ...(state.messages[message.contact_id] || []),
            message,
          ],
        },
      }));
      
      // Update conversation's last message and unread count
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.contact.id === message.contact_id
            ? {
                ...conv,
                last_message: message,
                unread_count: message.direction === 'incoming' 
                  ? conv.unread_count + 1 
                  : conv.unread_count,
                last_activity: message.created_at,
              }
            : conv
        ),
      }));
      
      // Re-group conversations
      get().groupConversations();
    },

    updateMessage: (messageId, updates) => {
      set((state) => {
        const newMessages = { ...state.messages };
        
        Object.keys(newMessages).forEach(contactId => {
          newMessages[contactId] = newMessages[contactId].map(msg =>
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