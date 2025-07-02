"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Bot,
  ChevronRight,
  Users,
  History,
  Phone,
  MessageSquare,
  Search,
  MoreVertical,
  Star,
  Archive,
  CheckCheck,
  Zap,
  Flame,
  Menu,
  X,
  Settings,
  Home,
  BarChart3,
  Headphones,
  FileText,
  User,
  Send,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  Download,
  Eye,
  Reply,
  Forward,
  Copy,
  Trash2,
  Heart,
  ThumbsUp,
  Laugh,
  FileImage,
  FileVideo,
  FileAudio,
  Image,
  Play,
  Pause,
  Volume2,
  Edit3,
  Save,
  RotateCcw,
  ChevronDown,
  Filter,
  SortDesc,
  Loader2,
  Video,
  MapPin,
  Calendar,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import real data from stores and API
import { useChatStore } from '@/lib/stores/chat';
import { useAuthStore } from '@/lib/stores/auth';
import { Contact, Message, Ticket, Label, QuickReplyTemplate } from '@/types';

// Demo Labels (will be replaced with real labels from API)
const demoLabels = [
  { id: 1, name: "Belum Dibalas", color: "bg-red-500", textColor: "text-white" },
  { id: 2, name: "Prioritas", color: "bg-orange-500", textColor: "text-white" },
  { id: 3, name: "Follow Up", color: "bg-yellow-500", textColor: "text-white" },
  { id: 4, name: "Komplain", color: "bg-red-600", textColor: "text-white" },
  { id: 5, name: "Closing", color: "bg-green-500", textColor: "text-white" },
  { id: 6, name: "Prospek", color: "bg-blue-500", textColor: "text-white" },
  { id: 7, name: "VIP", color: "bg-purple-500", textColor: "text-white" },
  { id: 8, name: "Selesai", color: "bg-gray-500", textColor: "text-white" }
];

export default function RealChatPage() {
  // Real data from stores
  const { 
    conversations, 
    chatGroups, 
    activeContact, 
    activeConversation, 
    messages, 
    isLoadingConversations, 
    isLoadingMessages, 
    isSendingMessage, 
    error,
    loadConversations, 
    selectConversation, 
    sendMessage, 
    markMessagesAsRead,
    loadQuickReplyTemplates,
    quickReplyTemplates
  } = useChatStore();

  const { user, isAuthenticated } = useAuthStore();

  // Local state
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<'needReply' | 'automated' | 'completed'>('needReply');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'unread' | 'name'>('time');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationMode, setConversationMode] = useState<'unified' | 'perTicket'>('unified');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContactForm, setEditContactForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '1990-01-01',
    gender: '',
    businessName: '',
    jobPosition: '',
    email: ''
  });
  const [messageExpiryTime, setMessageExpiryTime] = useState<Date | null>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadQuickReplyTemplates();
    }
  }, [isAuthenticated, loadConversations, loadQuickReplyTemplates]);

  // Update countdown timer
  const updateTimeRemaining = () => {
    if (!messageExpiryTime) return;
    
    const now = new Date();
    const diff = messageExpiryTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Expired');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(updateTimeRemaining, 1000);
    updateTimeRemaining();
    
    return () => clearInterval(timer);
  }, [messageExpiryTime]);

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
      } else {
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      }
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

  const getPriorityIcon = (priority: string, unreadCount: number) => {
    if (unreadCount > 5) return <Flame className="h-4 w-4 text-red-500" />;
    if (priority === 'high') return <Zap className="h-4 w-4 text-orange-500" />;
    if (priority === 'urgent') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  // Get contacts based on selected tab using real data
  const getTabContacts = () => {
    let contacts = conversations;
    
    // Filter by tab category
    switch (selectedTab) {
      case 'needReply':
        contacts = conversations.filter(c => c.status === 'active' && (c.unread_count || 0) > 0);
        break;
      case 'automated':
        contacts = conversations.filter(c => c.status === 'pending');
        break;
      case 'completed':
        contacts = conversations.filter(c => c.status === 'resolved' || c.status === 'archived');
        break;
      default:
        contacts = conversations;
    }

    // Sort contacts
    return contacts.sort((a, b) => {
      switch (sortBy) {
        case 'unread':
          return (b.unread_count || 0) - (a.unread_count || 0);
        case 'name':
          return a.contact.name.localeCompare(b.contact.name);
        case 'time':
        default:
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      }
    });
  };

  const filteredContacts = getTabContacts().filter(conversation =>
    conversation.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.contact.phone.includes(searchQuery) ||
    (conversation.last_message?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickAction = (action: string, conversation: any) => {
    console.log(`Quick action: ${action}`, conversation);
  };

  // Get current messages from store
  const currentMessages = activeConversation ? (messages[activeConversation.ticket?.id?.toString() || ''] || []) : [];
  
  // Get messages based on conversation mode and selected ticket
  const getDisplayMessages = () => {
    if (!activeConversation) return [];
    
    const allContactMessages = currentMessages;
    
    if (conversationMode === 'unified') {
      return allContactMessages;
    } else {
      if (selectedTicketId) {
        return allContactMessages.filter((msg: any) => msg.ticket_id === selectedTicketId);
      }
      return allContactMessages;
    }
  };

  const getMessageCount = () => {
    return getDisplayMessages().length;
  };

  const handleTicketClick = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setConversationMode('perTicket');
  };

  const handleViewAllMessages = () => {
    setSelectedTicketId(null);
    setConversationMode('unified');
  };

  const getTabCounts = () => ({
    needReply: conversations.filter(c => c.status === 'active' && (c.unread_count || 0) > 0).length,
    automated: conversations.filter(c => c.status === 'pending').length,
    completed: conversations.filter(c => c.status === 'resolved' || c.status === 'archived').length
  });

  // Handle contact selection
  const handleContactSelect = (conversation: any) => {
    setSelectedContactId(conversation.contact.id);
    selectConversation(conversation.contact);
  };

  // Handle message sending
  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !content.trim()) return;
    
    try {
      await sendMessage({
        contact_id: activeConversation.contact.id,
        session_id: activeConversation.ticket?.id?.toString() || '',
        content: content,
        message_type: 'text'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Loading state
  if (isLoadingConversations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Real Chat - API Integration</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {conversations.length} conversations
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-80"
        )}>
          {!sidebarCollapsed && (
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-4">
                {Object.entries(getTabCounts()).map(([tab, count]) => (
                  <Button
                    key={tab}
                    variant={selectedTab === tab ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedTab(tab as any)}
                    className="flex-1"
                  >
                    {tab === 'needReply' && <AlertCircle className="h-4 w-4 mr-1" />}
                    {tab === 'automated' && <Bot className="h-4 w-4 mr-1" />}
                    {tab === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {count}
                  </Button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2 mb-4">
                <SortDesc className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="time">Latest</option>
                  <option value="unread">Unread</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredContacts.map((conversation) => (
                <div
                  key={conversation.contact.id}
                  className={cn(
                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedContactId === conversation.contact.id && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => handleContactSelect(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.contact.avatar_url} />
                      <AvatarFallback>
                        {getInitials(conversation.contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contact.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_activity)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.contact.phone}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-600 truncate flex-1">
                          {conversation.last_message?.content || 'No messages'}
                        </p>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activeContact?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(activeContact?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-sm font-medium text-gray-900">
                        {activeContact?.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {activeContact?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Block Contact</DropdownMenuItem>
                        <DropdownMenuItem>Delete Chat</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : getDisplayMessages().length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  </div>
                ) : (
                  getDisplayMessages().map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.direction === 'outgoing' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                          message.direction === 'outgoing'
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          message.direction === 'outgoing' ? "text-blue-100" : "text-gray-500"
                        )}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
                      if (input) {
                        handleSendMessage(input.value);
                        input.value = '';
                      }
                    }}
                    disabled={isSendingMessage}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a contact to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 