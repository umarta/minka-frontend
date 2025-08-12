"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { useChatStore } from "@/lib/stores/chat";
import { Message, MessageDirection } from "@/types";
import { format, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronsDown } from "lucide-react";

interface MessagesListProps {
  contactId: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  total: number;
  count: number;
}

export function MessagesList({ contactId }: MessagesListProps) {
  const {
    setSelectedMessage,
    contactMessages,
    isLoadingMessages,
    markMessagesAsRead,
    activeTicket,
    loadMessages,
    activeContact,
    searchQuery,
    searchResults,
    loadContactMessages,
    selectedMessageFromSearch,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastContactId, setLastContactId] = useState<string | null>(null);

  // Determine which messages to display
  const displayMessages =
    searchQuery && searchResults
      ? searchResults
      : contactMessages[contactId] || [];

  // Throttled scroll handler untuk performance
  const throttledScrollHandler = useCallback(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    const timeout = setTimeout(() => {
      handleScroll();
    }, 150); // Throttle 150ms

    setScrollTimeout(timeout);
  }, [
    contactId,
    currentPage,
    isLoadingOlder,
    paginationMeta,
    loadContactMessages,
  ]);

  const scrollToBottom = () => {
    setShowScrollButton(false);
    isUserScrollingRef.current = false; // Reset flag manual scrolling
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    }
  };

  // Handle scroll to detect if user scrolled up and load older messages
  const handleScroll = async () => {
    if (containerRef.current && !searchQuery) {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      const scrollFromBottom = scrollHeight - scrollTop - clientHeight;
      const thirtyPercentOfContainer = clientHeight * 0.5;
      const shouldShowScrollToBottom =
        scrollFromBottom > thirtyPercentOfContainer;

      // Track if user is manually scrolling
      isUserScrollingRef.current = true;

      // Auto-reset user scrolling flag after delay
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);

      setShowScrollButton(shouldShowScrollToBottom);

      // Load older messages when user scrolls to top (within 50px from top)
      if (scrollTop <= 50 && !isLoadingOlder && paginationMeta?.has_next) {
        const prevScrollHeight = container.scrollHeight;

        setIsLoadingOlder(true);
        try {
          const nextPage = currentPage + 1;
          const response = await loadContactMessages(
            contactId,
            nextPage,
            undefined,
            true
          );
          setCurrentPage(nextPage);

          // Update pagination metadata
          if (response?.meta?.pagination) {
            setPaginationMeta(response.meta.pagination);
          }

          // Maintain scroll position after loading older messages
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight;
            container.scrollTop = scrollTop + scrollDiff;
          }, 100);
        } catch (error) {
          console.error("Failed to load older messages:", error);
        } finally {
          setIsLoadingOlder(false);
        }
      }
    }
  };

  // Load messages when component mounts or contact changes
  useEffect(() => {
    if (contactId) {
      // Deteksi perubahan kontak
      const isContactChanged = lastContactId !== contactId;
      setLastContactId(contactId);

      setHasLoadedMessages(false);
      setCurrentPage(1);
      setPaginationMeta(null);
      setShowScrollButton(false);
      // Reset user scrolling flag saat ganti kontak
      isUserScrollingRef.current = false;

      // Add small delay to avoid race conditions
      const timer = setTimeout(async () => {
        try {
          const response = await loadContactMessages(contactId, 1);
          setHasLoadedMessages(true);

          // Extract pagination metadata from response
          if (response?.meta?.pagination) {
            setPaginationMeta(response.meta.pagination);
          }

          // Force scroll ke bawah untuk kontak yang berubah
          if (isContactChanged) {
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "auto" });
                setShowScrollButton(false);
              }
            }, 300);
          }
        } catch (error) {
          console.error("Failed to load initial messages:", error);
          setHasLoadedMessages(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contactId, loadContactMessages, lastContactId]);

  // Auto-scroll ke bawah WAJIB saat buka chat baru atau ada pesan baru
  useEffect(() => {
    if (messagesEndRef.current && hasLoadedMessages) {
      // Reset scroll position untuk memastikan selalu ke bawah
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          setShowScrollButton(false);
        }
      }, 150);
    }
  }, [contactId, hasLoadedMessages]);

  // Auto-scroll saat ada pesan baru (tidak saat loading older messages)
  useEffect(() => {
    if (
      messagesEndRef.current &&
      displayMessages.length > 0 &&
      !isLoadingOlder
    ) {
      const container = containerRef.current;
      if (container) {
        // Jika user belum scroll secara manual atau baru buka chat, auto scroll ke bawah
        if (!isUserScrollingRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setShowScrollButton(false);
          }, 50);
        } else {
          // Jika user sudah scroll, cek apakah masih dekat dengan bottom
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            100;
          if (isNearBottom) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowScrollButton(false);
            }, 50);
          }
        }
      }
    }
  }, [displayMessages.length, isLoadingOlder]);

  // Force auto scroll saat contactId berubah dan messages sudah ada
  useEffect(() => {
    if (contactId && displayMessages.length > 0 && !isLoadingMessages) {
      // Reset flag manual scrolling untuk kontak baru
      isUserScrollingRef.current = false;

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          setShowScrollButton(false);
        }
      }, 200);
    }
  }, [contactId, displayMessages.length, isLoadingMessages]);

  // Tambahan: Auto scroll setiap kali ada perubahan messages untuk kontak yang sama
  useEffect(() => {
    if (
      contactId &&
      displayMessages.length > 0 &&
      hasLoadedMessages &&
      !searchQuery
    ) {
      // Hanya auto scroll jika tidak sedang loading older messages
      if (!isLoadingOlder) {
        setTimeout(() => {
          if (messagesEndRef.current && !isUserScrollingRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setShowScrollButton(false);
          }
        }, 100);
      }
    }
  }, [
    displayMessages,
    contactId,
    hasLoadedMessages,
    isLoadingOlder,
    searchQuery,
  ]);

  // Load messages when ticket changes - use optimized loading
  useEffect(() => {
    if (activeTicket) {
      // Only load if we don't have messages for this ticket or if it's a different ticket
      const currentMessages =
        useChatStore.getState().messages[activeTicket.id.toString()];
      if (!currentMessages || currentMessages.length === 0) {
        loadMessages(activeTicket.id.toString());
      }
    }
  }, [activeTicket, loadMessages]);

  // Mark messages as read when component mounts or ticket changes
  useEffect(() => {
    if (activeContact && displayMessages.length > 0) {
      markMessagesAsRead(activeContact.id.toString());
    }
  }, [activeContact, markMessagesAsRead, displayMessages.length]);

  // Update hasLoadedMessages when messages are loaded
  useEffect(() => {
    if (displayMessages.length > 0 && !hasLoadedMessages) {
      setHasLoadedMessages(true);
    }
  }, [displayMessages.length, hasLoadedMessages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  // Scroll to selected message from global search using wa_message_id
  useEffect(() => {
    if (selectedMessageFromSearch && displayMessages.length > 0) {
      setTimeout(() => {
        handleScrollToElement(selectedMessageFromSearch.wa_message_id || "");
      }, 1000);
    }
  }, [selectedMessageFromSearch, displayMessages]);

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return "Hari ini";
    } else if (isYesterday(date)) {
      return "Kemarin";
    } else {
      return format(date, "dd MMMM yyyy", { locale: id });
    }
  };

  const handleScrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const container = containerRef.current;

      if (container) {
        const existingHighlighted =
          container.querySelectorAll(".message-highlight");
        existingHighlighted.forEach((el) =>
          el.classList.remove("message-highlight")
        );
      } else {
        const existingHighlighted =
          document.querySelectorAll(".message-highlight");
        existingHighlighted.forEach((el) =>
          el.classList.remove("message-highlight")
        );
      }

      const firstChild = element.children[0] as HTMLElement;

      const secondChild = firstChild.children[0] as HTMLElement;
      if (secondChild) {
        secondChild.classList.add("message-highlight");
      } else {
        element.classList.add("message-highlight");
      }

      if (container) {
        const elementTop = element.offsetTop;
        const containerHeight = container.clientHeight;
        const elementHeight = element.offsetHeight;

        const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "smooth",
        });
      } else {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }

      setTimeout(() => {
        secondChild.classList.remove("message-highlight");
      }, 3000);
    }
  };

  // Group messages by date and remove duplicates more thoroughly
  const groupedMessages = displayMessages
    .reduce((uniqueMessages: Message[], message) => {
      // Use a more comprehensive unique check
      const isDuplicate = uniqueMessages.some(
        (existing) =>
          existing.id === message.id &&
          existing.created_at === message.created_at &&
          existing.content === message.content
      );

      if (!isDuplicate) {
        uniqueMessages.push(message);
      }
      return uniqueMessages;
    }, [])
    .reduce((groups: { [key: string]: Message[] }, message) => {
      const dateKey = format(new Date(message.created_at), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(message);
      return groups;
    }, {});

  if (isLoadingMessages) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoadingMessages && displayMessages.length === 0 && hasLoadedMessages) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="text-center text-gray-500">
          {searchQuery ? (
            <div>
              <p>Tidak ada pesan yang ditemukan untuk "{searchQuery}"</p>
              <p className="mt-1 text-sm">Coba kata kunci lain</p>
            </div>
          ) : (
            <div>
              <p>Belum ada pesan</p>
              <p className="mt-1 text-sm">
                Mulai percakapan dengan mengirim pesan
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 px-2 pt-4 overflow-y-auto max-h-[72vh]"
      ref={containerRef}
      onScroll={throttledScrollHandler}
    >
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      {Object.entries(groupedMessages)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([dateKey, messages]) => (
          <div key={dateKey}>
            {/* Date Header */}
            <div className="flex justify-center my-4">
              <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                {formatMessageDate(messages[0].created_at)}
              </div>
            </div>

            {/* Messages for this date */}
            {messages.map((message: Message, index) => (
              <MessageBubble
                key={`${message.id}-${message.created_at}-${dateKey}-${index}`}
                message={message}
                isSearchResult={!!searchQuery}
                onReply={(msg) =>
                  setSelectedMessage({
                    wa_message_id: msg.wa_message_id,
                    content: msg.content,
                    name: activeContact?.name || "",
                    message_type: msg.message_type,
                    direction: msg.direction || "incoming",
                    media_url: msg.media_url || undefined,
                  })
                }
                onScrollToElement={(v) => handleScrollToElement(v)}
              />
            ))}
          </div>
        ))}

      {showScrollButton && (
        <div className="fixed z-10 bottom-20 right-6">
          <button
            className="flex items-center justify-center w-6 h-6 text-white transition-all duration-200 transform bg-green-600 rounded-full shadow-lg cursor-pointer hover:scale-105"
            title="Scroll to bottom"
            onClick={scrollToBottom}
          >
            <ChevronsDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
