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
    return <div className="p-4">Pilih kontak terlebih dahulu</div>;
  }

  // Label badge style
  const labelClass =
    'px-4 py-1 rounded-full text-xs font-semibold mr-2 mb-2 inline-block border border-transparent';
  const labelColors: Record<string, string> = {
    'Belum Dibalas': 'bg-red-500 text-white',
    'Komplain': 'bg-black text-white',
    'Prioritas': 'bg-yellow-400 text-black',
  };

  // Mode toggle style
  const toggleClass =
    'flex rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-2';
  const toggleBtn =
    'px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-150';
  const toggleActive =
    'bg-white text-black shadow font-semibold';
  const toggleInactive =
    'bg-gray-100 text-gray-400';

  // Card tiket style
  const cardClass =
    'rounded-xl bg-orange-50 border border-orange-200 p-3 mb-3 flex flex-col gap-1';
  const badgeStatus =
    'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800';
  const pesanCount =
    'ml-auto text-xs text-gray-400 font-medium';

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-4">
      {/* Header kontak */}
      <div className="flex flex-col items-center mb-4 relative">
        
        <Avatar className="w-16 h-16 mb-2">
          <AvatarImage src={activeContact.avatar_url || ''} />
          <AvatarFallback className="bg-gray-200 text-gray-700 text-2xl font-bold">
            {activeContact.name?.slice(0,2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="font-semibold text-lg mb-0.5">{activeContact.name}</div>
        <div className="text-gray-500 text-sm mb-0.5">{activeContact.phone_number || activeContact.phone}</div>
        <div className="text-gray-400 text-xs mb-2">&middot; Offline</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">Detail Kontak</span>
          <button className="flex items-center text-xs text-yellow-600 hover:text-yellow-700 gap-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
            Edit
          </button>
        </div>
        <div className="flex flex-wrap justify-center mb-2">
          {['Belum Dibalas', 'Komplain'].map((label) => (
            <span key={label} className={`${labelClass} ${labelColors[label]}`}>{label}</span>
          ))}
        </div>
      </div>

      {/* Mode Percakapan */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Mode Percakapan</div>
        <div className={toggleClass}>
          <button
            className={`${toggleBtn} ${conversationMode === 'unified' ? toggleActive : toggleInactive}`}
            onClick={toggleConversationMode}
          >
            Terpadu
          </button>
          <button
            className={`${toggleBtn} ${conversationMode === 'ticket-specific' ? toggleActive : toggleInactive}`}
            onClick={toggleConversationMode}
          >
            Per Tiket
          </button>
        </div>
        <div className="text-xs text-orange-600 font-medium mt-1 mb-2">
          Tiket #{activeTicket?.id || '-'} <span className="text-gray-400">&middot; {activeTicket?.messages?.length || 0} pesan</span>
        </div>
      </div>

      {/* Riwayat Tiket */}
      <div className="mb-2 flex items-center gap-2">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span className="font-medium text-base">Riwayat Tiket</span>
      </div>
      <div className="text-sm font-semibold mb-2 text-orange-700">Percakapan Aktif <span className="font-normal">({activeContactConversation.ticketEpisodes.length})</span></div>
      <div className="flex-1 overflow-y-auto pr-1 max-h-[400px] ">
        {activeContactConversation.ticketEpisodes.map((episode) => (
          <div key={episode.ticket.id} className={cardClass}>
            <div className="flex items-center mb-1">
              <span className="font-semibold text-sm">Tiket #{episode.ticket.id}</span>
              <span className={badgeStatus}>Perlu Dibalas</span>
              <span className={pesanCount}>{episode.messageCount || 0} pesan</span>
            </div>
            <div className="text-xs text-gray-400">Pesan Terakhir: -</div>
          </div>
        ))}
      </div>
    </div>
  );
} 