'use client';

import { useState } from 'react';
import { Check, CheckCheck, Clock, Download, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  isGrouped?: boolean;
}

export function MessageBubble({ message, showTimestamp = false, isGrouped = false }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const isOutgoing = message.direction === 'outgoing';
  const isSystem = message.message_type === 'system';

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
          <p className="text-sm text-gray-600 text-center">{message.content}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!isOutgoing) return null;
    
    switch (message.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <span className="text-red-500 text-xs">!</span>;
      default:
        return null;
    }
  };

  const renderMediaContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="max-w-sm">
            <img
              src={message.media_url}
              alt="Image"
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // TODO: Open in full-screen viewer
                window.open(message.media_url, '_blank');
              }}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-sm">
            <div className="relative">
              <video
                src={message.media_url}
                className="rounded-lg max-w-full h-auto"
                controls
                poster={message.media_url + '?thumbnail'}
              />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  Video
                </Badge>
              </div>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <div className="h-1 bg-gray-200 rounded-full">
                <div className="h-1 bg-green-500 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">0:34</p>
            </div>
            <audio src={message.media_url} className="hidden" />
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg min-w-[250px]">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {message.media_filename?.split('.').pop()?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {message.media_filename || 'Document'}
              </p>
              <p className="text-xs text-gray-500">
                {message.media_size ? `${(message.media_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'location':
        return (
          <div className="max-w-sm">
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">📍 Location</span>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={cn(
      "flex w-full",
      isOutgoing ? "justify-end" : "justify-start",
      isGrouped ? "mb-0.5" : "mb-2"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-lg px-3 py-2 relative",
        isOutgoing 
          ? "bg-green-500 text-white rounded-br-sm" 
          : "bg-white border border-gray-200 rounded-bl-sm shadow-sm",
        isGrouped && isOutgoing && "rounded-br-lg",
        isGrouped && !isOutgoing && "rounded-bl-lg"
      )}>
        {/* Quoted Message */}
        {message.quoted_message && (
          <div className={cn(
            "border-l-4 pl-3 py-2 mb-2 rounded",
            isOutgoing ? "border-green-300 bg-green-400/20" : "border-gray-300 bg-gray-50"
          )}>
            <p className="text-xs opacity-75 mb-1">
              {message.quoted_message.direction === 'outgoing' ? 'You' : 'Customer'}
            </p>
            <p className="text-sm opacity-90 truncate">
              {message.quoted_message.content}
            </p>
          </div>
        )}

        {/* Message Content */}
        <div className={cn(isOutgoing ? "text-white" : "text-gray-900")}>
          {renderMediaContent()}
        </div>

        {/* Message Info */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn(
            "text-xs",
            isOutgoing ? "text-green-100" : "text-gray-500"
          )}>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
} 