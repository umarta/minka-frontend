'use client';

import { ChatHeader } from './chat-header';
import { MessagesList } from './messages-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';
import { TakeoverStatus } from './takeover-status';
import { useChatStore } from '@/lib/stores/chat';
import { Message } from '@/types';

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