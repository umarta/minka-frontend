'use client';

import { ArrowLeft, Phone, VideoIcon, MoreVertical, Archive, UserCheck, MessageSquare, Settings, User, Ban, Trash2, Info, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatStore } from '@/lib/stores/chat';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useCallback, useEffect } from 'react';
import { TakeoverStatus } from './takeover-status';

export function ChatHeader() {
  const { 
    activeContact, 
    activeConversation, 
    toggleRightSidebar,
    loadContactMessages,
    searchQuery,
    searchResults,
    isSearching,
    clearSearch
  } = useChatStore();
  
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const handleSearch = useCallback(async (query: string) => {
    console.log('🔍 Search triggered with query:', query);
    setLocalSearchQuery(query);
    if (query.trim() && activeContact) {
      console.log('🔍 Loading contact messages with search query:', query, 'for contact:', activeContact.id);
      await loadContactMessages(activeContact.id, 1, query);
    } else if (!query.trim()) {
      console.log('🔍 Clearing search');
      clearSearch();
    }
  }, [activeContact, loadContactMessages, clearSearch]);

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    clearSearch();
  };

  // Clear local search when search is cleared from store
  useEffect(() => {
    if (!searchQuery) {
      setLocalSearchQuery('');
    }
  }, [searchQuery]);

  if (!activeContact) {
    return (
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Backoffice</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getOnlineStatus = () => {
    if (!activeContact.last_seen) return 'Belum pernah online';
    
    const lastSeen = new Date(activeContact.last_seen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'Online';
    return `Terakhir dilihat ${formatDistanceToNow(lastSeen, { addSuffix: true, locale: id })}`;
  };

  const getStatusText = () => {
    if (activeContact.is_blocked) {
      return 'Diblokir';
    } else if (activeConversation?.assigned_to) {
      return `Ditugaskan kepada ${activeConversation.assigned_to.username}`;
    } else {
      return getOnlineStatus();
    }
  };

  return (
    <div className="flex flex-col border-b border-gray-200 bg-white">
      {/* Main header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activeContact?.avatar_url} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
              {getInitials(activeContact?.name || '')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {activeContact?.name || 'Select Contact'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <VideoIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={toggleRightSidebar} title="Lihat Info Kontak">
            <Info className="h-4 w-4" />
          </Button>
          <TakeoverStatus contact={activeContact} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Lihat Profil Kontak
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Riwayat Pesan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Ban className="h-4 w-4 mr-2" />
                Blokir Kontak
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Percakapan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari pesan..."
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 h-9 text-sm"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search results indicator */}
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            {isSearching ? (
              <span>Mencari...</span>
            ) : (
              <span>
                Ditemukan {searchResults?.length || 0} pesan untuk "{searchQuery}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 