'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, Image, FileText, Smile, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatStore } from '@/lib/stores/chat';
import { MessageType } from '@/types';

export function MessageInput() {
  const { activeContact, sendMessage, isSendingMessage } = useChatStore();
  
  const [message, setMessage] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeContact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !attachmentFile) || isSendingMessage) return;

    try {
      await sendMessage({
        content: message.trim(),
        message_type: attachmentFile ? getMessageType(attachmentFile) : 'text',
        contact_id: activeContact.id,
        session_id: 'default', // TODO: Get from session store
        media_file: attachmentFile || undefined,
      });

      // Reset form
      setMessage('');
      setAttachmentFile(null);
      setAttachmentPreview(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getMessageType = (file: File): MessageType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = (file: File) => {
    setAttachmentFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Attachment Preview */}
      {attachmentFile && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {attachmentPreview ? (
              <img 
                src={attachmentPreview} 
                alt="Preview" 
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{attachmentFile.name}</p>
              <p className="text-xs text-gray-500">
                {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setAttachmentFile(null);
                setAttachmentPreview(null);
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" type="button" className="text-gray-500 hover:text-gray-700">
                <Paperclip className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-2" />
                Photo & Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
              rows={1}
            />
            
            {/* Emoji Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Send Button */}
          <Button 
            type="submit" 
            disabled={(!message.trim() && !attachmentFile) || isSendingMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Replies */}
        <div className="flex gap-2 mt-2 overflow-x-auto">
          <Button 
            variant="outline" 
            size="sm"
            type="button"
            onClick={() => setMessage('👋 Greeting')}
            className="flex-shrink-0 text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            👋 Greeting
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            type="button"
            onClick={() => setMessage('🙏 Thank you')}
            className="flex-shrink-0 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            🙏 Thank you
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            type="button"
            onClick={() => setMessage('✅ Resolved')}
            className="flex-shrink-0 text-xs border-green-200 text-green-600 hover:bg-green-50"
          >
            ✅ Resolved
          </Button>
        </div>
      </form>
    </div>
  );
} 