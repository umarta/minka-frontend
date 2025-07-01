'use client';

import { ChatHeader } from './chat-header';
import { MessagesList } from './messages-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';
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

  return (
    <div className="flex flex-col h-full w-full">
      {!activeContact ? (
        <div className="flex-1 h-full">
          <EmptyChatState />
        </div>
      ) : (
        <>
          <ChatHeader />
          <div className="flex-1 overflow-hidden">
            <MessagesList 
              contactId={activeContact.id}
              onReact={props.onReact}
              onEdit={props.onEdit}
              onReply={props.onReply}
              onForward={props.onForward}
              onDelete={props.onDelete}
              onCopy={props.onCopy}
              searchResults={props.searchResults}
              isSearching={props.isSearching}
              searchQuery={props.searchQuery}
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