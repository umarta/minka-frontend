'use client';

import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '@/lib/stores/chat';
import { Conversation } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';

export function ContactSidebar() {
  const { 
    conversations, 
    chatGroups, 
    loadConversations, 
    selectConversation,
    activeContact,
    searchQuery,
    isLoadingConversations,
    toggleSidebar,
    sidebarCollapsed
  } = useChatStore();

  const [selectedTab, setSelectedTab] = useState<'needReply' | 'automated' | 'completed'>('needReply');
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const getTabConversations = () => {
    switch (selectedTab) {
      case 'needReply':
        return [
          ...chatGroups.needReply.urgent,
          ...chatGroups.needReply.normal,
          ...chatGroups.needReply.overdue
        ];
      case 'automated':
        return [
          ...chatGroups.automated.botHandled,
          ...chatGroups.automated.autoReply,
          ...chatGroups.automated.workflow
        ];
      case 'completed':
        return [
          ...chatGroups.completed.resolved,
          ...chatGroups.completed.closed,
          ...chatGroups.completed.archived
        ];
      default:
        return conversations;
    }
  };

  const filteredConversations = getTabConversations().filter(conv =>
    conv.contact.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
    conv.contact.phone.includes(localSearchQuery)
  );

  const renderConversation = (conversation: Conversation) => {
    const isActive = activeContact?.id === conversation.contact.id;
    
    return (
      <div
        key={conversation.contact.id}
        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
          isActive ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
        }`}
        onClick={() => selectConversation(conversation.contact)}
      >
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={conversation.contact.avatar_url} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
              {getInitials(conversation.contact.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {conversation.contact.name}
              </h4>
              <span className="text-xs text-gray-500">
                {formatTime(conversation.last_activity)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate max-w-[200px]">
                {conversation.last_message ? (
                  <>
                    {conversation.last_message.direction === 'outgoing' && '✓ '}
                    {conversation.last_message.content || 'Media'}
                  </>
                ) : (
                  'Belum ada pesan'
                )}
              </p>
              
              {conversation.unread_count > 0 && (
                <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </Badge>
              )}
            </div>
          </div>
        )}

        {sidebarCollapsed && conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1">
            <Badge className="bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  // Collapsed sidebar view
  if (sidebarCollapsed) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 w-16">
        {/* Collapsed Header */}
        <div className="p-3 border-b border-gray-200 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleSidebar}
            title="Expand sidebar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Collapsed Tab Indicators */}
        <div className="flex flex-col border-b border-gray-200">
          <button
            className={`p-3 text-xs font-medium transition-colors relative ${
              selectedTab === 'needReply'
                ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('needReply')}
            title="Perlu Dibalas"
          >
            PR
            {(chatGroups.needReply.urgent.length + 
              chatGroups.needReply.normal.length + 
              chatGroups.needReply.overdue.length) > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {chatGroups.needReply.urgent.length + 
                 chatGroups.needReply.normal.length + 
                 chatGroups.needReply.overdue.length}
              </div>
            )}
          </button>
          
          <button
            className={`p-3 text-xs font-medium transition-colors ${
              selectedTab === 'automated'
                ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('automated')}
            title="Otomatis"
          >
            OT
          </button>
          
          <button
            className={`p-3 text-xs font-medium transition-colors ${
              selectedTab === 'completed'
                ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('completed')}
            title="Selesai"
          >
            SL
          </button>
        </div>

        {/* Collapsed Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center p-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-1 p-1">
              {filteredConversations.slice(0, 10).map(renderConversation)}
            </div>
          ) : (
            <div className="p-3 text-center">
              <MessageCircle className="h-6 w-6 mx-auto text-gray-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleSidebar}
              title="Collapse sidebar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari kontak..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            selectedTab === 'needReply'
              ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setSelectedTab('needReply')}
        >
          Perlu Dibalas
          {(chatGroups.needReply.urgent.length + 
            chatGroups.needReply.normal.length + 
            chatGroups.needReply.overdue.length) > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">
              {chatGroups.needReply.urgent.length + 
               chatGroups.needReply.normal.length + 
               chatGroups.needReply.overdue.length}
            </Badge>
          )}
        </button>
        
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            selectedTab === 'automated'
              ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setSelectedTab('automated')}
        >
          Otomatis
        </button>
        
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            selectedTab === 'completed'
              ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setSelectedTab('completed')}
        >
          Selesai
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(renderConversation)
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <MessageCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm">
              {localSearchQuery ? 'Tidak ada kontak yang ditemukan' : 'Belum ada percakapan'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 