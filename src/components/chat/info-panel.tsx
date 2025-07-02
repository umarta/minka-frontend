'use client';

import { useState } from 'react';
import { X, User, MessageSquare, Tag, StickyNote, Calendar, Phone, Mail, MapPin, CheckCircle, Clock, MessageCircle, Zap, Inbox, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/stores/chat';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function InfoPanel() {
  const {
    activeContact,
    activeContactConversation,
    ticketEpisodes,
    conversationMode,
    toggleConversationMode,
    selectTicketEpisode,
    activeTicket,
  } = useChatStore();

  if (!activeContact || !activeContactConversation) {
    console.log('DEBUG InfoPanel', { activeContact, activeContactConversation });
    if (!activeContact) return <div className="p-4">Pilih kontak terlebih dahulu</div>;
    if (!activeContactConversation) return <div className="p-4">Memuat data percakapan...</div>;
  }

  // Group tickets by category
  const episodes = ticketEpisodes[activeContact.id] || [];
  const activeTickets = episodes.filter(ep => ep.category === 'PERLU_DIBALAS' || ep.status === 'OPEN');
  const selesaiTickets = episodes.filter(ep => ep.category === 'SELESAI' || ep.status === 'CLOSED');
  const otomatisTickets = episodes.filter(ep => ep.category === 'OTOMATIS');

  const getStatusBadge = (ep: any) => {
    if (ep.category === 'PERLU_DIBALAS') return <Badge className="bg-orange-100 text-orange-700">Perlu Dibalas</Badge>;
    if (ep.category === 'SELESAI') return <Badge className="bg-green-100 text-green-700">Selesai</Badge>;
    if (ep.category === 'OTOMATIS') return <Badge className="bg-blue-100 text-blue-700">Otomatis</Badge>;
    return null;
  };

  const getTicketTitle = (ep: any) => ep.ticket.title || `Tiket #${ep.ticket.id}`;
  const getTicketDesc = (ep: any) => ep.lastMessage?.content || '-';
  const getTicketTime = (ep: any) => {
    if (ep.lastMessage?.created_at) {
      const d = new Date(ep.lastMessage.created_at);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  };

  return (
    <div className="h-full w-full max-w-md mx-auto px-6 py-6 flex flex-col gap-6 bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Avatar className="h-14 w-14">
          <AvatarImage src={activeContact.avatar_url || ''} />
          <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
            {activeContact.name?.slice(0,2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg text-gray-900">{activeContact.name}</h2>
        </div>
      </div>

      {/* Mode Percakapan */}
      <div className="mb-2">
        <div className="font-medium text-gray-700 mb-2">Mode Percakapan</div>
        <div className="flex gap-2">
          <Button variant={conversationMode === 'unified' ? 'default' : 'outline'} size="lg" className="flex-1" onClick={() => conversationMode !== 'unified' && toggleConversationMode()}> 
            <MessageCircle className="w-4 h-4 mr-2" /> Terpadu
          </Button>
          <Button variant={conversationMode === 'ticket-specific' ? 'default' : 'outline'} size="lg" className="flex-1" onClick={() => conversationMode !== 'ticket-specific' && toggleConversationMode()}>
            <Inbox className="w-4 h-4 mr-2" /> Per Tiket
          </Button>
        </div>
        {activeContactConversation.currentTicket && (
          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tiket #{activeContactConversation.currentTicket.id} · {activeContactConversation.totalMessages} pesan
          </div>
        )}
      </div>

      {/* Riwayat Tiket */}
      <div>
        <div className="font-medium text-gray-700 mb-2">Riwayat Tiket</div>
        <div className="space-y-4">
          <div className="text-xs text-gray-500 mb-1">Percakapan Aktif ({activeTickets.length})</div>
          {activeTickets.map((ep, idx) => (
            <div
              key={ep.ticket.id}
              className={cn(
                'rounded-lg p-4 mb-2 cursor-pointer border transition',
                ep.ticket.id === activeTicket?.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
              onClick={() => selectTicketEpisode(ep.ticket.id.toString())}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-orange-700">Tiket #{ep.ticket.id}</span>
                {getStatusBadge(ep)}
                <span className="ml-auto text-xs text-gray-500">{ep.messageCount} pesan</span>
              </div>
              <div className="font-semibold text-gray-800 text-base">Tiket #{ep.ticket.id}</div>
              <div className="text-sm text-gray-600 truncate">Pesan Terakhir: {ep.lastMessage?.content || '-'}</div>
              <div className="text-xs text-gray-400 mt-1">{ep.lastMessage?.created_at ? new Date(ep.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 