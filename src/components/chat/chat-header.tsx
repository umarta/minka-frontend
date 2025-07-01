'use client';

import { ArrowLeft, Phone, VideoIcon, MoreVertical, Archive, UserCheck, MessageSquare, Settings, User, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

export function ChatHeader() {
  const { activeContact, activeConversation } = useChatStore();

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
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
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
  );
} 