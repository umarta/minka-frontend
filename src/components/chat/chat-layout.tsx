'use client';

import { useState, useEffect } from 'react';
import { ContactSidebar } from './contact-sidebar';
import { ChatArea } from './chat-area';
import { InfoPanel } from './info-panel';
import TicketHistoryPanel from './ticket-history-panel';
import { useChatStore } from '@/lib/stores/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  MessageSquare, 
  History, 
  ToggleLeft, 
  ToggleRight,
  Users,
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatLayout() {
  const { 
    activeContact, 
    rightSidebarVisible, 
    toggleRightSidebar,
    sidebarCollapsed,
    toggleSidebar,
    loadConversations,
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

      {/* Desktop Header with Conversation Controls */}
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
              </div>
              <div className="flex items-center gap-1">
                <Bot className="h-3 w-3 text-blue-500" />
                <span className="text-blue-700">{conversationStats.otomatis}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-700">{conversationStats.selesai}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={rightPanelMode === 'history' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setRightPanelMode('history');
                if (!rightSidebarVisible) toggleRightSidebar();
              }}
              className="h-7"
            >
              <History className="h-3 w-3 mr-1" />
              Riwayat
            </Button>
            <Button
              variant={rightPanelMode === 'info' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setRightPanelMode('info');
                if (!rightSidebarVisible) toggleRightSidebar();
              }}
              className="h-7"
            >
              <Info className="h-3 w-3 mr-1" />
              Info
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Contact Sidebar */}
        <div className={cn(
          "flex-shrink-0 bg-white border-r border-gray-200",
          mobileView === 'sidebar' ? "block" : "hidden lg:block",
          sidebarCollapsed ? "w-16" : "w-80"
        )}>
          <ContactSidebar />
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 min-w-0",
          mobileView === 'chat' ? "block" : "hidden lg:block"
        )}>
          <ChatArea />
        </div>

        {/* Right Panel - Info or History */}
        {rightSidebarVisible && activeContact && (
          <div className={cn(
            "flex-shrink-0 border-l border-gray-200 bg-gray-50 w-80",
            (mobileView === 'info' || mobileView === 'history') ? "block" : "hidden lg:block"
          )}>
            {rightPanelMode === 'history' || mobileView === 'history' ? (
              <TicketHistoryPanel
                contactId={activeContact.id}
                episodes={mockTicketEpisodes}
                currentTicketId={undefined} // Will be managed by store
                onEpisodeSelect={handleEpisodeSelect}
                onShowAllMessages={handleShowAllMessages}
              />
            ) : (
              <InfoPanel />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 