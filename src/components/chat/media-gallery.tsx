'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Images, 
  Video, 
  Headphones, 
  FileText, 
  Search, 
  Filter,
  Download,
  ExternalLink,
  Calendar,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, MessageType } from '@/types';
import { useChatStore } from '@/lib/stores/chat';
import { formatFileSize } from '@/lib/utils/upload';

interface MediaGalleryProps {
  contactId?: string;
  trigger?: React.ReactNode;
}

type MediaFilter = 'all' | 'image' | 'video' | 'audio' | 'document';
type ViewMode = 'grid' | 'list';

export function MediaGallery({ contactId, trigger }: MediaGalleryProps) {
  const { contactMessages, activeContact } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);

  // Get contact ID from props or active contact
  const targetContactId = contactId || activeContact?.id;
  
  // Get messages for the contact
  const messages = targetContactId ? contactMessages[targetContactId] || [] : [];
  
  // Filter messages that have media
  const mediaMessages = messages.filter(message => 
    message.media_url || message.file_url || 
    ['image', 'video', 'audio', 'document'].includes(message.message_type)
  );

  // Apply filters
  const filteredMessages = mediaMessages.filter(message => {
    // Filter by media type
    if (mediaFilter !== 'all' && message.message_type !== mediaFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        message.content?.toLowerCase().includes(query) ||
        message.media_filename?.toLowerCase().includes(query) ||
        message.file_name?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const getMediaIcon = (type: MessageType) => {
    switch (type) {
      case 'image': return <Images className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getMediaCount = (type: MediaFilter) => {
    if (type === 'all') return mediaMessages.length;
    return mediaMessages.filter(m => m.message_type === type).length;
  };

  const handleDownload = (message: Message) => {
    const url = message.media_url || message.file_url;
    const filename = message.media_filename || message.file_name || 'download';
    
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const MediaCard = ({ message }: { message: Message }) => {
    const isImage = message.message_type === 'image';
    const isVideo = message.message_type === 'video';
    const mediaUrl = message.media_url || message.file_url;
    const thumbnailUrl = message.thumbnail_url || (isImage ? mediaUrl : undefined);
    const filename = message.media_filename || message.file_name || 'Unknown file';
    const fileSize = message.media_size || message.file_size;

    if (viewMode === 'list') {
      return (
        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex-shrink-0">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={filename}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                {getMediaIcon(message.message_type)}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{filename}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{new Date(message.created_at).toLocaleDateString()}</span>
              {fileSize && <span>{formatFileSize(fileSize)}</span>}
              <Badge variant="secondary" className="text-xs">
                {message.message_type}
              </Badge>
            </div>
            {message.content && (
              <p className="text-sm text-gray-600 truncate mt-1">{message.content}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMedia(message)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(message)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
        onClick={() => setSelectedMedia(message)}
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getMediaIcon(message.message_type)}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end">
          <div className="p-2 w-full transform translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-white text-xs font-medium truncate">{filename}</p>
            <div className="flex items-center justify-between mt-1">
              <Badge variant="secondary" className="text-xs">
                {message.message_type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(message);
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Video/Audio indicator */}
        {(isVideo || message.message_type === 'audio') && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
            {getMediaIcon(message.message_type)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Images className="w-4 h-4 mr-2" />
            Media Gallery
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="w-5 h-5" />
            Media Gallery
            {targetContactId && activeContact && (
              <span className="text-sm font-normal text-gray-500">
                - {activeContact.name || activeContact.phone_number}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Controls */}
        <div className="flex flex-col gap-4 border-b pb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search media files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters and View Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1">
                {(['all', 'image', 'video', 'audio', 'document'] as MediaFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={mediaFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediaFilter(filter)}
                    className="text-xs"
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {getMediaCount(filter)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Media Content */}
        <ScrollArea className="flex-1">
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Images className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No media files found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, messages]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <h3 className="font-medium text-sm text-gray-700">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {messages.length} files
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      viewMode === 'grid' 
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
                        : "space-y-2"
                    )}>
                      {messages.map((message) => (
                        <MediaCard key={message.id} message={message} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
      
      {/* Media Preview Dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedMedia.media_filename || selectedMedia.file_name || 'Media Preview'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedMedia)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="flex justify-center">
                {selectedMedia.message_type === 'image' && selectedMedia.media_url && (
                  <img 
                    src={selectedMedia.media_url} 
                    alt={selectedMedia.media_filename || 'Image'}
                    className="max-w-full max-h-96 object-contain rounded"
                  />
                )}
                
                {selectedMedia.message_type === 'video' && selectedMedia.media_url && (
                  <video 
                    src={selectedMedia.media_url} 
                    controls
                    className="max-w-full max-h-96 rounded"
                  />
                )}
                
                {selectedMedia.message_type === 'audio' && selectedMedia.media_url && (
                  <audio 
                    src={selectedMedia.media_url} 
                    controls
                    className="w-full"
                  />
                )}
                
                {selectedMedia.message_type === 'document' && (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <FileText className="w-16 h-16 text-gray-400" />
                    <p className="text-lg font-medium">{selectedMedia.file_name}</p>
                    {selectedMedia.file_size && (
                      <p className="text-sm text-gray-500">{formatFileSize(selectedMedia.file_size)}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Media Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Date</p>
                  <p className="text-gray-600">{new Date(selectedMedia.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Type</p>
                  <p className="text-gray-600">{selectedMedia.message_type}</p>
                </div>
                {(selectedMedia.media_size || selectedMedia.file_size) && (
                  <div>
                    <p className="font-medium text-gray-700">Size</p>
                    <p className="text-gray-600">{formatFileSize(selectedMedia.media_size || selectedMedia.file_size!)}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-700">Direction</p>
                  <p className="text-gray-600">{selectedMedia.direction === 'outgoing' ? 'Sent' : 'Received'}</p>
                </div>
              </div>
              
              {/* Message Content */}
              {selectedMedia.content && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Message</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedMedia.content}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
