'use client';

import { MessageSquare, Users, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyChatState() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          {/* Simple placeholder instead of complex SVG for debugging */}
          <div className="mx-auto w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-16 w-16 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-medium text-gray-700 mb-3">
          Oops... Anda belum memilih obrolan untuk memulai mengirim pesan
        </h2>
        
        <p className="text-gray-500 mb-6 text-sm">
          Lakukan percakapan anda sekarang
        </p>

        <div className="space-y-3 text-sm text-gray-400 mb-8">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Kelola percakapan pelanggan</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span>Kirim media dan dokumen</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-4 w-4 text-purple-500" />
            <span>Sinkronisasi pesan real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
} 