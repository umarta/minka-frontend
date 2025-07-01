import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { useChatStore } from '@/lib/stores/chat';
import { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';

interface MessagesListProps {
  contactId?: string;
}

export function MessagesList({ contactId }: MessagesListProps) {
  const { 
    messages,
    isLoadingMessages,
    typingUsers,
    markMessagesAsRead,
    activeTicket,
    loadMessages
  } = useChatStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Get messages for the current ticket
  const ticketMessages = activeTicket ? (messages[activeTicket.id.toString()] || []) : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages, autoScroll]);

  // Load messages when ticket changes
  useEffect(() => {
    if (activeTicket) {
      loadMessages(activeTicket.id.toString());
    }
  }, [activeTicket, loadMessages]);

  // Mark messages as read when component mounts or ticket changes
  useEffect(() => {
    if (activeTicket && ticketMessages.length > 0) {
      markMessagesAsRead(activeTicket.id.toString());
    }
  }, [activeTicket, markMessagesAsRead, ticketMessages.length]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      setAutoScroll(isAtBottom);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Hari ini';
    } else if (isYesterday(date)) {
      return 'Kemarin';
    } else {
      return format(date, 'dd MMMM yyyy', { locale: id });
    }
  };

  // Group messages by date
  const groupedMessages = ticketMessages.reduce((groups: { [key: string]: Message[] }, message) => {
    const dateKey = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (!activeTicket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Pilih kontak untuk melihat pesan</p>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-100 p-3"
      onScroll={handleScroll}
    >
      {ticketMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Belum ada pesan</p>
            <p className="text-sm text-gray-400">Mulai percakapan dengan mengirim pesan</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey} className="space-y-1">
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <div className="bg-white px-2 py-1 rounded-md shadow-sm text-xs text-gray-600 border border-gray-200">
                  {formatMessageDate(msgs[0].created_at)}
                </div>
              </div>

              {/* Messages for this date */}
              {msgs.map((message: Message, index: number) => {
                const prevMessage = index > 0 ? msgs[index - 1] : null;
                const nextMessage = index < msgs.length - 1 ? msgs[index + 1] : null;
                
                const isGrouped = !!nextMessage && 
                  nextMessage.direction === message.direction &&
                  new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() < 300000; // 5 minutes
                
                // Only show timestamp for very large time gaps (not used for now, keeping date separators only)
                const showTimestamp = false;
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isGrouped={isGrouped}
                    showTimestamp={showTimestamp}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Typing indicator */}
          {activeTicket && typingUsers[activeTicket.id.toString()] && typingUsers[activeTicket.id.toString()].length > 0 && (
            <TypingIndicator users={typingUsers[activeTicket.id.toString()]} />
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="fixed bottom-24 right-6 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
} 