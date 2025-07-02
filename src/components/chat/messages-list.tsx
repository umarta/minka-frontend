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
    loadMessages,
    activeContact,
    contactMessages
  } = useChatStore();


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Tentukan messages yang akan dirender
  let displayMessages: any[] = [];
  if (activeTicket && activeTicket.id) {
    displayMessages = messages[activeTicket.id.toString()] || [];
  } else if (activeContact && contactMessages[activeContact.id]) {
    displayMessages = contactMessages[activeContact.id] || [];
  }



  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages, autoScroll]);

  // Load messages when ticket changes
  useEffect(() => {
    if (activeTicket) {
      loadMessages(activeTicket.id.toString());
    }
  }, [activeTicket, loadMessages]);

  // Mark messages as read when component mounts or ticket changes
  useEffect(() => {
    if (activeTicket && displayMessages.length > 0) {
      markMessagesAsRead(activeTicket.id.toString());
    }
  }, [activeTicket, markMessagesAsRead, displayMessages.length]);

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
  const groupedMessages = displayMessages.reduce((groups: { [key: string]: Message[] }, message) => {
    const dateKey = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  
  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="flex-1 overflow-y-auto max-h-[70vh] px-2 py-4" ref={containerRef} onScroll={handleScroll}>
      {displayMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Belum ada pesan</p>
            <p className="text-sm text-gray-400">Mulai percakapan dengan mengirim pesan</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {displayMessages.map((msg, idx) => (
            <MessageBubble key={msg.id || idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
} 