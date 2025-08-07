"use client";

import { useState, useEffect } from "react";
import { ContactSidebar } from "./contact-sidebar";
import { ChatArea } from "./chat-area";
import { useChatStore } from "@/lib/stores/chat";
import { toast } from "@/hooks/use-toast";
import { Message } from "@/types";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

export function ChatLayout() {
  const {
    activeContact,
    loadConversations,
    activeContactConversation,
    loadContactConversation,
  } = useChatStore();

  // Enhanced Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, __] = useState({
    messageType: "all" as
      | "all"
      | "text"
      | "image"
      | "video"
      | "audio"
      | "document",
    dateRange: "all" as "all" | "today" | "week" | "month",
    sender: "all" as "all" | "incoming" | "outgoing",
  });

  // Enhanced Message Actions State
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [_, setForwardingMessage] = useState<Message | null>(null);

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load contact conversation when active contact changes
  useEffect(() => {
    if (activeContact) {
      // Call directly without dependency to avoid infinite loop
      const loadData = async () => {
        try {
          await loadContactConversation(activeContact.id);
        } catch (error) {
          console.error("Failed to load contact conversation:", error);
        }
      };
      loadData();
    }
  }, [activeContact]); // Remove loadContactConversation from dependency

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Simulate search API call
    setTimeout(() => {
      // Get all messages from all contact conversations
      let allMessages: Message[] = [];
      if (activeContactConversation) {
        allMessages = activeContactConversation.allMessages;
      }

      const filteredMessages = allMessages.filter((message) => {
        const matchesQuery = message.content
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesType =
          searchFilters.messageType === "all" ||
          message.message_type === searchFilters.messageType;
        const matchesSender =
          searchFilters.sender === "all" ||
          message.direction === searchFilters.sender;

        return matchesQuery && matchesType && matchesSender;
      });

      setSearchResults(filteredMessages);
      setIsSearching(false);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Enhanced Message Actions
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      toast({
        title: "Reaction Added",
        description: `Added ${emoji} reaction to message`,
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (messageId: string) => {
    setEditingMessage(messageId);

    toast({
      title: "Edit Mode",
      description: "You can now edit this message",
    });
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);

    toast({
      title: "Reply Mode",
      description: "Replying to message",
    });
  };

  const handleForward = (message: Message) => {
    setForwardingMessage(message);

    toast({
      title: "Forward Mode",
      description: "Select contacts to forward message",
    });
  };

  const handleDelete = async (messageId: string) => {
    try {
      // Simulate delete API call

      toast({
        title: "Message Deleted",
        description: "Message has been deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);

      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  // Enhanced props for ChatArea
  const enhancedChatAreaProps = {
    onReact: handleReact,
    onEdit: handleEdit,
    onReply: handleReply,
    onForward: handleForward,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onSearch: handleSearch,
    onClearSearch: clearSearch,
    searchQuery,
    searchResults,
    isSearching,
    replyToMessage,
    setReplyToMessage,
    editingMessage,
    setEditingMessage,
  };

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <ContactSidebar />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <ChatArea {...enhancedChatAreaProps} />
      </div>
      {/* <TicketHistoryPanel
        episodes={activeContactConversation?.ticketEpisodes || []}
        onEpisodeSelect={handleEpisodeSelect}
        onShowAllMessages={handleShowAllMessages}
      /> */}
    </div>
  );
}
