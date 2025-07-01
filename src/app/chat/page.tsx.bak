'use client';

import { ChatLayout } from '@/components/chat/chat-layout';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">WhatsApp Chat</h1>
            <p className="text-sm text-gray-600">Real-time messaging with customers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin</p>
            </div>
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden">
        <ChatLayout />
      </div>
    </div>
  );
} 