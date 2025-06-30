import { io, Socket } from 'socket.io-client';
import { WebSocketEventType } from '@/types';
import { tokenManager } from './api';

export interface WebSocketConfig {
  url: string;
  auth?: {
    token: string;
  };
  transports?: string[];
  autoConnect?: boolean;
}

export class WebSocketManager {
  private socket: Socket | null = null;
  private eventListeners: Map<WebSocketEventType, Array<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private config: WebSocketConfig) {
    this.initializeSocket();
  }

  private initializeSocket() {
    const token = tokenManager.getToken();
    
    this.socket = io(this.config.url, {
      auth: {
        token: token,
      },
      transports: this.config.transports || ['websocket', 'polling'],
      autoConnect: this.config.autoConnect !== false,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_established', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_lost', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    });

    // Authentication events
    this.socket.on('auth_error', (error) => {
      console.error('WebSocket auth error:', error);
      this.emit('auth_error', error);
    });

    // Message events
    this.socket.on('message_received', (data) => {
      this.emit('message_received', data);
    });

    this.socket.on('message_sent', (data) => {
      this.emit('message_sent', data);
    });

    this.socket.on('message_status_update', (data) => {
      this.emit('message_status_update', data);
    });

    // Typing events
    this.socket.on('typing_start', (data) => {
      this.emit('typing_start', data);
    });

    this.socket.on('typing_stop', (data) => {
      this.emit('typing_stop', data);
    });

    // User presence events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Session events
    this.socket.on('session_status_update', (data) => {
      this.emit('session_status_update', data);
    });

    this.socket.on('qr_code_update', (data) => {
      this.emit('qr_code_update', data);
    });

    // Conversation events
    this.socket.on('conversation_assigned', (data) => {
      this.emit('conversation_assigned', data);
    });

    // Ticket events
    this.socket.on('ticket_created', (data) => {
      this.emit('ticket_created', data);
    });

    this.socket.on('ticket_updated', (data) => {
      this.emit('ticket_updated', data);
    });

    // Admin activity events
    this.socket.on('admin_activity', (data) => {
      this.emit('admin_activity', data);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached', { attempts: this.reconnectAttempts });
    }
  }

  // Public methods
  connect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Event subscription
  on(event: WebSocketEventType | 'connection_established' | 'connection_lost' | 'auth_error' | 'max_reconnect_attempts_reached', callback: (data: any) => void) {
    if (!this.eventListeners.has(event as WebSocketEventType)) {
      this.eventListeners.set(event as WebSocketEventType, []);
    }
    this.eventListeners.get(event as WebSocketEventType)?.push(callback);
  }

  off(event: WebSocketEventType | 'connection_established' | 'connection_lost' | 'auth_error' | 'max_reconnect_attempts_reached', callback?: (data: any) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(event as WebSocketEventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(event as WebSocketEventType);
    }
  }

  private emit(event: WebSocketEventType | string, data: any) {
    const listeners = this.eventListeners.get(event as WebSocketEventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Room management
  joinRoom(room: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { room });
      console.log(`Joined room: ${room}`);
    }
  }

  leaveRoom(room: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { room });
      console.log(`Left room: ${room}`);
    }
  }

  // Chat specific methods
  joinContactRoom(contactId: string) {
    this.joinRoom(`contact_${contactId}`);
  }

  leaveContactRoom(contactId: string) {
    this.leaveRoom(`contact_${contactId}`);
  }

  joinSessionRoom(sessionId: string) {
    this.joinRoom(`session_${sessionId}`);
  }

  leaveSessionRoom(sessionId: string) {
    this.leaveRoom(`session_${sessionId}`);
  }

  joinTicketRoom(ticketId: string) {
    this.joinRoom(`ticket_${ticketId}`);
  }

  leaveTicketRoom(ticketId: string) {
    this.leaveRoom(`ticket_${ticketId}`);
  }

  joinAdminRoom(adminId: string) {
    this.joinRoom(`admin_${adminId}`);
  }

  leaveAdminRoom(adminId: string) {
    this.leaveRoom(`admin_${adminId}`);
  }

  // Typing indicators
  startTyping(contactId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { contact_id: contactId });
    }
  }

  stopTyping(contactId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { contact_id: contactId });
    }
  }

  // User presence
  setUserOnline() {
    if (this.socket && this.isConnected) {
      this.socket.emit('user_online');
    }
  }

  setUserOffline() {
    if (this.socket && this.isConnected) {
      this.socket.emit('user_offline');
    }
  }

  // Message events
  markMessageAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message_read', { message_id: messageId });
    }
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Update authentication token
  updateAuth(token: string) {
    if (this.socket) {
      this.socket.auth = { token };
      if (this.isConnected) {
        this.socket.disconnect();
        this.socket.connect();
      }
    }
  }

  // Cleanup
  destroy() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
    this.isConnected = false;
  }
}

// Create singleton instance
let wsManager: WebSocketManager | null = null;

export const createWebSocketManager = (config?: Partial<WebSocketConfig>): WebSocketManager => {
  const defaultConfig: WebSocketConfig = {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  if (!wsManager) {
    wsManager = new WebSocketManager(finalConfig);
  }
  
  return wsManager;
};

export const getWebSocketManager = (): WebSocketManager | null => {
  return wsManager;
};

export const destroyWebSocketManager = () => {
  if (wsManager) {
    wsManager.destroy();
    wsManager = null;
  }
};

// Utility functions for common WebSocket operations
export const wsUtils = {
  // Join multiple rooms at once
  joinRooms: (rooms: string[]) => {
    const ws = getWebSocketManager();
    if (ws) {
      rooms.forEach(room => ws.joinRoom(room));
    }
  },

  // Leave multiple rooms at once
  leaveRooms: (rooms: string[]) => {
    const ws = getWebSocketManager();
    if (ws) {
      rooms.forEach(room => ws.leaveRoom(room));
    }
  },

  // Subscribe to multiple events with same callback
  subscribeToEvents: (events: WebSocketEventType[], callback: (data: any) => void) => {
    const ws = getWebSocketManager();
    if (ws) {
      events.forEach(event => ws.on(event, callback));
    }
  },

  // Unsubscribe from multiple events
  unsubscribeFromEvents: (events: WebSocketEventType[], callback?: (data: any) => void) => {
    const ws = getWebSocketManager();
    if (ws) {
      events.forEach(event => ws.off(event, callback));
    }
  },
};

export default WebSocketManager; 