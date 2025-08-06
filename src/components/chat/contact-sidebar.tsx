"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Phone,
  MessageCircle,
  Clock,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  CheckCheck,
  Circle,
  Tag,
  Filter,
  X,
  ChevronLeft,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationUnreadBadge } from "@/components/UnreadCountBadge";
import { LabelBadgeInline } from "@/components/LabelBadgeDisplay";
import { ConversationStatusDot } from "@/components/ConversationStatusIndicator";
import { ContactLabelManager } from "@/components/ContactLabelManager";
import { GlobalSearchInput } from "./global-search-input";
import { GlobalSearchResults } from "./global-search-results";
import { useChatStore } from "@/lib/stores/chat";
import { Conversation, ConversationGroup } from "@/types";
import { InfiniteConversationList } from "./infinite-conversation-list";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function ContactSidebar() {
  const router = useRouter();

  const {
    conversations,
    chatGroups,
    selectConversation,
    activeContact,
    isLoadingConversations,
    toggleSidebar,
    sidebarCollapsed,
    loadConversationsByGroup,
    moveConversationToGroup,
    setSelectedGroup,
    conversationCounts,
    loadConversationCounts,
    pagination,
    isLoadingMore,
    loadMoreConversations,
    // Global Search
    globalSearch,
    clearGlobalSearch,
    setGlobalSearchFilter,
    selectGlobalSearchContact,
    selectGlobalSearchMessage,
    globalSearchQuery,
    globalSearchResults,
    isGlobalSearching,
    globalSearchActiveFilter,
    showGlobalSearchResults,
  } = useChatStore();

  const [selectedTab, setSelectedTab] = useState<ConversationGroup>("ai_agent");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "unread" | "name">("time");
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [selectedConversationForLabels, setSelectedConversationForLabels] =
    useState<Conversation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounced search query
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Available labels for filtering
  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    conversations.forEach(conv => {
      conv.labels?.forEach(label => labels.add(label.name));
    });
    return Array.from(labels);
  }, [conversations]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedLabels([]);
    setStatusFilter("all");
    setShowFilters(false);
  }, []);

  useEffect(() => {
    loadConversationCounts();
    loadConversationsByGroup("ai_agent");
  }, []);

  // Load conversations by group when tab changes
  useEffect(() => {
    setSelectedGroup(selectedTab);
  }, [selectedTab]);

  // Debug: Log when loadMoreConversations is called
  const handleLoadMore = useCallback(() => {
    // Ensure we're loading more for the current tab
    loadMoreConversations();
  }, [loadMoreConversations, pagination, isLoadingMore, selectedTab]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOnlineStatus = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

    if (diffMinutes < 5) return "online";
    if (diffMinutes < 30) return "recent";
    return "offline";
  };

  const getPriorityIcon = (ticket: any, unreadCount: number) => {
    if (unreadCount > 5) return <span className="text-red-500">🔥</span>;
    if (ticket?.priority === "high")
      return <span className="text-orange-500">⚡</span>;
    if (ticket?.priority === "urgent")
      return <span className="text-red-500">🚨</span>;
    return null;
  };

  // Enhanced search and filtering logic
  const filteredConversations = useMemo(() => {
    // Use conversations directly since we're now loading by group
    let filteredByTab: Conversation[] = conversations;

    // Remove duplicates using conversation ID first, then contact ID as fallback
    const uniqueConvs = filteredByTab.filter((conv, index, self) => {
      const currentKey = conv.id || conv.contact?.id;
      return (
        index ===
        self.findIndex((c) => {
          const compareKey = c.id || c.contact?.id;
          return compareKey === currentKey;
        })
      );
    });

    // Apply search filter
    let filteredBySearch = uniqueConvs;
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filteredBySearch = uniqueConvs.filter(
        (conv) =>
          conv.contact.name.toLowerCase().includes(query) ||
          conv.contact.phone.includes(query) ||
          conv.last_message?.content.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    let filteredByStatus = filteredBySearch;
    if (statusFilter !== "all") {
      filteredByStatus = filteredBySearch.filter(
        (conv) => conv.status === statusFilter
      );
    }

    // Apply label filter
    let filteredByLabels = filteredByStatus;
    if (selectedLabels.length > 0) {
      filteredByLabels = filteredByStatus.filter((conv) =>
        selectedLabels.some((label) =>
          conv.labels?.some(convLabel => convLabel.name === label)
        )
      );
    }

    // Sort conversations
    return filteredByLabels.sort((a, b) => {
      switch (sortBy) {
        case "unread":
          return (b.unread_count || 0) - (a.unread_count || 0);
        case "name":
          return a.contact.name.localeCompare(b.contact.name);
        case "time":
        default:
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      }
    });
  }, [conversations, debouncedSearchQuery, statusFilter, selectedLabels, sortBy]);

  const getTimeDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    if (isToday(date)) {
      return format(date, "HH:mm", { locale: id });
    } else if (isYesterday(date)) {
      return "Kemarin";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE", { locale: id });
    } else {
      return format(date, "dd/MM/yyyy", { locale: id });
    }
  };

  const handleQuickAction = (
    e: React.MouseEvent,
    action: string,
    conversation: Conversation
  ) => {
    e.stopPropagation();
    console.log(`Quick action: ${action}`, conversation);
  };

  const renderConversation = (conversation: Conversation) => {
    const unreadCount = conversation.unread_count || 0;
    const lastMessage = conversation.last_message;
    const contact = conversation.contact;
    const ticket = conversation.active_ticket;

    return (
      <div
        key={conversation.id}
        className={cn(
          "flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors",
          activeContact?.id === contact.id && "bg-blue-50 border-r-2 border-blue-500"
        )}
        onClick={() => selectConversation(contact)}
      >
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={contact.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>
          <ConversationStatusDot status={conversation.status} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {contact.name}
            </h3>
            <div className="flex items-center gap-1">
              {getPriorityIcon(ticket, unreadCount)}
              <span className="text-xs text-gray-500">
                {getTimeDisplay(conversation.last_activity)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 truncate flex-1">
              {lastMessage?.content || "Belum ada pesan"}
            </p>
                         <div className="flex items-center gap-1 ml-2">
               <ConversationUnreadBadge conversation={conversation} />
             </div>
          </div>

                     {/* Labels */}
           {conversation.labels && conversation.labels.length > 0 && (
             <div className="flex flex-wrap gap-1 mt-1">
               {conversation.labels.slice(0, 2).map((label) => (
                 <LabelBadgeInline key={label.id} labels={[label]} maxVisible={2} />
               ))}
               {conversation.labels.length > 2 && (
                 <span className="text-xs text-gray-400">
                   +{conversation.labels.length - 2}
                 </span>
               )}
             </div>
           )}
        </div>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleQuickAction(e, "star", conversation)}>
              <Star className="w-4 h-4 mr-2" />
              Star
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleQuickAction(e, "archive", conversation)}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleQuickAction(e, "delete", conversation)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const getTabCounts = () => ({
    advisor: conversationCounts.advisor || chatGroups.advisor?.length || 0,
    ai_agent: conversationCounts.ai_agent || chatGroups.ai_agent?.length || 0,
    done: conversationCounts.done || chatGroups.done?.length || 0,
  });

  const tabCounts = getTabCounts();

  // Collapsed sidebar view
  if (sidebarCollapsed) {
    return (
      <div className="flex flex-col w-20 h-full bg-white border-r border-gray-200">
        {/* Collapsed Header */}
        <div className="flex justify-center p-3 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-8 h-8 p-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>

        {/* Collapsed Tab Indicators */}
        <div className="flex flex-col border-b border-gray-200">
          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === "advisor"
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => {
              loadConversationsByGroup("advisor").then(() => {
                setSelectedTab("advisor");
              });
            }}
            title="Advisor"
          >
            AD
            {tabCounts.advisor > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[0.625rem] min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.advisor > 99 ? "99+" : tabCounts.advisor}
              </div>
            )}
          </button>

          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === "ai_agent"
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => {
              loadConversationsByGroup("ai_agent").then(() => {
                setSelectedTab("ai_agent");
              });
            }}
            title="AI Agent"
          >
            AI
            {tabCounts.ai_agent > 0 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[0.625rem] min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.ai_agent > 99 ? "99+" : tabCounts.ai_agent}
              </div>
            )}
          </button>

          <button
            className={cn(
              "p-3 text-xs font-medium transition-colors relative",
              selectedTab === "done"
                ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => {
              loadConversationsByGroup("done").then(() => {
                setSelectedTab("done");
              });
            }}
            title="Done"
          >
            DN
            {tabCounts.done > 0 && (
              <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-[0.625rem] min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                {tabCounts.done > 99 ? "99+" : tabCounts.done}
              </div>
            )}
          </button>
        </div>

        {/* Collapsed Conversations List */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center p-3">
              <div className="w-4 h-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-1">
              {filteredConversations.slice(0, 10).map(renderConversation)}
            </div>
          ) : (
            <div className="p-3 text-center">
              <MessageCircle className="w-6 h-6 mx-auto text-gray-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // FULL SIDEBAR
  return (
    <aside className="flex flex-col h-full max-w-xs bg-white border-r border-gray-200 min-w-[560px]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <ChevronLeft
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer"
          />
          <h2 className="text-lg font-semibold text-gray-900">Percakapan</h2>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Urutkan">
                <Clock className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("time")}>
                <Clock className="w-4 h-4 mr-2" />
                Waktu Terbaru
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("unread")}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Belum Dibaca
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                <Phone className="w-4 h-4 mr-2" />
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </Button>
        </div>
      </header>

      {/* Global Search */}
      <div className="p-4 pb-2 border-b border-gray-200">
        <div className="space-y-3">
          <GlobalSearchInput
            onSearch={globalSearch}
            onClear={clearGlobalSearch}
            onFilterToggle={() => setShowFilters((prev) => !prev)}
            isSearching={isGlobalSearching}
            hasActiveFilters={selectedLabels.length > 0 || statusFilter !== "all"}
          />

          {/* Filter Options */}
          {showFilters && (
            <div className="p-3 space-y-3 rounded-lg bg-gray-50">
              {/* Status Filter */}
              <div>
                <label className="block mb-2 text-xs font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Label Filter */}
              {availableLabels.length > 0 && (
                <div>
                  <label className="block mb-2 text-xs font-medium text-gray-700">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availableLabels.map((label) => (
                      <button
                        key={label}
                        onClick={() => {
                          setSelectedLabels((prev) =>
                            prev.includes(label)
                              ? prev.filter((l) => l !== label)
                              : [...prev, label]
                          );
                          setShowFilters(false);
                        }}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border transition-colors",
                          selectedLabels.includes(label)
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {(selectedLabels.length > 0 || statusFilter !== "all") && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {selectedLabels.length + (statusFilter !== "all" ? 1 : 0)}{" "}
                      filter aktif
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex bg-white border-b border-gray-200">
        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === "advisor"
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => {
            setSelectedTab("advisor");
            loadConversationsByGroup("advisor").then(() => {
              setShowFilters(false);
              setLocalSearchQuery("");
              setStatusFilter("all");
              setSelectedLabels([]);
            });
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Advisor</span>
            {tabCounts.advisor > 0 && (
              <Badge className="text-xs text-white bg-blue-500">
                {tabCounts.advisor > 99 ? "99+" : tabCounts.advisor}
              </Badge>
            )}
          </div>
        </button>

        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === "ai_agent"
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => {
            setSelectedTab("ai_agent");
            loadConversationsByGroup("ai_agent").then(() => {
              setShowFilters(false);
              setLocalSearchQuery("");
              setStatusFilter("all");
              setSelectedLabels([]);
            });
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>AI Agent</span>
            {tabCounts.ai_agent > 0 && (
              <Badge className="text-xs text-white bg-green-500">
                {tabCounts.ai_agent > 99 ? "99+" : tabCounts.ai_agent}
              </Badge>
            )}
          </div>
        </button>

        <button
          className={cn(
            "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
            selectedTab === "done"
              ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => {
            setSelectedTab("done");
            loadConversationsByGroup("done").then(() => {
              setShowFilters(false);
              setLocalSearchQuery("");
              setStatusFilter("all");
              setSelectedLabels([]);
            });
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Done</span>
            {tabCounts.done > 0 && (
              <Badge className="text-xs text-white bg-gray-500">
                {tabCounts.done > 99 ? "99+" : tabCounts.done}
              </Badge>
            )}
          </div>
        </button>
      </nav>

      {/* Global Search Results or Conversations List */}
      {showGlobalSearchResults ? (
        <div className="flex-1 flex flex-col min-h-0">
          <GlobalSearchResults
            query={globalSearchQuery}
            contacts={globalSearchResults.contacts}
            messages={globalSearchResults.messages}
            activeFilter={globalSearchActiveFilter}
            onFilterChange={setGlobalSearchFilter}
            onContactSelect={selectGlobalSearchContact}
            onMessageSelect={selectGlobalSearchMessage}
            isLoading={isGlobalSearching}
          />
        </div>
      ) : (
        <section className="flex-1 overflow-y-auto bg-white divide-y divide-gray-100">
          {/* Load more button with better info */}
          {pagination.hasMore && (
            <div className="p-2 border-b bg-gray-50">
              <div className="text-xs text-gray-500">
                Menampilkan {filteredConversations.length} dari {pagination.total}{" "}
                percakapan
              </div>
            </div>
          )}

          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 mb-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Memuat percakapan...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            <InfiniteConversationList
              conversations={filteredConversations}
              onLoadMore={handleLoadMore}
              hasMore={pagination.hasMore}
              isLoading={isLoadingMore}
              selectedTab={selectedTab}
              setSelectedTab={(v) => setSelectedTab(v)}
            />
          ) : (
            <div className="p-8 text-center">
              <div className="mb-4 text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">
                {localSearchQuery ? "Tidak ada hasil" : "Belum ada percakapan"}
              </h3>
              <p className="text-sm text-gray-500">
                {localSearchQuery
                  ? "Coba kata kunci lain atau hapus filter pencarian"
                  : "Percakapan baru akan muncul di sini ketika ada pesan masuk"}
              </p>
              {localSearchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setLocalSearchQuery("")}
                >
                  Hapus Pencarian
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Contact Label Manager Modal */}
      {labelManagerOpen && selectedConversationForLabels && (
        <ContactLabelManager
          contactId={selectedConversationForLabels.contact.id.toString()}
          contactName={selectedConversationForLabels.contact.name}
          isOpen={labelManagerOpen}
          currentSelectedLabels={selectedConversationForLabels?.labels || []}
          onClose={() => {
            setLabelManagerOpen(false);
            setSelectedConversationForLabels(null);
          }}
        />
      )}
    </aside>
  );
}
