"use client";

import { useEffect } from "react";
import {
  useSidebarCollapsed,
  useRightSidebarVisible,
  useChatStore,
} from "@/lib/stores/chat";
import { getWebSocketManager } from "@/lib/websocket";
import { ContactSidebar } from "@/components/chat/contact-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { InfoPanel } from "@/components/chat/info-panel";
import { useNotificationSound } from "@/hooks/use-notification-sound";

export default function ChatPage() {
  const sidebarCollapsed = useSidebarCollapsed();
  const rightSidebarVisible = useRightSidebarVisible();
  const { loadConversations } = useChatStore();

  // Initialize global notification sound
  useNotificationSound();

  useEffect(() => {
    // Join global room untuk receive semua event conversation_updated
    const ws = getWebSocketManager();
    if (ws) {
      console.log("[WS] Chat page: Joining global room");
      ws.joinRoom("global");

      // Load conversations saat halaman dibuka
      loadConversations();
    }
  }, [loadConversations]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Kiri */}
        <div
          className={
            sidebarCollapsed
              ? "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 w-20"
              : "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0"
          }
        >
          <ContactSidebar />
        </div>
        {/* Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          <ChatArea />
        </div>
        {/* Info Panel (Push Drawer) */}
        <div
          className={
            rightSidebarVisible
              ? "transition-all duration-300 bg-white border-l border-gray-200 shadow-lg z-30 overflow-hidden flex-shrink-0 w-80"
              : "transition-all duration-300 bg-white border-l border-gray-200 shadow-lg z-30 overflow-hidden flex-shrink-0 w-0"
          }
        >
          {rightSidebarVisible && <InfoPanel />}
        </div>
      </div>
    </div>
  );
}
