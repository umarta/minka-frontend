import React from 'react';
import { cn } from '@/lib/utils';

interface UnreadCountBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'urgent' | 'muted';
}

export const UnreadCountBadge: React.FC<UnreadCountBadgeProps> = ({
  count,
  className,
  size = 'md',
  variant = 'default'
}) => {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: 'h-4 min-w-4 text-xs px-1',
    md: 'h-5 min-w-5 text-xs px-1.5',
    lg: 'h-6 min-w-6 text-sm px-2'
  };

  const variantClasses = {
    default: 'bg-blue-500 text-white',
    urgent: 'bg-red-500 text-white animate-pulse',
    muted: 'bg-gray-400 text-white'
  };

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={`${count} unread message${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </div>
  );
};

interface UnreadCountIndicatorProps {
  count: number;
  lastMessageTime?: string;
  className?: string;
}

export const UnreadCountIndicator: React.FC<UnreadCountIndicatorProps> = ({
  count,
  lastMessageTime,
  className
}) => {
  if (count <= 0) return null;

  // Determine urgency based on time since last message
  const getVariant = () => {
    if (!lastMessageTime) return 'default';
    
    const lastMessage = new Date(lastMessageTime);
    const now = new Date();
    const minutesSince = (now.getTime() - lastMessage.getTime()) / (1000 * 60);
    
    if (minutesSince > 120) return 'urgent'; // 2+ hours
    if (minutesSince > 30) return 'default'; // 30+ minutes
    return 'default';
  };

  return (
    <UnreadCountBadge
      count={count}
      variant={getVariant()}
      className={className}
    />
  );
};

interface ConversationUnreadBadgeProps {
  conversation: {
    id: string;
    unread_count: number;
    last_activity?: string;
    status?: string;
  };
  className?: string;
}

export const ConversationUnreadBadge: React.FC<ConversationUnreadBadgeProps> = ({
  conversation,
  className
}) => {
  const { unread_count, last_activity, status } = conversation;
  
  if (unread_count <= 0) return null;

  // Don't show badge for archived conversations
  if (status === 'archived') {
    return (
      <UnreadCountBadge
        count={unread_count}
        variant="muted"
        size="sm"
        className={className}
      />
    );
  }

  return (
    <UnreadCountIndicator
      count={unread_count}
      lastMessageTime={last_activity}
      className={className}
    />
  );
};

export default UnreadCountBadge;