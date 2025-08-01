import { WebSocketEventType } from '@/types';
import { tokenManager } from './api';

export interface WebSocketConfig {
  url: string;
  auth?: {
    token: string;
  };
  autoConnect?: boolean;
}

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();
  private isConnected = false;

  constructor(private config: WebSocketConfig) {
    this.initializeSocket();
  }

  private initializeSocket() {
    let url = this.config.url;
    // Optionally add token as query param if needed
    if (this.config.auth?.token) {
      const sep = url.includes('?') ? '&' : '?';
      url += `${sep}token=${encodeURIComponent(this.config.auth.token)}`;
    }
    this.socket = new window.WebSocket(url);

    this.socket.onopen = () => {
      this.isConnected = true;
      console.log('[WS] WebSocket connected');
      this.emit('connection_established', { connected: true });
    };
    this.socket.onclose = (event) => {
      this.isConnected = false;
      console.log('[WS] WebSocket disconnected:', event.reason);
      this.emit('connection_lost', { reason: event.reason });
    };
    this.socket.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
      this.emit('connection_error', error);
    };
    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event) {
          this.emit(msg.event, msg.data);
        } else if (msg.type) {
          this.emit(msg.type, msg.data);
        }
      } catch (e) {
        console.warn('[WS] Received non-JSON message:', event.data);
      }
    };
  }

  connect() {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.initializeSocket();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  // Room management
  joinRoom(room: string) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'join_room', room }));
      console.log('[WS] Sent join_room:', room);
    }
  }
  leaveRoom(room: string) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'leave_room', room }));
      console.log('[WS] Sent leave_room:', room);
    }
  }
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
      this.socket.send(JSON.stringify({ type: 'typing_start', contact_id: contactId }));
    }
  }
  stopTyping(contactId: string) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'typing_stop', contact_id: contactId }));
    }
  }
  // User presence
  setUserOnline() {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'user_online' }));
    }
  }
  setUserOffline() {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'user_offline' }));
    }
  }
  // Message events
  markMessageAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: 'message_read', message_id: messageId }));
    }
  }
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
  // Cleanup
  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.eventListeners.clear();
    this.isConnected = false;
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export const createWebSocketManager = (config?: Partial<WebSocketConfig>): WebSocketManager => {
  const defaultConfig: WebSocketConfig = {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/ws/connect',
    autoConnect: true,
  };
  const finalConfig = { ...defaultConfig, ...config };
  if (!wsManager) {
    wsManager = new WebSocketManager(finalConfig);
  }
  return wsManager;
};

export const getWebSocketManager = (): WebSocketManager | null => wsManager;

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