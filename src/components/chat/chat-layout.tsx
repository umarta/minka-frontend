'use client';

import { useState, useEffect } from 'react';
import { ContactSidebar } from './contact-sidebar';
import { ChatArea } from './chat-area';
import { InfoPanel } from './info-panel';
import { useChatStore } from '@/lib/stores/chat';
import { Button } from '@/components/ui/button';
import { Info, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatLayout() {
  const { 
    activeContact, 
    rightSidebarVisible, 
    toggleRightSidebar,
    sidebarCollapsed,
    toggleSidebar,
    loadConversations
  } = useChatStore();

  const [mobileView, setMobileView] = useState<'sidebar' | 'chat' | 'info'>('sidebar');

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Mobile navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant={mobileView === 'sidebar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMobileView('sidebar')}
          >
            Contacts
          </Button>
          {activeContact && (
            <>
              <Button
                variant={mobileView === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMobileView('chat')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
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
      </div>

      {/* Main Chat Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Contact Sidebar */}
        <div className={cn(
          "flex-shrink-0 bg-white border-r border-gray-200",
          sidebarCollapsed ? "w-16" : "w-80"
        )}>
          <ContactSidebar />
        </div>

        {/* Chat Area - Always Visible */}
        <div className="flex-1 min-w-0">
          <ChatArea />
        </div>

        {/* Info Panel */}
        {rightSidebarVisible && activeContact && (
          <div className="flex-shrink-0 border-l border-gray-200 bg-gray-50 w-80">
            <InfoPanel />
          </div>
        )}
      </div>
    </div>
  );
} 