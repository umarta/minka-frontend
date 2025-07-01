'use client';

import { ChatHeader } from './chat-header';
import { MessagesList } from './messages-list';
import { MessageInput } from './message-input';
import { EmptyChatState } from './empty-chat-state';
import { useChatStore } from '@/lib/stores/chat';

export function ChatArea() {
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
            <MessagesList contactId={activeContact.id} />
          </div>
          <MessageInput />
        </>
      )}
    </div>
  );
} 