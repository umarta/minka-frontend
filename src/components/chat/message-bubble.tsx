'use client';

import { useState, useRef } from 'react';
import { 
  Check, CheckCheck, Clock, Download, Play, Pause, Edit, Reply, Forward, 
  Copy, Star, Trash2, MoreVertical, MapPin, CreditCard, Link as LinkIcon,
  FileText, Image as ImageIcon, Video, Volume2, Heart, ThumbsUp, Smile,
  Eye, Users, ExternalLink, Navigation, Phone, Clock3, FileImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Message, MessageReaction } from '@/types';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

export function MessageBubble({ 
  message, 
  showTimestamp = false, 
  isGrouped = false,
  onReact,
  onEdit,
  onReply,
  onForward,
  onDelete,
  onCopy
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isOutgoing = message.direction === 'outgoing';
  const isSystem = message.message_type === 'system';

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
          <p className="text-sm text-gray-600 text-center">{message.content}</p>
          <span className="text-xs text-gray-400">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
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

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (type?.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (type?.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type?.startsWith('audio/')) return <Volume2 className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, users: [] };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_name);
      return acc;
    }, {} as Record<string, { count: number; users: string[] }>);

    return (
      <div className="flex gap-1 mt-2 flex-wrap">
        {Object.entries(groupedReactions).map(([emoji, data]) => (
          <button
            key={emoji}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
            onClick={() => onReact?.(message.id, emoji)}
            title={`${data.users.join(', ')} reacted with ${emoji}`}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{data.count}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderReadReceipts = () => {
    if (!isOutgoing || !message.read_by || message.read_by.length === 0) return null;

    return (
      <div className="flex -space-x-1 mt-1">
        {message.read_by.slice(0, 3).map((receipt) => (
          <Avatar key={receipt.id} className="h-4 w-4 border border-white">
            <AvatarImage src={receipt.user_avatar} />
            <AvatarFallback className="text-xs">
              {receipt.user_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
        {message.read_by.length > 3 && (
          <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600">
            +{message.read_by.length - 3}
          </div>
        )}
      </div>
    );
  };

  const renderAudioWaveform = () => {
    if (!message.waveform) return null;

    return (
      <div className="flex items-center gap-1 h-8">
        {message.waveform.map((height, index) => (
          <div
            key={index}
            className={cn(
              "w-1 bg-green-500 rounded-full transition-all",
              isPlaying && index < 10 ? "bg-green-600" : "bg-green-300"
            )}
            style={{ height: `${Math.max(4, height * 24)}px` }}
          />
        ))}
      </div>
    );
  };

  const renderMediaContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <div>
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.link_preview && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden max-w-sm">
                {message.link_preview.image && (
                  <img 
                    src={message.link_preview.image} 
                    alt="Link preview"
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {message.link_preview.title}
                  </h4>
                  {message.link_preview.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {message.link_preview.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon className="h-3 w-3" />
                    <span className="text-xs text-gray-500">
                      {message.link_preview.domain}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[250px] p-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0"
              onClick={handleAudioPlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1">
              {message.waveform ? (
                renderAudioWaveform()
              ) : (
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-green-500 rounded-full w-1/3 transition-all"></div>
                </div>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:34'}
                </span>
                <Volume2 className="h-3 w-3 text-gray-400" />
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              src={message.media_url || message.file_url}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                // Update duration if not provided
              }}
            />
          </div>
        );

      case 'image':
        return (
          <div className="max-w-sm">
            <div className="relative group">
              <img
                src={message.media_url || message.file_url}
                alt="Image"
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  window.open(message.media_url || message.file_url, '_blank');
                }}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(message.media_url || message.file_url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 text-white" />
                </Button>
              </div>
              {message.resolution && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                    {message.resolution}
                  </Badge>
                </div>
              )}
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
            {(message.file_size || message.media_size) && (
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(message.file_size || message.media_size || 0)}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-sm">
            <div className="relative">
              <video
                src={message.media_url || message.file_url}
                className="rounded-lg max-w-full h-auto"
                controls
                poster={message.thumbnail_url}
              />
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
                {message.duration && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
                  </Badge>
                )}
              </div>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              {message.resolution && <span>{message.resolution}</span>}
              {(message.file_size || message.media_size) && (
                <span>{formatFileSize(message.file_size || message.media_size || 0)}</span>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg min-w-[280px] max-w-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getFileTypeIcon(message.file_type || message.media_type || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {message.file_name || message.media_filename || 'Document'}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {message.file_type?.toUpperCase() || 
                   message.media_filename?.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
                {(message.file_size || message.media_size) && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(message.file_size || message.media_size || 0)}</span>
                  </>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const url = message.file_url || message.media_url;
                if (url) {
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = message.file_name || message.media_filename || 'document';
                  a.click();
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'location':
        return (
          <div className="max-w-sm">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              {message.location_lat && message.location_lng ? (
                <div className="w-full h-full bg-green-50 flex flex-col items-center justify-center">
                  <MapPin className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-800">Location Shared</p>
                  <p className="text-xs text-green-600">
                    {message.location_lat.toFixed(6)}, {message.location_lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <MapPin className="h-8 w-8 mb-2" />
                  <span className="text-sm">Location</span>
                </div>
              )}
            </div>
            
            {message.location_address && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{message.location_address}</p>
                {message.business_name && (
                  <p className="text-sm text-gray-600 mt-1">{message.business_name}</p>
                )}
                {message.operating_hours && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock3 className="h-3 w-3" />
                    <span>{message.operating_hours}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Navigation className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            )}
            
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="max-w-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Payment Invoice</span>
              </div>
              <div className="text-2xl font-bold">
                {message.payment_currency} {message.payment_amount?.toLocaleString()}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Invoice ID</span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {message.payment_invoice_id}
                </code>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Status</span>
                <Badge 
                  variant={message.payment_status === 'paid' ? 'default' : 'secondary'}
                  className={cn(
                    message.payment_status === 'paid' && 'bg-green-500',
                    message.payment_status === 'pending' && 'bg-yellow-500',
                    message.payment_status === 'failed' && 'bg-red-500'
                  )}
                >
                  {message.payment_status?.toUpperCase()}
                </Badge>
              </div>
              {message.payment_description && (
                <p className="text-sm text-gray-700 mb-3">{message.payment_description}</p>
              )}
              {message.payment_status === 'pending' && (
                <Button className="w-full" size="sm">
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="max-w-sm border border-gray-200 rounded-lg overflow-hidden">
            {message.link_preview?.image && (
              <img 
                src={message.link_preview.image} 
                alt="Link preview"
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                {message.link_preview?.title || 'Link Preview'}
              </h4>
              {message.link_preview?.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                  {message.link_preview.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {message.link_preview?.favicon && (
                    <img 
                      src={message.link_preview.favicon} 
                      alt="Favicon"
                      className="h-4 w-4"
                    />
                  )}
                  <span className="text-xs text-gray-500">
                    {message.link_preview?.domain}
                  </span>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={message.content} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  const quickReactions = ['👍', '❤️', '😊', '😮', '😢', '😡'];

  return (
    <div className={cn(
      "flex w-full group",
      isOutgoing ? "justify-end" : "justify-start",
      isGrouped ? "mb-0.5" : "mb-3"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-lg px-3 py-2 relative",
        isOutgoing 
          ? "bg-green-500 text-white rounded-br-sm" 
          : "bg-white border border-gray-200 rounded-bl-sm shadow-sm",
        isGrouped && isOutgoing && "rounded-br-lg",
        isGrouped && !isOutgoing && "rounded-bl-lg"
      )}>
        {/* Reply indicator */}
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

        {/* Forwarded indicator */}
        {message.forwarded_from && (
          <div className={cn(
            "text-xs italic mb-2 flex items-center gap-1",
            isOutgoing ? "text-green-100" : "text-gray-500"
          )}>
            <Forward className="h-3 w-3" />
            Forwarded
          </div>
        )}

        {/* Message Content */}
        <div className={cn(isOutgoing ? "text-white" : "text-gray-900")}>
          {renderMediaContent()}
        </div>

        {/* Edited indicator */}
        {message.edited_at && (
          <span className={cn(
            "text-xs italic mt-1 block",
            isOutgoing ? "text-green-100" : "text-gray-500"
          )}>
            edited
          </span>
        )}

        {/* Reactions */}
        {renderReactions()}

        {/* Message Info */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs",
              isOutgoing ? "text-green-100" : "text-gray-500"
            )}>
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {message.edited_at && (
              <Edit className="h-3 w-3 opacity-50" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            {renderReadReceipts()}
          </div>
        </div>

        {/* Message Actions - Visible on Hover */}
        <div className={cn(
          "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOutgoing ? "-left-10" : "-right-10"
        )}>
          <div className="flex items-center gap-1">
            {/* Quick React */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white shadow-sm"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <Smile className="h-3 w-3" />
              </Button>
              
              {showReactions && (
                <div 
                  className="absolute bottom-8 left-0 bg-white shadow-lg rounded-lg p-2 flex gap-1 z-10"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      className="hover:bg-gray-100 rounded p-1 text-lg"
                      onClick={() => {
                        onReact?.(message.id, emoji);
                        setShowReactions(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white shadow-sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={isOutgoing ? "left" : "right"} align="start">
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onForward?.(message)}>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy?.(message.content)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="h-4 w-4 mr-2" />
                  Star
                </DropdownMenuItem>
                {message.can_edit && isOutgoing && (
                  <DropdownMenuItem onClick={() => onEdit?.(message.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {message.can_delete && (
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onDelete?.(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
} 