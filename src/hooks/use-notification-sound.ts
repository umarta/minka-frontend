import { useEffect } from 'react';
import { getWebSocketManager } from '@/lib/websocket';

// Global notification sound hook
export const useNotificationSound = () => {
  useEffect(() => {
    // Initialize global notification sound function with user preference
    if (typeof window !== 'undefined' && !window.playNotificationSound) {
      const isEnabled = localStorage.getItem('notification-sound-enabled') !== 'false'; // Default to true
      
      window.playNotificationSound = () => {
        if (!isEnabled) {
          console.log('[Notification] Sound disabled by user preference');
          return;
        }
        
        try {
          const audio = new Audio('/notification.wav');
          audio.volume = 0.5; // Set volume to 50%
          audio.play().catch(e => {
            console.warn('Failed to play notification sound:', e);
          });
        } catch (e) {
          console.warn('Failed to create notification sound:', e);
        }
      };
    }

    // Setup WebSocket listeners for global notification
    const ws = getWebSocketManager();
    if (ws) {
      // Listen for all incoming messages
      const handleIncomingMessage = (data: any) => {
        console.log('[WS] Global notification: Incoming message received', data);
        
        // Play notification sound for incoming messages
        if (data.direction === 'incoming' || data.direction === 'INCOMING') {
          if (window.playNotificationSound) {
            window.playNotificationSound();
          }
        }
      };

      // Listen for conversation updates (new messages)
      const handleConversationUpdated = (data: any) => {
        console.log('[WS] Global notification: Conversation updated', data);
        
        // Play notification sound if there's a new message
        if (data.last_message && data.last_message.direction === 'incoming') {
          if (window.playNotificationSound) {
            window.playNotificationSound();
          }
        }
      };

      // Listen for ticket updates (new tickets)
      const handleTicketCreated = (data: any) => {
        console.log('[WS] Global notification: Ticket created', data);
        
        // Play notification sound for new tickets
        if (window.playNotificationSound) {
          window.playNotificationSound();
        }
      };

      // Register event listeners
      ws.on('message_received', handleIncomingMessage);
      ws.on('conversation_updated', handleConversationUpdated);
      ws.on('ticket_created', handleTicketCreated);

      // Cleanup function
      return () => {
        ws.off('message_received', handleIncomingMessage);
        ws.off('conversation_updated', handleConversationUpdated);
        ws.off('ticket_created', handleTicketCreated);
      };
    }
  }, []);
};

// Manual notification sound function
export const playNotificationSound = () => {
  if (typeof window !== 'undefined' && window.playNotificationSound) {
    window.playNotificationSound();
  }
};

// Declare global types
declare global {
  interface Window {
    playNotificationSound?: () => void;
  }
} 