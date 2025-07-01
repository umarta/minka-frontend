'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, BarChart3, Settings } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WhatsApp Admin Backoffice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistem manajemen customer service WhatsApp dengan interface chat real-time, 
            manajemen kontak, dan analytics lengkap.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/messages')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Chat Interface</CardTitle>
              <CardDescription>
                Interface chat fullscreen dengan fitur WhatsApp lengkap
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/contacts')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Manajemen Kontak</CardTitle>
              <CardDescription>
                Kelola kontak, label, dan impor data pelanggan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/analytics')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>
                Laporan performa dan statistik percakapan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/sessions')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Session Management</CardTitle>
              <CardDescription>
                Kelola sesi WhatsApp dan konfigurasi
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mulai Menggunakan</CardTitle>
            <CardDescription>
              Akses langsung ke fitur utama sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => router.push('/messages')} 
                className="flex-1 h-12 text-lg"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Buka Chat Interface
              </Button>
              
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline" 
                className="flex-1 h-12 text-lg"
                size="lg"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Lihat Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600 text-sm">
              Interface chat seperti WhatsApp dengan fitur fullscreen dan sidebar yang bisa di-collapse
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Manajemen Kontak</h3>
            <p className="text-gray-600 text-sm">
              Kelola kontak dengan label, filter, dan grouping berdasarkan status percakapan
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics Lengkap</h3>
            <p className="text-gray-600 text-sm">
              Dashboard analytics dengan metrics response time, customer satisfaction, dan lainnya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
