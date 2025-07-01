'use client';

import { useState, useEffect } from 'react';
import { ContactSidebar } from './contact-sidebar';
import { ChatArea } from './chat-area';
import { InfoPanel } from './info-panel';
import TicketHistoryPanel from './ticket-history-panel';
import { useChatStore } from '@/lib/stores/chat';
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

export function ChatLayout() {
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

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Enhanced Mobile Navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={mobileView === 'sidebar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileView('sidebar')}
          >
            <Users className="h-4 w-4 mr-1" />
            Kontak
          </Button>
          {activeContact && (
            <>
              <Button
                variant={mobileView === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMobileView('chat')}
                className="relative"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
                {conversationStats.perluDibalas > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {conversationStats.perluDibalas}
                  </Badge>
                )}
              </Button>
              <Button
                variant={mobileView === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMobileView('history')}
                className="relative"
              >
                <History className="h-4 w-4 mr-1" />
                Riwayat
                <Badge variant="outline" className="ml-1 text-xs">
                  {mockTicketEpisodes.length}
                </Badge>
              </Button>
              <Button
                variant={mobileView === 'info' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMobileView('info')}
              >
                <Info className="h-4 w-4 mr-1" />
                Info
              </Button>
            </>
          )}
        </div>

        {/* Enhanced Mobile Controls */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Toggle search in mobile
              if (searchQuery) {
                clearSearch();
              }
            }}
            className="shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Conversation Mode Toggle */}
          {activeContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleConversationMode}
              className="shrink-0"
            >
              {conversationMode === 'unified' ? (
                <ToggleRight className="h-4 w-4 text-blue-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Desktop Header with Search and Conversation Controls */}
      {activeContact && (
        <div className="hidden lg:flex items-center justify-between p-3 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Mode Percakapan:</span>
              <Button
                variant={conversationMode === 'unified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => conversationMode !== 'unified' && toggleConversationMode()}
                className="h-7"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Terpadu
              </Button>
              <Button
                variant={conversationMode === 'ticket-specific' ? 'default' : 'outline'}
                size="sm"
                onClick={() => conversationMode !== 'ticket-specific' && toggleConversationMode()}
                className="h-7"
              >
                <History className="h-3 w-3 mr-1" />
                Per Tiket
              </Button>
            </div>
            
            {/* Conversation Stats */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                <span className="text-orange-700">{conversationStats.perluDibalas}</span>
                <span className="text-gray-500">Perlu Dibalas</span>
              </div>
              <div className="flex items-center gap-1">
                <Bot className="h-3 w-3 text-blue-500" />
                <span className="text-blue-700">{conversationStats.otomatis}</span>
                <span className="text-gray-500">Otomatis</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-700">{conversationStats.selesai}</span>
                <span className="text-gray-500">Selesai</span>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Controls */}
          <div className="flex items-center gap-2">
            {/* Search Results Badge */}
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                {isSearching ? 'Searching...' : `${searchResults.length} results`}
              </Badge>
            )}
            
            {/* Clear Search */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}

            {/* Search Filters */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                // Toggle search filters
                console.log('🔧 Search filters toggled');
              }}
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>

            {/* Message Sort */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                // Toggle message sort
                console.log('📋 Message sort toggled');
              }}
            >
              <SortAsc className="h-3 w-3 mr-1" />
              Sort
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Contact List */}
        <div className={cn(
          "bg-white border-r transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "w-0 lg:w-16" : "w-full lg:w-80",
          mobileView === 'sidebar' ? "block" : "hidden lg:block"
        )}>
          <ContactSidebar />
        </div>

        {/* Center - Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-gray-50 min-w-0",
          mobileView === 'chat' ? "block" : activeContact ? "hidden lg:block" : "block"
        )}>
          <ChatArea {...enhancedChatAreaProps} />
        </div>

        {/* Right Sidebar - Info Panel or Ticket History */}
        {activeContact && (
          <div className={cn(
            "bg-white border-l transition-all duration-300 flex-shrink-0",
            rightSidebarVisible ? "w-full lg:w-80" : "w-0",
            (mobileView === 'info' || mobileView === 'history') ? "block" : "hidden lg:block"
          )}>
            {/* Right Panel Toggle */}
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={rightPanelMode === 'info' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanelMode('info')}
                  className="h-7"
                >
                  <Info className="h-3 w-3 mr-1" />
                  Info
                </Button>
                <Button
                  variant={rightPanelMode === 'history' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRightPanelMode('history')}
                  className="h-7"
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRightSidebar}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelMode === 'info' ? (
                <InfoPanel />
              ) : (
                <TicketHistoryPanel
                  episodes={mockTicketEpisodes}
                  onEpisodeSelect={handleEpisodeSelect}
                  onShowAllMessages={handleShowAllMessages}
                  conversationMode={conversationMode}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 