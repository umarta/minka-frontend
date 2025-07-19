'use client';

import { ChatHeader } from './chat-header';
import { MessagesList } from './messages-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';
import { TakeoverStatus } from './takeover-status';
import { useChatStore } from '@/lib/stores/chat';
import { Message } from '@/types';
import { useEffect } from 'react';
import { createWebSocketManager } from '@/lib/websocket';

interface ChatAreaProps {
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchQuery?: string;
  searchResults?: Message[];
  isSearching?: boolean;
  replyToMessage?: Message | null;
  setReplyToMessage?: (message: Message | null) => void;
  editingMessage?: string | null;
  setEditingMessage?: (messageId: string | null) => void;
}

export function ChatArea(props: ChatAreaProps) {
  const { activeContact } = useChatStore();

  // Prevent default browser drag and drop behavior
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners to prevent default browser behavior
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('drop', preventDefault);
    document.addEventListener('dragenter', preventDefault);
    document.addEventListener('dragleave', preventDefault);

    return () => {
      document.removeEventListener('dragover', preventDefault);
      document.removeEventListener('drop', preventDefault);
      document.removeEventListener('dragenter', preventDefault);
      document.removeEventListener('dragleave', preventDefault);
    };
  }, []);

  // Hapus atau komentari useEffect inisialisasi WebSocketManager di ChatArea
  // useEffect(() => {
  //   console.log('[WS] useEffect in ChatArea: initializing WebSocketManager');
  //   createWebSocketManager();
  // }, []);

  console.log('activeContact', activeContact);

  return (
    <div className="flex flex-col h-full min-w-0 flex-1">
      {!activeContact ? (
        <div className="flex-1 h-full">
          <EmptyChatState />
        </div>
      ) : (
        <>
          <ChatHeader />
          <div className="flex-1 overflow-hidden">
            <TakeoverStatus contact={activeContact} />
            <MessagesList 
              contactId={activeContact.id}
            />
          </div>
          <MessageInput 
            onSearch={props.onSearch}
            onClearSearch={props.onClearSearch}
            searchQuery={props.searchQuery}
          />
        </>
      )}
    </div>
  );
} 