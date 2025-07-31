import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChat, useChatStore } from '@/lib/stores/chat';
import { Conversation } from '@/types';
import { ConversationItem } from './conversation-item';
import { ContactLabelManager } from '@/components/ContactLabelManager';

interface InfiniteConversationListProps {
  conversations: Conversation[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const InfiniteConversationList: React.FC<InfiniteConversationListProps> = ({
  conversations,
  onLoadMore,
  hasMore,
  isLoading
}) => {
  console.log('📊 InfiniteConversationList props:', { 
    conversationsCount: conversations.length, 
    hasMore, 
    isLoading 
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Contact Label Manager state
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [selectedConversationForLabels, setSelectedConversationForLabels] = useState<Conversation | null>(null);

  // Handle contact label manager
  const handleContactLabel = (conversation: Conversation) => {
    setSelectedConversationForLabels(conversation);
    setLabelManagerOpen(true);
  };



  const lastElementRef = useCallback((node: HTMLDivElement) => {
    console.log('🔍 lastElementRef called:', { node: !!node, isLoading, hasMore });
    
    if (isLoading) {
      console.log('⏸️ Skipping observer setup - isLoading');
      return;
    }
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      console.log('👁️ Intersection observer triggered:', { 
        isIntersecting: entries[0]?.isIntersecting, 
        hasMore 
      });
      
      if (entries[0]?.isIntersecting && hasMore) {
        console.log('🚀 Triggering load more!');
        onLoadMore();
      }
    }, {
      root: null, // Use viewport
      rootMargin: '100px', // Trigger 100px before reaching bottom
      threshold: 0.1 // Trigger when 10% of element is visible
    });
    
    if (node) {
      console.log('📌 Observing last element');
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Fallback scroll listener for better infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer && hasMore && !isLoading) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200; // 200px from bottom
        
        if (isNearBottom) {
          console.log('📜 Scroll fallback triggered load more');
          onLoadMore();
        }
      }
    };

    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, isLoading, onLoadMore]);

  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📭</div>
          <p>No conversations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation, index) => {
        const isLast = index === conversations.length - 1;
        
        // Create a unique key using conversation ID and contact ID as fallback
        const uniqueKey = conversation.id 
          ? `conv-${conversation.id}` 
          : `contact-${conversation.contact?.id || index}-${index}`;
        
        return (
          <div
            key={uniqueKey}
            ref={isLast ? lastElementRef : undefined}
          >
            <ConversationItem 
              conversation={conversation} 
              onContactLabel={handleContactLabel}
            />
          </div>
        );
      })}
      
      {isLoading && (
        <div ref={loadingRef} className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Loading more conversations...</span>
        </div>
      )}
      
      {!hasMore && conversations.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No more conversations to load
        </div>
      )}
      
      {/* Contact Label Manager Modal */}
      {labelManagerOpen && selectedConversationForLabels && (
        <ContactLabelManager
          contactId={selectedConversationForLabels.contact.id.toString()}
          contactName={selectedConversationForLabels.contact.name}
          isOpen={labelManagerOpen}
          onClose={() => {
            setLabelManagerOpen(false);
            setSelectedConversationForLabels(null);
          }}
        />
      )}
    </div>
  );
}; 