'use client';

import { useState, useEffect } from 'react';
import { ContactSidebar } from './contact-sidebar';
import { ChatArea } from './chat-area';
import { InfoPanel } from './info-panel';
import TicketHistoryPanel from './ticket-history-panel';
import { useChatStore, useRightSidebarMode, useSetRightSidebarMode, useRightSidebarVisible, useSidebarCollapsed } from '@/lib/stores/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Info, 
  MessageSquare, 
  History, 
  ToggleLeft, 
  ToggleRight,
  Users,
  Bot,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Settings,
  Filter,
  SortAsc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export function ChatLayout({ children }: { children?: React.ReactNode }) {
  const { 
    activeContact, 
    rightSidebarVisible, 
    toggleRightSidebar,
    sidebarCollapsed,
    toggleSidebar,
    loadConversations,
    updateMessage,
    // New contact conversation features
    conversationMode,
    showTicketHistory,
    toggleConversationMode,
    toggleTicketHistory,
    activeContactConversation,
    ticketEpisodes,
    loadContactConversation,
    selectTicketEpisode
  } = useChatStore();

  const rightSidebarMode = useRightSidebarMode();
  const setRightSidebarMode = useSetRightSidebarMode();

  const [mobileView, setMobileView] = useState<'sidebar' | 'chat' | 'info' | 'history'>('sidebar');
  const [rightPanelMode, setRightPanelMode] = useState<'info' | 'history'>('info');
  
  // Enhanced Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    messageType: 'all' as 'all' | 'text' | 'image' | 'video' | 'audio' | 'document',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
    sender: 'all' as 'all' | 'incoming' | 'outgoing'
  });

  // Enhanced Message Actions State
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load contact conversation when active contact changes
  useEffect(() => {
    if (activeContact && conversationMode === 'unified') {
      loadContactConversation(activeContact.id);
    }
  }, [activeContact, conversationMode, loadContactConversation]);

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate search API call
    setTimeout(() => {
      // Get all messages from all contact conversations
      let allMessages: Message[] = [];
      if (activeContactConversation) {
        allMessages = activeContactConversation.allMessages;
      }
      
      const filteredMessages = allMessages.filter(message => {
        const matchesQuery = message.content.toLowerCase().includes(query.toLowerCase());
        const matchesType = searchFilters.messageType === 'all' || message.message_type === searchFilters.messageType;
        const matchesSender = searchFilters.sender === 'all' || message.direction === searchFilters.sender;
        
        return matchesQuery && matchesType && matchesSender;
      });
      
      setSearchResults(filteredMessages);
      setIsSearching(false);
      
      console.log('🔍 Search results:', filteredMessages.length, 'messages found for:', query);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    console.log('🗑️ Search cleared');
  };

  // Enhanced Message Actions
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      // Simulate reaction API call
      console.log('✅ Reaction added:', emoji, 'to message:', messageId);
      
      toast({
        title: "Reaction Added",
        description: `Added ${emoji} reaction to message`,
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (messageId: string) => {
    setEditingMessage(messageId);
    console.log('✏️ Editing message:', messageId);
    
    toast({
      title: "Edit Mode",
      description: "You can now edit this message",
    });
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    console.log('💬 Replying to message:', message.id);
    
    toast({
      title: "Reply Mode",
      description: "Replying to message",
    });
  };

  const handleForward = (message: Message) => {
    setForwardingMessage(message);
    console.log('⏩ Forwarding message:', message.id);
    
    toast({
      title: "Forward Mode",
      description: "Select contacts to forward message",
    });
  };

  const handleDelete = async (messageId: string) => {
    try {
      // Simulate delete API call
      console.log('🗑️ Message deleted:', messageId);
      
      toast({
        title: "Message Deleted",
        description: "Message has been deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('📋 Text copied to clipboard');
      
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  // Mock data for demonstration (replace with real data from store)
  const mockTicketEpisodes = activeContact ? [
    {
      ticket: { id: 1, status: 'OPEN' } as any,
      messageCount: 12,
      startDate: new Date().toISOString(),
      category: 'PERLU_DIBALAS' as const,
      unreadCount: 3,
      status: 'OPEN'
    },
    {
      ticket: { id: 2, status: 'CLOSED' } as any,
      messageCount: 8,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() - 3600000).toISOString(),
      category: 'SELESAI' as const,
      unreadCount: 0,
      status: 'CLOSED'
    }
  ] : [];

  const handleEpisodeSelect = (ticketId: string) => {
    selectTicketEpisode(ticketId);
    if (mobileView !== 'chat') {
      setMobileView('chat');
    }
  };

  const handleShowAllMessages = () => {
    if (activeContact) {
      loadContactConversation(activeContact.id);
      setMobileView('chat');
    }
  };

  // Get conversation stats for UI
  const conversationStats = activeContactConversation ? {
    perluDibalas: activeContactConversation.ticketEpisodes.filter(ep => ep.category === 'PERLU_DIBALAS').length,
    otomatis: activeContactConversation.ticketEpisodes.filter(ep => ep.category === 'OTOMATIS').length,
    selesai: activeContactConversation.ticketEpisodes.filter(ep => ep.category === 'SELESAI').length,
  } : { perluDibalas: 1, otomatis: 0, selesai: 1 };

  // Enhanced props for ChatArea
  const enhancedChatAreaProps = {
    onReact: handleReact,
    onEdit: handleEdit,
    onReply: handleReply,
    onForward: handleForward,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onSearch: handleSearch,
    onClearSearch: clearSearch,
    searchQuery,
    searchResults,
    isSearching,
    replyToMessage,
    setReplyToMessage,
    editingMessage,
    setEditingMessage
  };

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="flex flex-row h-full w-full">
      {/* Sidebar kiri */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        <ContactSidebar />
      </div>
      {/* Chat area */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        {children}
      </div>
      {/* Info panel (push drawer) */}
      <div
        className={cn(
          "transition-all duration-300 bg-white border-l border-gray-200 shadow-lg z-30 overflow-hidden flex-shrink-0",
          rightSidebarVisible ? "w-80" : "w-0"
        )}
      >
        {rightSidebarVisible && <InfoPanel />}
      </div>
    </div>
  );
} 