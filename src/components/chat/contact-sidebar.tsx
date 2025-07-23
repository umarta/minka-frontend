'use client';

import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, Clock, MoreVertical, Star, Archive, Trash2, CheckCheck, Circle, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConversationUnreadBadge } from '@/components/UnreadCountBadge';
import { LabelBadgeInline } from '@/components/LabelBadgeDisplay';
import { ConversationStatusDot } from '@/components/ConversationStatusIndicator';
import { ContactLabelManager } from '@/components/ContactLabelManager';
import { useChatStore } from '@/lib/stores/chat';
import { Conversation } from '@/types';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

  // Tambahkan log debug conversations
  console.log('ContactSidebar conversations:', conversations);

  const [selectedTab, setSelectedTab] = useState<'needReply' | 'automated' | 'completed'>('needReply');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'unread' | 'name'>('time');
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [selectedConversationForLabels, setSelectedConversationForLabels] = useState<Conversation | null>(null);

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
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Kemarin';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: id });
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const getOnlineStatus = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'recent';
    return 'offline';
  };

  const getPriorityIcon = (ticket: any, unreadCount: number) => {
    if (unreadCount > 5) return <span className="text-red-500">🔥</span>;
    if (ticket?.priority === 'high') return <span className="text-orange-500">⚡</span>;
    if (ticket?.priority === 'urgent') return <span className="text-red-500">🚨</span>;
    return null;
  };

  const getTabConversations = () => {
    let convs = [];
    switch (selectedTab) {
      case 'needReply':
        convs = [
          ...chatGroups.needReply.urgent,
          ...chatGroups.needReply.normal,
          ...chatGroups.needReply.overdue,
          ...conversations.filter(c => c.status === 'pending')
        ];
        break;
      case 'automated':
        convs = [
          ...chatGroups.automated.botHandled,
          ...chatGroups.automated.autoReply,
          ...chatGroups.automated.workflow
        ];
        break;
      case 'completed':
        convs = [
          ...chatGroups.completed.resolved,
          ...chatGroups.completed.closed,
          ...chatGroups.completed.archived
        ];
        break;
      default:
        convs = conversations;
    }

    // Apply sorting
    return convs.sort((a, b) => {
      switch (sortBy) {
        case 'unread':
          return b.unread_count - a.unread_count;
        case 'name':
          return a.contact.name.localeCompare(b.contact.name);
        case 'time':
        default:
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      }
    });
  };

  // Untuk tes, tampilkan semua
  const filteredConversations = conversations;

  console.log('Filtered conversations:', filteredConversations);

  const handleQuickAction = (e: React.MouseEvent, action: string, conversation: Conversation) => {
    e.stopPropagation();
    
    switch (action) {
      case 'contactLabel':
        setSelectedConversationForLabels(conversation);
        setLabelManagerOpen(true);
        break;
      case 'markRead':
        // TODO: Implement mark as read
        console.log('Mark as read:', conversation);
        break;
      case 'star':
        // TODO: Implement star/unstar
        console.log('Star conversation:', conversation);
        break;
      case 'archive':
        // TODO: Implement archive
        console.log('Archive conversation:', conversation);
        break;
      case 'delete':
        // TODO: Implement delete
        console.log('Delete conversation:', conversation);
        break;
      default:
        console.log(`Quick action: ${action}`, conversation);
    }
  };

  const renderConversation = (conversation: Conversation) => {
    console.log('conversation in renderConversation', conversation);
    const isActive = activeContact?.id === conversation.contact.id;
    const onlineStatus = getOnlineStatus(conversation.contact.last_seen || '');
    const priorityIcon = getPriorityIcon(conversation.active_ticket, conversation.unread_count);
    
    return (
      <div
        key={conversation.contact.id}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 group relative",
          isActive && "bg-blue-50 border-r-4 border-r-blue-500 shadow-sm"
        )}
        onClick={() => selectConversation(conversation.contact)}
      >
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={conversation.contact.avatar_url} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
              {getInitials(conversation.contact.name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Online indicator */}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            onlineStatus === 'online' && "bg-green-500",
            onlineStatus === 'recent' && "bg-yellow-500",
            onlineStatus === 'offline' && "bg-gray-400"
          )} />
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {conversation.contact.name}
                </h4>
                {priorityIcon}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.last_activity)}
                </span>
                
                {/* Quick actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'contactLabel', conversation)}>
                      <Tag className="h-4 w-4 mr-2" />
                      Contact Label
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'markRead', conversation)}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Tandai Dibaca
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'star', conversation)}>
                      <Star className="h-4 w-4 mr-2" />
                      Beri Bintang
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'archive', conversation)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arsipkan
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleQuickAction(e, 'delete', conversation)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <p className="text-sm text-gray-600 truncate">
                  {conversation.last_message ? (
                    <>
                      {conversation.last_message.direction === 'outgoing' && (
                        <span className="text-blue-500 mr-1">✓</span>
                      )}
                      {conversation.last_message.content || (
                        <span className="italic text-gray-400">Media</span>
                      )}
                    </>
                  ) : (
                    <span className="italic text-gray-400">Belum ada pesan</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <ConversationUnreadBadge conversation={conversation} />
                
                {/* Status indicators */}
                <ConversationStatusDot status={conversation.status} />
                {conversation.active_ticket?.priority === 'urgent' && (
                  <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                )}
                {conversation.assigned_to && (
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium">
                      {conversation.assigned_to.full_name[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Labels display */}
            {conversation.labels && conversation.labels.length > 0 && (
              <div className="mt-1">
                <LabelBadgeInline labels={conversation.labels} maxVisible={3} />
              </div>
            )}
          </div>
        )}

        {sidebarCollapsed && conversation.unread_count > 0 && (
          <div className="absolute -top-1 -right-1">
            <ConversationUnreadBadge conversation={conversation} className="h-4 min-w-4 text-xs" />
          </div>
        )}
      </div>
    );
  };

  // Get tab counts
  const getTabCounts = () => ({
    needReply: chatGroups.needReply.urgent.length + 
               chatGroups.needReply.normal.length + 
               chatGroups.needReply.overdue.length,
    automated: chatGroups.automated.botHandled.length + 
               chatGroups.automated.autoReply.length + 
               chatGroups.automated.workflow.length,
    completed: chatGroups.completed.resolved.length + 
               chatGroups.completed.closed.length + 
               chatGroups.completed.archived.length
  });

  const tabCounts = getTabCounts();

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
            className="h-8 w-8 p-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Collapsed Tab Indicators */}
        <div className="flex flex-col border-b border-gray-200">
          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === 'needReply'
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setSelectedTab('needReply')}
            title="Perlu Dibalas"
          >
            PR
            {tabCounts.needReply > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.needReply > 99 ? '99+' : tabCounts.needReply}
              </div>
            )}
          </button>
          
          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === 'automated'
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setSelectedTab('automated')}
            title="Otomatis"
          >
            OT
            {tabCounts.automated > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.automated > 99 ? '99+' : tabCounts.automated}
              </div>
            )}
          </button>
          
          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === 'completed'
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setSelectedTab('completed')}
            title="Selesai"
          >
            SL
            {tabCounts.completed > 0 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.completed > 99 ? '99+' : tabCounts.completed}
              </div>
            )}
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

  // FULL SIDEBAR
  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-80 max-w-xs min-w-[18rem]">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Percakapan</h2>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Urutkan">
                <Clock className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('time')}>
                <Clock className="h-4 w-4 mr-2" />
                Waktu Terbaru
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('unread')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Belum Dibaca
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                <Phone className="h-4 w-4 mr-2" />
                Nama A-Z
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      </header>
      {/* Search */}
      <div className="p-4 pb-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari kontak atau pesan..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {/* Tabs */}
      <nav className="flex border-b border-gray-200 bg-white">
        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === 'needReply'
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setSelectedTab('needReply')}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Perlu Dibalas</span>
            {tabCounts.needReply > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {tabCounts.needReply > 99 ? '99+' : tabCounts.needReply}
              </Badge>
            )}
          </div>
        </button>
        
        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === 'automated'
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setSelectedTab('automated')}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Otomatis</span>
            {tabCounts.automated > 0 && (
              <Badge className="bg-blue-500 text-white text-xs">
                {tabCounts.automated > 99 ? '99+' : tabCounts.automated}
              </Badge>
            )}
          </div>
        </button>
        
        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === 'completed'
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setSelectedTab('completed')}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Selesai</span>
            {tabCounts.completed > 0 && (
              <Badge className="bg-green-500 text-white text-xs">
                {tabCounts.completed > 99 ? '99+' : tabCounts.completed}
              </Badge>
            )}
          </div>
        </button>
      </nav>
      {/* Conversations List */}
      <section className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
        {isLoadingConversations ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm text-gray-500">Memuat percakapan...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map(renderConversation)}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">
              {localSearchQuery ? 'Tidak ada hasil' : 'Belum ada percakapan'}
            </h3>
            <p className="text-gray-500 text-sm">
              {localSearchQuery 
                ? 'Coba kata kunci lain atau hapus filter pencarian'
                : 'Percakapan baru akan muncul di sini ketika ada pesan masuk'
              }
            </p>
            {localSearchQuery && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setLocalSearchQuery('')}
              >
                Hapus Pencarian
              </Button>
            )}
          </div>
        )}
      </section>
      
      {/* Contact Label Manager Modal */}
       {labelManagerOpen && selectedConversationForLabels && (
         <ContactLabelManager
           contactId={selectedConversationForLabels.contact.id.toString()}
           contactName={selectedConversationForLabels.contact.name}
           isOpen={labelManagerOpen}
           onClose={() => {
             setLabelManagerOpen(false);
             setSelectedConversationForLabels(null);
           }}
         />
       )}
    </aside>
  );
}