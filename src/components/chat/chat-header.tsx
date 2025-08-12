"use client";

import {
  ArrowLeft,
  // Phone,
  // VideoIcon,
  // MoreVertical,
  // MessageSquare,
  Settings,
  // User,
  // Ban,
  // Trash2,
  // Info,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/lib/stores/chat";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useCallback, useEffect } from "react";
import { TakeoverStatus } from "./takeover-status";
import { RiskIndicator } from "./risk-indicator";
import { useAntiBlockingStore } from "@/lib/stores/antiBlocking";
import { useViewports } from "@/lib/hooks/useViewPort";
import { useDebounce } from "@/hooks/use-debounce";

export function ChatHeader() {
  const { isTablet } = useViewports();
  const {
    activeContact,
    activeConversation,
    loadContactMessages,
    searchQuery,
    searchResults,
    isSearching,
    clearActiveConversation,
  } = useChatStore();

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const { lastRisk, fetchRisk } = useAntiBlockingStore();

  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  useEffect(() => {
    if (activeContact?.id)
      loadContactMessages(activeContact?.id, 1, debouncedSearchQuery);
  }, [activeContact, debouncedSearchQuery]);

  useEffect(() => {
    if (activeContact?.id) {
      fetchRisk(parseInt(activeContact.id));
    }
  }, [activeContact?.id]);

  if (!activeContact) {
    return (
      <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Backoffice</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOnlineStatus = () => {
    if (!activeContact.last_seen) return "Belum pernah online";

    const lastSeen = new Date(activeContact.last_seen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

    if (diffInMinutes < 5) return "Online";
    return `Terakhir dilihat ${formatDistanceToNow(lastSeen, { addSuffix: true, locale: id })}`;
  };

  const getStatusText = () => {
    if (activeContact.is_blocked) {
      return "Diblokir";
    } else if (activeConversation?.assigned_to) {
      return `Ditugaskan kepada ${activeConversation.assigned_to.username}`;
    } else {
      return getOnlineStatus();
    }
  };

  return (
    <div className="flex flex-col bg-white border-b border-gray-200">
      {/* Main header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          {isTablet && activeContact && (
            <ArrowLeft className="w-4 h-4" onClick={clearActiveConversation} />
          )}
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={activeContact?.avatar_url} />
              <AvatarFallback className="text-sm text-gray-700 bg-gray-200">
                {getInitials(activeContact?.name || "")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {activeContact?.name || "Select Contact"}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <Phone className="w-4 h-4" />
          </Button> */}
          {/* <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <VideoIcon className="w-4 h-4" />
          </Button> */}
          {/* <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={toggleRightSidebar}
            title="Lihat Info Kontak"
          >
            <Info className="w-4 h-4" />
          </Button> */}
          <TakeoverStatus contact={activeContact} />
          <RiskIndicator
            risk={lastRisk}
            compact={true}
            onViewDetails={() => {
              // TODO: Open risk details modal
            }}
          />
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Lihat Profil Kontak
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="w-4 h-4 mr-2" />
                Riwayat Pesan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Ban className="w-4 h-4 mr-2" />
                Blokir Kontak
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Percakapan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            type="text"
            placeholder="Cari pesan..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-10 text-sm h-9"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchQuery("")}
              className="absolute p-0 text-gray-400 transform -translate-y-1/2 right-1 top-1/2 h-7 w-7 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search results indicator */}
        {searchQuery && (
          <div className="mt-3 text-xs text-gray-500">
            Ditemukan {searchResults?.length || 0} pesan untuk "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
