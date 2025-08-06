"use client";

import { useState, useRef, useEffect } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  Play,
  Pause,
  Edit,
  Forward,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  ExternalLink,
  ChevronDown,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useChatStore } from "@/lib/stores/chat";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onScrollToElement?: (id: string) => void;
  showTicketBadge?: boolean;
  isSearchResult?: boolean;
}

export function MessageBubble({
  message,
  isGrouped = false,
  onReact,
  onReply,
  onForward,
  onDelete,
  onCopy,
  onScrollToElement,
  isSearchResult = false,
}: MessageBubbleProps) {
  const { activeContact, conversationMode } = useChatStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [duration, setDuration] = useState<number | undefined>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOutgoing = message.direction === "outgoing";
  const isSystem = message.message_type === "system";

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Ambil mode percakapan
  const showAdminName = isOutgoing && (message as any).admin_name;

  // Get sender name for outgoing messages
  const getSenderName = () => {
    if (!isOutgoing) return null;

    // Check for sender_name field first
    if (message.sender_name) {
      return message.sender_name;
    }

    // Check for sender object with username
    if ((message as any).sender?.username) {
      return (message as any).sender.username;
    }

    // Check for admin_name (legacy)
    if ((message as any).username) {
      return (message as any).username;
    }

    return null;
  };

  const senderName = getSenderName();

  // Badge color per ticket
  const getTicketBadgeColor = (ticketId: any) => {
    if (ticketId === 1 || ticketId === "1") return "bg-orange-500";
    if (ticketId === 2 || ticketId === "2") return "bg-green-500";
    if (ticketId === 3 || ticketId === "3") return "bg-blue-500";
    return "bg-gray-400";
  };

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="max-w-xs px-3 py-2 bg-gray-100 rounded-lg">
          <p className="text-sm text-center text-gray-600">{message.content}</p>
          <span className="text-xs text-gray-400">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!isOutgoing) return null;

    switch (message.status) {
      case "pending":
        return <Clock className="w-3 h-3 text-white" />;
      case "sent":
      case "delivered":
        return <Check className="w-3 h-3 text-white" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "failed":
        return <span className="text-xs text-red-500">!</span>;
      default:
        return null;
    }
  };

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        // Pause audio
        audioRef.current.pause();
        setIsPlaying(false);

        // When pausing, keep current time at current position (remaining time)
        const remaining = (duration || 0) - audioRef.current.currentTime;
        setCurrentTime(Math.max(0, remaining));

        // Clear interval when pausing
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Play audio
        audioRef.current.play();
        setIsPlaying(true);

        // Start countdown interval
        intervalRef.current = setInterval(() => {
          if (audioRef.current) {
            const remaining = (duration || 0) - audioRef.current.currentTime;
            setCurrentTime(Math.max(0, remaining));

            // Stop when audio ends
            if (remaining <= 0) {
              setIsPlaying(false);
              setCurrentTime(0);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        }, 100); // Update every 100ms for smooth countdown
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (dur: number) => {
    const minutes = Math.floor(dur / 60);
    const seconds = Math.floor(dur % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getFileTypeIcon = (type: string) => {
    if (type?.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type?.startsWith("video/")) return <Video className="w-5 h-5" />;
    if (type?.startsWith("audio/")) return <Volume2 className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const groupedReactions = message.reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = { count: 0, users: [] };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user_name);
        return acc;
      },
      {} as Record<string, { count: number; users: string[] }>
    );

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(groupedReactions).map(([emoji, data], index) => (
          <button
            key={`${message.id}-reaction-${emoji}-${index}`}
            className="flex items-center gap-1 px-2 py-1 text-xs transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
            onClick={() => onReact?.(message.id, emoji)}
            title={`${data.users.join(", ")} reacted with ${emoji}`}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{data.count}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderReadReceipts = () => {
    if (!isOutgoing || !message.read_by || message.read_by.length === 0)
      return null;

    return (
      <div className="flex mt-1 -space-x-1">
        {message.read_by.slice(0, 3).map((receipt, index) => (
          <Avatar
            key={`${message.id}-receipt-${receipt.id || index}`}
            className="w-4 h-4 border border-white"
          >
            <AvatarImage src={receipt.user_avatar} />
            <AvatarFallback className="text-xs">
              {receipt.user_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
        {message.read_by.length > 3 && (
          <div
            key={`${message.id}-receipt-more`}
            className="flex items-center justify-center w-4 h-4 text-xs text-gray-600 bg-gray-300 rounded-full"
          >
            +{message.read_by.length - 3}
          </div>
        )}
      </div>
    );
  };

  const renderAudioWaveform = () => {
    if (!message.waveform) return null;

    const progressRatio = duration ? (duration - currentTime) / duration : 0;
    const activeIndex = Math.floor(progressRatio * message.waveform.length);

    return (
      <div className="flex items-center h-8 gap-1">
        {message.waveform.map((height, index) => (
          <div
            key={`${message.id}-waveform-${index}`}
            className={cn(
              "w-1 rounded-full transition-all",
              index <= activeIndex ? "bg-green-500" : "bg-green-200",
              isPlaying && index <= activeIndex ? "bg-green-600" : ""
            )}
            style={{ height: `${Math.max(4, height * 24)}px` }}
          />
        ))}
      </div>
    );
  };

  const renderMediaContent = () => {
    switch (message.message_type) {
      case "text":
        return (
          <div>
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </p>
            {message.link_preview && (
              <div className="max-w-sm mt-3 overflow-hidden border border-gray-200 rounded-lg">
                {message.link_preview.image && (
                  <img
                    src={message.link_preview.image}
                    alt="Link preview"
                    className="object-cover w-full h-32"
                  />
                )}
                <div className="p-3">
                  <h4 className="text-sm font-medium line-clamp-2">
                    {message.link_preview.title}
                  </h4>
                  {message.link_preview.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {message.link_preview.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-xs text-gray-500">
                      {message.link_preview.domain}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center gap-3 min-w-[250px] p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
              onClick={handleAudioPlayPause}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <div className="flex-1">
              {message.waveform ? (
                renderAudioWaveform()
              ) : (
                <div className="h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 transition-all bg-green-500 rounded-full"
                    style={{
                      width: duration
                        ? `${((duration - currentTime) / duration) * 100}%`
                        : "0%",
                    }}
                  ></div>
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {currentTime > 0
                    ? formatDuration(currentTime)
                    : duration
                      ? formatDuration(duration)
                      : "0:00"}
                </span>
                <Volume2 className="w-3 h-3 text-gray-400" />
              </div>
            </div>

            <audio
              ref={audioRef}
              src={message.media_url || message.file_url}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              }}
              onLoadedMetadata={() => {
                if (audioRef.current?.duration) {
                  setDuration(audioRef.current.duration);
                  setCurrentTime(audioRef.current.duration);
                }
              }}
            />
          </div>
        );

      case "image":
        return (
          <div className="max-w-sm">
            <div className="relative group">
              <img
                src={message.media_url || message.file_url}
                alt="Image"
                className="w-[250px] object-contain h-auto transition-opacity rounded-lg cursor-pointer hover:opacity-90"
                onClick={() => {
                  window.open(message.media_url || message.file_url, "_blank");
                }}
              />
              <div className="absolute transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-6 h-6 p-0 bg-black/50 hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      message.media_url || message.file_url,
                      "_blank"
                    );
                  }}
                >
                  <ExternalLink className="w-3 h-3 text-white" />
                </Button>
              </div>
              {message.resolution && (
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="secondary"
                    className="text-xs text-white bg-black/50"
                  >
                    {message.resolution}
                  </Badge>
                </div>
              )}
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
            {(message.file_size || message.media_size) && (
              <p className="mt-1 text-xs text-gray-500">
                {formatFileSize(message.file_size || message.media_size || 0)}
              </p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="max-w-sm">
            <div className="relative">
              <video
                src={message.media_url || message.file_url}
                className="size-[250px] object-cover rounded-lg"
                controls
                poster={message.thumbnail_url}
              />
              <div className="absolute flex gap-2 top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  Video
                </Badge>
                {message.duration && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor(message.duration / 60)}:
                    {(message.duration % 60).toString().padStart(2, "0")}
                  </Badge>
                )}
              </div>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              {message.resolution && <span>{message.resolution}</span>}
              {(message.file_size || message.media_size) && (
                <span>
                  {formatFileSize(message.file_size || message.media_size || 0)}
                </span>
              )}
            </div>
          </div>
        );

      case "document":
        return (
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg min-w-[280px] max-w-sm">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg">
              {getFileTypeIcon(message.file_type || message.media_type || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.file_name || message.media_filename || "Document"}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {message.file_type?.toUpperCase() ||
                    message.media_filename?.split(".").pop()?.toUpperCase() ||
                    "FILE"}
                </span>
                {(message.file_size || message.media_size) && (
                  <>
                    <span>•</span>
                    <span>
                      {formatFileSize(
                        message.file_size || message.media_size || 0
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = message.file_url || message.media_url;
                if (url) {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download =
                    message.file_name || message.media_filename || "document";
                  a.click();
                }
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        );

      default:
        return (
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );
    }
  };

  const generateReplyContentIcon = () => {
    switch (message?.reply_to?.content_type) {
      case "image":
        return (
          <div className="flex items-center gap-1">
            <Camera className="w-4 h-4 text-gray-600" />
            <p className="overflow-hidden text-xs text-gray-500 break-all whitespace-pre-wrap line-clamp-2">
              {message.reply_to?.content}
            </p>
          </div>
        );
      case "video":
        return (
          <div className="flex items-center gap-1">
            <Video className="w-4 h-4 text-gray-600" />
            <p className="overflow-hidden text-xs text-gray-500 break-all whitespace-pre-wrap line-clamp-2">
              {message.reply_to?.content || "Video"}
            </p>
          </div>
        );

      case "audio":
        return (
          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <p className="overflow-hidden text-xs text-gray-500 break-all whitespace-pre-wrap line-clamp-2">
              {message.reply_to?.content || "Audio"}
            </p>
          </div>
        );
      case "document":
        return (
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-gray-600" />
            <p className="overflow-hidden text-xs text-gray-500 break-all whitespace-pre-wrap line-clamp-2">
              {message.reply_to?.content || "Document"}
            </p>
          </div>
        );

      default:
        return (
          <p className="overflow-hidden text-xs text-gray-500 break-all whitespace-pre-wrap line-clamp-2">
            {message.reply_to?.content}
          </p>
        );
    }
  };

  const quickReactions = ["👍", "❤️", "😊", "😮", "😢", "😡"];

  return (
    <div
      id={message.wa_message_id}
      key={`message-bubble-${message.id}`}
      className={cn(
        "flex",
        isOutgoing ? "justify-end" : "justify-start",
        "mb-3",
        isSearchResult && "ring-2 ring-yellow-200 bg-yellow-50 rounded-lg p-2"
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          "relative min-w-[137px]  max-w-[75%]",
          isOutgoing ? "order-2 ml-0" : "order-1 mr-0"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 relative group",
            isOutgoing
              ? "bg-green-500 text-white rounded-br-sm"
              : "bg-white border border-gray-200 rounded-bl-sm shadow-sm",
            isGrouped && isOutgoing && "rounded-br-lg",
            isGrouped && !isOutgoing && "rounded-bl-lg"
          )}
        >
          {isOutgoing && message?.reply_to_message_id && (
            <div
              className="p-1 mb-1 bg-white rounded-lg"
              onClick={() =>
                onScrollToElement &&
                onScrollToElement(message.reply_to?.target_wa_message_id || "")
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col">
                  <h4 className="m-0 text-sm text-blue-600">
                    {activeContact?.name}
                  </h4>
                  {generateReplyContentIcon()}
                </div>
                {message?.reply_to?.content_type === "image" &&
                  message?.reply_to?.media_url && (
                    <Image
                      src={message?.reply_to?.media_url}
                      alt="Reply Image"
                      width={48}
                      height={48}
                      className="object-cover rounded-lg size-12"
                    />
                  )}
              </div>
            </div>
          )}

          {!isOutgoing && (
            <Popover open={showPopover} onOpenChange={setShowPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute z-30 w-5 h-5 p-0 transition-opacity duration-200 bg-gray-100 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100"
                >
                  <ChevronDown className="w-3 h-3 text-gray-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-1 w-fit" side="bottom" align="start">
                <div className="space-y-1">
                  {onReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start w-full"
                      onClick={() => {
                        onReply(message);
                        setShowPopover(false);
                      }}
                    >
                      {/* <Reply className="w-4 h-4 mr-2" /> */}
                      Reply
                    </Button>
                  )}
                  {onForward && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start w-full"
                      onClick={() => {
                        onForward(message);
                        setShowPopover(false);
                      }}
                    >
                      {/* <Forward className="w-4 h-4 mr-2" /> */}
                      Forward
                    </Button>
                  )}
                  {onCopy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start w-full"
                      onClick={() => {
                        onCopy(message.content);
                        setShowPopover(false);
                      }}
                    >
                      {/* <Copy className="w-4 h-4 mr-2" /> */}
                      Copy
                    </Button>
                  )}
                  {onReact && (
                    <>
                      <div className="my-1 border-t border-gray-200" />
                      <div className="px-2 py-1">
                        <p className="mb-2 text-xs text-gray-500">
                          React with:
                        </p>
                        <div className="flex gap-1">
                          {quickReactions.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0 hover:bg-gray-100"
                              onClick={() => {
                                onReact?.(message.id, emoji);
                                setShowPopover(false);
                              }}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {onDelete && (
                    <>
                      <div className="my-1 border-t border-gray-200" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          onDelete(message.id);
                          setShowPopover(false);
                        }}
                      >
                        {/* <Trash2 className="w-4 h-4 mr-2" /> */}
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Badge Tiket di pojok bubble, hanya mode unified */}
          {conversationMode === "unified" && message.ticket_id && (
            <div
              className={cn(
                "absolute -top-2 text-xs px-2 py-0.5 rounded-full text-white font-medium",
                isOutgoing ? "-right-1" : "-left-1",
                getTicketBadgeColor(message.ticket_id)
              )}
            >
              #{message.ticket_id}
            </div>
          )}
          {/* Nama Admin */}
          {showAdminName && (
            <div className="mb-1 text-xs font-semibold text-left text-blue-700">
              {(message as any).admin_name || "Admin"}
            </div>
          )}

          {/* Sender Name for Outgoing Messages */}
          {senderName && (
            <div
              className={cn("text-xs text-bold mb-1 font-medium text-gray-600")}
            >
              {senderName}
            </div>
          )}
          {/* Reply indicator */}
          {message.quoted_message && (
            <div
              className={cn(
                "border-l-4 pl-3 py-2 mb-2 rounded",
                isOutgoing
                  ? "border-green-300 bg-green-400/20"
                  : "border-gray-300 bg-gray-50"
              )}
            >
              <p className="mb-1 text-xs opacity-75">
                {message.quoted_message.direction === "outgoing"
                  ? "You"
                  : "Customer"}
              </p>
              <p className="text-sm truncate opacity-90">
                {message.quoted_message.content}
              </p>
            </div>
          )}

          {/* Forwarded indicator */}
          {message.forwarded_from && (
            <div
              className={cn(
                "text-xs italic mb-2 flex items-center gap-1",
                isOutgoing ? "text-green-100" : "text-gray-500"
              )}
            >
              <Forward className="w-3 h-3" />
              Forwarded
            </div>
          )}

          {/* Message Content */}
          <div className={cn(isOutgoing ? "text-white" : "text-gray-900")}>
            {renderMediaContent()}
          </div>

          {/* Edited indicator */}
          {message.edited_at && (
            <span
              className={cn(
                "text-xs italic mt-1 block",
                isOutgoing ? "text-green-100" : "text-gray-500"
              )}
            >
              edited
            </span>
          )}

          {/* Reactions */}
          {renderReactions()}

          {/* Message Info */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs",
                  isOutgoing ? "text-green-100" : "text-gray-500"
                )}
              >
                {format(new Date(message.created_at), "HH:mm")}
              </span>
              {message.edited_at && <Edit className="w-3 h-3 opacity-50" />}
            </div>

            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {renderReadReceipts()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
