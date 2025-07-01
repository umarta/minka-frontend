"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Bot,
  ChevronDown,
  ChevronRight,
  Calendar,
  Timer
} from 'lucide-react';
import { Ticket, Message } from '@/types';

interface TicketEpisode {
  ticket: Ticket;
  messageCount: number;
  startDate: string;
  endDate?: string;
  duration?: string;
  status: string;
  category: 'PERLU_DIBALAS' | 'OTOMATIS' | 'SELESAI';
  unreadCount: number;
  lastMessage?: Message;
}

interface TicketHistoryPanelProps {
  episodes: TicketEpisode[];
  currentTicketId?: string;
  onEpisodeSelect: (ticketId: string) => void;
  onShowAllMessages: () => void;
  conversationMode?: 'unified' | 'ticket-specific';
}

const TicketHistoryPanel: React.FC<TicketHistoryPanelProps> = ({
  episodes,
  currentTicketId,
  onEpisodeSelect,
  onShowAllMessages,
  conversationMode
}) => {
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());

  const toggleEpisode = (ticketId: string) => {
    const newExpanded = new Set(expandedEpisodes);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedEpisodes(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PERLU_DIBALAS':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'OTOMATIS':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'SELESAI':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PERLU_DIBALAS':
        return 'Perlu Dibalas';
      case 'OTOMATIS':
        return 'Otomatis';
      case 'SELESAI':
        return 'Selesai';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PERLU_DIBALAS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OTOMATIS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SELESAI':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentEpisodes = episodes.filter(ep => 
    ep.category === 'PERLU_DIBALAS' || ep.status === 'OPEN'
  );
  
  const completedEpisodes = episodes.filter(ep => 
    ep.category === 'SELESAI' || ep.status === 'CLOSED'
  );

  const automaticEpisodes = episodes.filter(ep => 
    ep.category === 'OTOMATIS'
  );

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Riwayat Percakapan
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShowAllMessages}
          className="w-full"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Lihat Semua Pesan
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="h-full overflow-y-auto px-6 pb-6">
          {/* Current/Active Episodes */}
          {currentEpisodes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <h3 className="font-medium text-sm text-orange-700">
                  Percakapan Aktif ({currentEpisodes.length})
                </h3>
              </div>
              
              {currentEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.ticket.id}
                  episode={episode}
                  isExpanded={expandedEpisodes.has(episode.ticket.id.toString())}
                  isActive={currentTicketId === episode.ticket.id.toString()}
                  onToggle={() => toggleEpisode(episode.ticket.id.toString())}
                  onSelect={() => onEpisodeSelect(episode.ticket.id.toString())}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Automatic Episodes */}
          {automaticEpisodes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-sm text-blue-700">
                  Otomatis ({automaticEpisodes.length})
                </h3>
              </div>
              
              {automaticEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.ticket.id}
                  episode={episode}
                  isExpanded={expandedEpisodes.has(episode.ticket.id.toString())}
                  isActive={currentTicketId === episode.ticket.id.toString()}
                  onToggle={() => toggleEpisode(episode.ticket.id.toString())}
                  onSelect={() => onEpisodeSelect(episode.ticket.id.toString())}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Completed Episodes */}
          {completedEpisodes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h3 className="font-medium text-sm text-green-700">
                  Selesai ({completedEpisodes.length})
                </h3>
              </div>
              
              {completedEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.ticket.id}
                  episode={episode}
                  isExpanded={expandedEpisodes.has(episode.ticket.id.toString())}
                  isActive={currentTicketId === episode.ticket.id.toString()}
                  onToggle={() => toggleEpisode(episode.ticket.id.toString())}
                  onSelect={() => onEpisodeSelect(episode.ticket.id.toString())}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryColor={getCategoryColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {episodes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada riwayat percakapan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface EpisodeCardProps {
  episode: TicketEpisode;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onSelect: () => void;
  getCategoryIcon: (category: string) => React.ReactNode;
  getCategoryLabel: (category: string) => string;
  getCategoryColor: (category: string) => string;
  formatDate: (dateString: string) => string;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  isExpanded,
  isActive,
  onToggle,
  onSelect,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  formatDate
}) => {
  return (
    <div 
      className={`border rounded-lg p-3 mb-3 cursor-pointer transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(episode.category)}
            <Badge 
              variant="outline" 
              className={`text-xs ${getCategoryColor(episode.category)}`}
            >
              {getCategoryLabel(episode.category)}
            </Badge>
            {episode.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {episode.unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="text-sm font-medium mb-1">
            Tiket #{episode.ticket.id}
          </div>
          
          <div className="text-xs text-gray-500 mb-2">
            {formatDate(episode.startDate)}
            {episode.endDate && ` - ${formatDate(episode.endDate)}`}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {episode.messageCount}
            </span>
            {episode.duration && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {episode.duration}
              </span>
            )}
          </div>
          
          {episode.lastMessage && isExpanded && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium mb-1">Pesan Terakhir:</div>
              <div className="text-gray-600 truncate">
                {episode.lastMessage.content}
              </div>
              <div className="text-gray-400 mt-1">
                {formatDate(episode.lastMessage.created_at)}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 h-auto"
        >
          {isExpanded ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );
};

export default TicketHistoryPanel; 