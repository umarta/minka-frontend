'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (!users || users.length === 0) return null;

  const getUsersText = () => {
    if (users.length === 1) return `${users[0]} is typing`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing`;
    return `${users[0]} and ${users.length - 1} others are typing`;
  };

  return (
    <div className="flex gap-2 mt-3">
      <div className="max-w-[70%] rounded-lg px-3 py-2 bg-white border border-gray-200 relative">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{getUsersText()}</span>
          <div className="flex gap-1">
            <div className={cn(
              "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
              "animation-delay-0"
            )} />
            <div className={cn(
              "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
              "animation-delay-150"
            )} />
            <div className={cn(
              "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
              "animation-delay-300"
            )} />
          </div>
        </div>
        
        {/* Message Tail */}
        <div className="absolute top-0 left-0 -translate-x-1 w-0 h-0 border-r-8 border-r-white border-t-8 border-t-transparent" />
      </div>
    </div>
  );
} 