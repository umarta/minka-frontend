'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { useChatStore } from '@/lib/stores/chat';
import { Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';

interface MessagesListProps {
  contactId: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  total: number;
  count: number;
}

export function MessagesList({ contactId }: MessagesListProps) {
  const { 
    contactMessages,
    isLoadingMessages,
    typingUsers,
    markMessagesAsRead,
    activeTicket,
    loadMessages,
    refreshMessages,
    activeContact,
    searchQuery,
    searchResults,
    loadContactMessages
  } = useChatStore();

  // Ambil mode percakapan dan ticket aktif
  const conversationMode = useChatStore((state) => state.conversationMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  // Determine which messages to display
  const displayMessages = searchQuery && searchResults 
    ? searchResults 
    : contactMessages[contactId] || [];
    
  console.log('🔍 MessagesList render:', {
    searchQuery,
    searchResultsCount: searchResults?.length || 0,
    contactMessagesCount: contactMessages[contactId]?.length || 0,
    displayMessagesCount: displayMessages.length,
    contactId,
    currentPage,
    hasNext: paginationMeta?.has_next,
    messages: displayMessages,
    paginationMeta
  });

  // Load messages when component mounts or contact changes
  useEffect(() => {
    if (contactId) {
      console.log('🔍 Loading messages for contact:', contactId);
      setHasLoadedMessages(false);
      setCurrentPage(1);
      setPaginationMeta(null);
      
      // Add small delay to avoid race conditions
      const timer = setTimeout(async () => {
        try {
          const response = await loadContactMessages(contactId, 1);
          setHasLoadedMessages(true);
          
          // Extract pagination metadata from response
          if (response?.meta?.pagination) {
            setPaginationMeta(response.meta.pagination);
          }
        } catch (error) {
          console.error('Failed to load initial messages:', error);
          setHasLoadedMessages(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contactId, loadContactMessages]);

  // Auto-scroll ke bawah hanya saat buka chat baru
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [contactId]);

  // Load messages when ticket changes - use optimized loading
  useEffect(() => {
    if (activeTicket) {
      // Only load if we don't have messages for this ticket or if it's a different ticket
      const currentMessages = useChatStore.getState().messages[activeTicket.id.toString()];
      if (!currentMessages || currentMessages.length === 0) {
        loadMessages(activeTicket.id.toString());
      }
    }
  }, [activeTicket, loadMessages]);

  // Mark messages as read when component mounts or ticket changes
  useEffect(() => {
    if (activeTicket && displayMessages.length > 0) {
      markMessagesAsRead(activeTicket.id.toString());
    }
  }, [activeTicket, markMessagesAsRead, displayMessages.length]);

  // Update hasLoadedMessages when messages are loaded
  useEffect(() => {
    if (displayMessages.length > 0 && !hasLoadedMessages) {
      setHasLoadedMessages(true);
    }
  }, [displayMessages.length, hasLoadedMessages]);

  // Handle scroll to detect if user scrolled up and load older messages
  const handleScroll = async () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      setAutoScroll(isAtBottom);
      
      // Load older messages when user scrolls to top (reverse pagination)
      // Only load if we have more pages and user is at the top
      if (scrollTop < 100 && !isLoadingOlder && !searchQuery && paginationMeta?.has_next) {
        console.log('🔍 Loading older messages, current page:', currentPage, 'has_next:', paginationMeta.has_next);
        setIsLoadingOlder(true);
        try {
          const nextPage = currentPage + 1;
          const response = await loadContactMessages(contactId, nextPage, undefined, true);
          setCurrentPage(nextPage);
          
          // Update pagination metadata
          if (response?.meta?.pagination) {
            setPaginationMeta(response.meta.pagination);
          }
        } catch (error) {
          console.error('Failed to load older messages:', error);
        } finally {
          setIsLoadingOlder(false);
        }
      }
    }
  };

  // Handle refresh messages (for manual refresh)
  const handleRefresh = () => {
    if (activeTicket) {
      refreshMessages(activeTicket.id.toString());
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

    console.log('message in buble', message);
    groups[dateKey].push(message);
    return groups;
  }, {});

  // Show loading state only if we're actively loading and have no messages yet
  if (isLoadingMessages && displayMessages.length === 0 && !hasLoadedMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show empty state only if we've finished loading and have no messages
  if (!isLoadingMessages && displayMessages.length === 0 && hasLoadedMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          {searchQuery ? (
            <div>
              <p>Tidak ada pesan yang ditemukan untuk "{searchQuery}"</p>
              <p className="text-sm mt-1">Coba kata kunci lain</p>
            </div>
          ) : (
            <div>
              <p>Belum ada pesan</p>
              <p className="text-sm mt-1">Mulai percakapan dengan mengirim pesan</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[77vh] px-2 py-4 pb-24" ref={containerRef} onScroll={handleScroll}>
      {/* Loading indicator for older messages */}
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Pagination info (debug) */}
      {paginationMeta && (
        <div className="text-xs text-gray-400 text-center py-1">
          Halaman {paginationMeta.page} dari {paginationMeta.total_pages} 
          {paginationMeta.has_next && ' • Ada halaman selanjutnya'}
        </div>
      )}
      
      {Object.entries(groupedMessages)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([dateKey, messages]) => (
          <div key={dateKey}>
            {/* Date Header */}
            <div className="flex justify-center my-4">
              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                {formatMessageDate(messages[0].created_at)}
              </div>
            </div>
            
            {/* Messages for this date */}
            {messages.map((message: Message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSearchResult={!!searchQuery}
              />
            ))}
          </div>
        ))}
      <div ref={messagesEndRef} />
    </div>
  );
}