"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Users, MessageCircle } from "lucide-react";
import { Contact, Message } from "@/types";

interface GlobalSearchResultsProps {
  query: string;
  contacts: Contact[];
  messages: Message[];
  activeFilter: 'all' | 'contacts' | 'messages';
  onFilterChange: (filter: 'all' | 'contacts' | 'messages') => void;
  onContactSelect: (contact: Contact) => void;
  onMessageSelect: (message: Message) => void;
  isLoading?: boolean;
}

export function GlobalSearchResults({
  query,
  contacts,
  messages,
  activeFilter,
  onFilterChange,
  onContactSelect,
  onMessageSelect,
  isLoading = false,
}: GlobalSearchResultsProps) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">{part}</span>
      ) : part
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Mencari...</p>
      </div>
    );
  }

  if (!query.trim()) {
    return null;
  }

  const hasResults = contacts.length > 0 || messages.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 flex flex-col h-full min-h-0">
      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeFilter === 'all' 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Semua
        </button>
        <button
          onClick={() => onFilterChange('contacts')}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeFilter === 'contacts' 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Kontak ({contacts.length})
        </button>
        <button
          onClick={() => onFilterChange('messages')}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeFilter === 'messages' 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Pesan ({messages.length})
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasResults ? (
          <div className="p-4 text-center">
            <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Tidak ada hasil untuk "{query}"
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Contacts Section */}
            {(activeFilter === 'all' || activeFilter === 'contacts') && contacts.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Kontak
                  </h3>
                </div>
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => onContactSelect(contact)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {highlightText(contact.name, query)}
                          </p>
                        </div>
                        {contact.last_seen && (
                          <p className="text-xs text-gray-500 truncate">
                            {contact.last_seen}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Messages Section */}
            {(activeFilter === 'all' || activeFilter === 'messages') && messages.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50">
                  <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Pesan
                  </h3>
                </div>
                {messages.map((message) => (
                  <button
                    key={message.wa_message_id}
                    onClick={() => onMessageSelect(message)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(message.sender_name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {message.contact_name || 'Unknown'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {message.contact_id}
                        </p>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {highlightText(message.content, query)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 