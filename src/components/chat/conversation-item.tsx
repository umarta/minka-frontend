import React, { useCallback, memo } from "react";
import { Conversation } from "@/types";
import { useChat, useChatStore } from "@/lib/stores/chat";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import {
  MoreVertical,
  CheckCheck,
  MessageCircle,
  Star,
  Archive,
  Trash2,
  Tag,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: Conversation;
  onContactLabel?: (conversation: Conversation) => void;
}

export const ConversationItem = memo<ConversationItemProps>(
  ({ conversation, onContactLabel }) => {
    const { selectConversation, activeContact } = useChat();
    const moveConversationToGroup = useChatStore(
      (state) => state.moveConversationToGroup
    );

    const hasUnread = (conversation.unread_count || 0) > 0;
    const isActive = activeContact?.id === conversation.contact?.id;

    const handleClick = useCallback(() => {
      selectConversation(conversation.contact);
    }, [conversation.contact, selectConversation]);

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const formatTime = (dateString: string) => {
      try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      } catch {
        return "Unknown time";
      }
    };

    const getOnlineStatus = (lastSeen: string) => {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMinutes =
        (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

      if (diffMinutes < 5) return "online";
      if (diffMinutes < 30) return "recent";
      return "offline";
    };

    const getPriorityIcon = (ticket: any, unreadCount: number) => {
      if (unreadCount > 5) return <span className="text-red-500">🔥</span>;
      if (ticket?.priority === "high")
        return <span className="text-orange-500">⚡</span>;
      return null;
    };

    const onlineStatus = getOnlineStatus(conversation.contact?.last_seen || "");
    const priorityIcon = getPriorityIcon(
      conversation.active_ticket,
      conversation.unread_count
    );

    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 group relative",
          isActive && "bg-blue-50 border-r-4 border-r-blue-500 shadow-sm"
        )}
        onClick={handleClick}
      >
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={conversation.contact?.avatar_url} />
            <AvatarFallback className="text-sm font-medium text-gray-700 bg-gray-200">
              {getInitials(conversation.contact?.name || "Unknown")}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
              onlineStatus === "online" && "bg-green-500",
              onlineStatus === "recent" && "bg-yellow-500",
              onlineStatus === "offline" && "bg-gray-400"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center min-w-0 gap-2">
              <h4 className="font-medium text-gray-900 truncate">
                {conversation.contact?.name || "Unknown Contact"}
              </h4>
              {priorityIcon}
            </div>
            <div className="flex items-center flex-shrink-0 gap-2">
              <span className="text-xs text-gray-500">
                {format(
                  conversation.last_activity || conversation.updated_at,
                  "H:mm"
                )}{" "}
              </span>

              {/* Quick actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 transition-opacity opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onContactLabel?.(conversation);
                    }}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Contact Label
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Tandai Dibaca
                  </DropdownMenuItem>

                  {/* Group management actions */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      moveConversationToGroup(
                        conversation.id.toString(),
                        "advisor"
                      );
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Move to Advisor
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      moveConversationToGroup(
                        conversation.id.toString(),
                        "ai_agent"
                      );
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Move to AI Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      moveConversationToGroup(
                        conversation.id.toString(),
                        "done"
                      );
                    }}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark as Done
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Star className="w-4 h-4 mr-2" />
                    Beri Bintang
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Archive className="w-4 h-4 mr-2" />
                    Arsipkan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0 gap-2">
              <p className="text-sm text-gray-600 truncate">
                {conversation.last_message ? (
                  <>
                    {conversation.last_message.direction === "outgoing" && (
                      <span className="mr-1 text-blue-500">✓</span>
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

            <div className="flex items-center flex-shrink-0 gap-1">
              <ConversationUnreadBadge conversation={conversation} />

              {/* Status indicators */}
              <ConversationStatusDot status={conversation.status} />
              {conversation.active_ticket?.priority === "urgent" && (
                <Circle className="w-2 h-2 text-red-500 fill-red-500" />
              )}
              {conversation.assigned_to && (
                <div className="flex items-center justify-center w-4 h-4 bg-blue-100 rounded-full">
                  <span className="text-xs font-medium text-blue-600">
                    {conversation.assigned_to.full_name?.[0]?.toUpperCase() ||
                      "A"}
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
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.conversation.id === nextProps.conversation.id &&
      prevProps.conversation.unread_count ===
        nextProps.conversation.unread_count &&
      prevProps.conversation.last_activity ===
        nextProps.conversation.last_activity &&
      prevProps.conversation.conversation_group ===
        nextProps.conversation.conversation_group &&
      prevProps.conversation.updated_at === nextProps.conversation.updated_at &&
      prevProps.conversation.status === nextProps.conversation.status &&
      prevProps.conversation.labels?.length ===
        nextProps.conversation.labels?.length
    );
  }
);

ConversationItem.displayName = "ConversationItem";
