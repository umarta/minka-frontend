"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Bot,
  ChevronRight,
  Users,
  History,
  Phone,
  MessageSquare,
  Search,
  MoreVertical,
  Star,
  Archive,
  CheckCheck,
  Zap,
  Flame,
  Menu,
  X,
  Settings,
  Home,
  BarChart3,
  Headphones,
  FileText,
  User,
  Send,
  Paperclip,
  Smile,
  // Enhanced Features Icons - Backend Requirements
  Mic,
  MicOff,
  Download,
  Eye,
  Reply,
  Forward,
  Copy,
  Trash2,
  Heart,
  ThumbsUp,
  Laugh,
  FileImage,
  FileVideo,
  FileAudio,
  Image,
  Play,
  Pause,
  Volume2,
  Edit3,
  Save,
  RotateCcw,
  ChevronDown,
  Filter,
  SortDesc,
  Loader2,
  Video,
  MapPin,
  Calendar,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo Labels
const demoLabels = [
  { id: 1, name: "Belum Dibalas", color: "bg-red-500", textColor: "text-white" },
  { id: 2, name: "Prioritas", color: "bg-orange-500", textColor: "text-white" },
  { id: 3, name: "Follow Up", color: "bg-yellow-500", textColor: "text-white" },
  { id: 4, name: "Komplain", color: "bg-red-600", textColor: "text-white" },
  { id: 5, name: "Closing", color: "bg-green-500", textColor: "text-white" },
  { id: 6, name: "Prospek", color: "bg-blue-500", textColor: "text-white" },
  { id: 7, name: "VIP", color: "bg-purple-500", textColor: "text-white" },
  { id: 8, name: "Selesai", color: "bg-gray-500", textColor: "text-white" }
];

// 🔥 ENHANCED FEATURES - Backend Requirements Revealed

// Quick Reply Templates - Backend Requirement: Template Management API
const quickReplyTemplates = [
  { id: 1, text: "Terima kasih atas pertanyaannya. Kami akan segera membantu Anda.", category: "greeting" },
  { id: 2, text: "Mohon tunggu sebentar, saya akan cek informasinya untuk Anda.", category: "processing" },
  { id: 3, text: "Apakah ada yang bisa kami bantu lagi?", category: "closing" },
  { id: 4, text: "Untuk informasi lebih lanjut, silakan hubungi customer service kami.", category: "redirect" },
  { id: 5, text: "Produk tersebut sedang tidak tersedia. Silakan cek alternatif lainnya.", category: "product" },
];

// Enhanced Message Interface - Backend Requirement: Extended Message Schema
interface EnhancedMessage {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  created_at: string;
  sender: string;
  ticket_id: number;
  // 🚀 NEW ENHANCED FIELDS - Backend Database Schema Requirements
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'document' | 'location';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reply_to?: string; // Message ID being replied to
  forwarded_from?: string; // Original sender if forwarded
  edited_at?: string;
  reactions?: { emoji: string; users: string[] }[];
  file_url?: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
  duration?: number; // for audio/video
  read_by?: { user_id: string; read_at: string }[];
  location?: { latitude: number; longitude: number; address?: string };
  metadata?: { [key: string]: any };
}

// Enhanced demo messages with advanced features - Backend Data Examples
const enhancedDemoMessages: EnhancedMessage[] = [
  {
    id: "1",
    content: "Halo, saya tertarik dengan produk A. Boleh minta informasi harga?",
    direction: 'incoming',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1,
    type: 'text',
    status: 'read',
    reactions: [{ emoji: '👍', users: ['admin1'] }]
  },
  {
    id: "2", 
    content: "Halo! Untuk produk A harganya Rp 150.000. Berikut katalog lengkapnya:",
    direction: 'outgoing',
    created_at: new Date(Date.now() - 6900000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1,
    type: 'text',
    status: 'read',
    reply_to: "1"
  },
  {
    id: "3",
    content: "Katalog_Produk_2024.pdf",
    direction: 'outgoing',
    created_at: new Date(Date.now() - 6890000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1,
    type: 'document',
    status: 'read',
    file_url: '/demo/katalog.pdf',
    file_name: 'Katalog_Produk_2024.pdf',
    file_size: 2485760 // 2.4MB
  },
  {
    id: "4",
    content: "Voice message",
    direction: 'incoming',
    created_at: new Date(Date.now() - 6300000).toISOString(),
    sender: "Ahmad Syukur", 
    ticket_id: 1,
    type: 'audio',
    status: 'read',
    duration: 15,
    file_url: '/demo/voice_message.mp3'
  },
  {
    id: "5",
    content: "Lokasi toko saya",
    direction: 'incoming',
    created_at: new Date(Date.now() - 6000000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1,
    type: 'location',
    status: 'read',
    location: { latitude: -6.2088, longitude: 106.8456, address: "Jakarta Pusat" }
  },
  {
    id: "6",
    content: "Masih menunggu konfirmasi harga produk A",
    direction: 'incoming',
    created_at: new Date(Date.now() - 600000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1,
    type: 'text',
    status: 'delivered',
    edited_at: new Date(Date.now() - 500000).toISOString()
  },
  {
    id: "9",
    content: "Masih menunggu konfirmasi harga produk A (edited)",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 600000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "10",
    content: "📞 Contact Card", // Contact sharing
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 300000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "11",
    content: "😊 Sticker", // Sticker message
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 120000).toISOString(),
    sender: "Admin Budi", 
    ticket_id: 1
  },
  {
    id: "12",
    content: "Baik pak, kami akan segera follow up pesanannya. Terima kasih!",
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 60000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1
  }
];

// File Type Support Configuration - Backend Requirement: File Processing
const supportedFileTypes = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  video: ['.mp4', '.mov', '.avi', '.mkv']
};

// Enhanced demo data with multiple contacts
const demoContacts = [
  {
    id: "1",
    name: "Ahmad Syukur",
    phone: "+6281234567890",
    avatar_url: "",
    last_seen: new Date(Date.now() - 120000).toISOString(),
    unread_count: 3,
    priority: "high",
    status: "urgent",
    assigned_to: { name: "Budi", id: "admin1" },
    last_message: {
      content: "Masih menunggu konfirmasi harga produk A",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 600000).toISOString()
    },
    last_activity: new Date(Date.now() - 600000).toISOString(),
    category: 'needReply',
    labels: [1, 2] // Belum Dibalas, Prioritas
  },
  {
    id: "2",
    name: "Sarah Malik",
    phone: "+6281234567891",
    avatar_url: "",
    last_seen: new Date(Date.now() - 30000).toISOString(),
    unread_count: 0,
    priority: "normal",
    status: "active",
    last_message: {
      content: "Terima kasih atas informasinya",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    last_activity: new Date(Date.now() - 1800000).toISOString(),
    category: 'completed',
    labels: [4, 3] // Komplain, Follow Up
  },
  {
    id: "3",
    name: "Rudi Santoso",
    phone: "+6281234567892", 
    avatar_url: "",
    last_seen: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 8,
    priority: "urgent",
    status: "urgent",
    last_message: {
      content: "Tolong segera proses pesanan saya!",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    last_activity: new Date(Date.now() - 300000).toISOString(),
    category: 'needReply',
    labels: [1, 2, 4] // Belum Dibalas, Prioritas, Komplain
  },
  {
    id: "4",
    name: "Lisa Permata",
    phone: "+6281234567893",
    avatar_url: "",
    last_seen: new Date(Date.now() - 7200000).toISOString(),
    unread_count: 0,
    priority: "low",
    status: "active", 
    last_message: {
      content: "Selamat datang! Ada yang bisa kami bantu?",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    last_activity: new Date(Date.now() - 7200000).toISOString(),
    category: 'automated',
    labels: [6] // Prospek
  },
  {
    id: "5",
    name: "Michael Chen",
    phone: "+6281234567894",
    avatar_url: "",
    last_seen: new Date(Date.now() - 1800000).toISOString(),
    unread_count: 1,
    priority: "normal",
    status: "active",
    assigned_to: { name: "Siti", id: "admin2" },
    last_message: {
      content: "Kapan produk ini tersedia lagi?",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 900000).toISOString()
    },
    last_activity: new Date(Date.now() - 900000).toISOString(),
    category: 'needReply',
    labels: [7, 5] // VIP, Closing
  }
];

const demoTicketEpisodes = [
  {
    id: 1,
    subject: "Pertanyaan Produk",
    status: "OPEN",
    priority: "HIGH",
    created_at: new Date().toISOString(),
    messageCount: 12,
    category: 'PERLU_DIBALAS' as const,
    unreadCount: 3,
    lastMessage: {
      content: "Masih menunggu konfirmasi harga produk A",
      created_at: new Date().toISOString(),
      direction: 'incoming' as const
    }
  },
  {
    id: 2,
    subject: "Keluhan Pengiriman",
    status: "CLOSED",
    priority: "MEDIUM",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 3600000).toISOString(),
    messageCount: 8,
    category: 'SELESAI' as const,
    unreadCount: 0,
    lastMessage: {
      content: "Terima kasih atas bantuannya",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      direction: 'incoming' as const
    }
  },
  {
    id: 3,
    subject: "Auto Reply Welcome",
    status: "CLOSED",
    priority: "LOW",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    messageCount: 3,
    category: 'OTOMATIS' as const,
    unreadCount: 0,
    lastMessage: {
      content: "Selamat datang! Ada yang bisa kami bantu?",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      direction: 'outgoing' as const
    }
  }
];

const demoAllMessages = [
  {
    id: "1",
    content: "Halo, saya tertarik dengan produk A. Boleh minta informasi harga?",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    ticket_id: "1"
  },
  {
    id: "2", 
    content: "Halo! Untuk produk A harganya Rp 150.000. Apakah ada yang ingin ditanyakan lagi?",
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 6900000).toISOString(),
    ticket_id: "1"
  },
  {
    id: "3",
    content: "Apakah ada diskon untuk pembelian dalam jumlah banyak?",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 6600000).toISOString(),
    ticket_id: "1"
  },
  {
    id: "4",
    content: "Masih menunggu konfirmasi harga produk A",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 600000).toISOString(),
    ticket_id: "1"
  }
];

// Extended demo messages for each contact
const demoMessagesPerContact = {
  "1": [ // Ahmad Syukur
    {
      id: "msg_1_1",
      content: "Halo, saya tertarik dengan produk A. Boleh minta informasi harga?",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender: "Ahmad Syukur",
      ticket_id: 1
    },
    {
      id: "msg_1_2", 
      content: "Halo! Untuk produk A harganya Rp 150.000. Apakah ada yang ingin ditanyakan lagi?",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 6900000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_1_3",
      content: "Apakah ada diskon untuk pembelian dalam jumlah banyak?",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 6600000).toISOString(),
      sender: "Ahmad Syukur",
      ticket_id: 1
    },
    {
      id: "msg_1_4",
      content: "Ya, untuk pembelian di atas 10 unit ada diskon 15%. Berapa unit yang dibutuhkan?",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 6300000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_1_5",
      content: "Masih menunggu konfirmasi harga produk A",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 600000).toISOString(),
      sender: "Ahmad Syukur",
      ticket_id: 2
    }
  ],
  "2": [ // Sarah Malik
    {
      id: "msg_2_1",
      content: "Halo, saya ingin komplain soal pesanan kemarin",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      sender: "Sarah Malik",
      ticket_id: 1
    },
    {
      id: "msg_2_2",
      content: "Halo Ibu Sarah, ada kendala apa dengan pesanannya?",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 3540000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_2_3",
      content: "Produknya cacat dan tidak sesuai deskripsi",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 3480000).toISOString(),
      sender: "Sarah Malik",
      ticket_id: 1
    },
    {
      id: "msg_2_4",
      content: "Mohon maaf atas ketidaknyamanannya. Kami akan kirim replacement hari ini juga.",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 3420000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_2_5",
      content: "Terima kasih atas informasinya",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      sender: "Sarah Malik",
      ticket_id: 2
    }
  ],
  "3": [ // Rudi Santoso
    {
      id: "msg_3_1",
      content: "URGENT! Pesanan saya belum sampai sudah 3 hari!",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 900000).toISOString(),
      sender: "Rudi Santoso",
      ticket_id: 1
    },
    {
      id: "msg_3_2",
      content: "Halo Pak Rudi, mohon berikan nomor order untuk kami cek",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 840000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_3_3",
      content: "ORD-2024-001234",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 780000).toISOString(),
      sender: "Rudi Santoso",
      ticket_id: 1
    },
    {
      id: "msg_3_4",
      content: "Sedang kami cek dengan tim logistik, mohon tunggu sebentar",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 720000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_3_5",
      content: "Tolong segera proses pesanan saya!",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 300000).toISOString(),
      sender: "Rudi Santoso",
      ticket_id: 2
    }
  ],
  "4": [ // Lisa Permata  
    {
      id: "msg_4_1",
      content: "Selamat datang! Ada yang bisa kami bantu?",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      sender: "Admin",
      ticket_id: 3
    },
    {
      id: "msg_4_2",
      content: "Halo, saya baru bergabung di grup ini",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 7100000).toISOString(),
      sender: "Lisa Permata",
      ticket_id: 3
    },
    {
      id: "msg_4_3",
      content: "Selamat datang! Silakan lihat katalog produk kami di link berikut: www.example.com/catalog",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 7000000).toISOString(),
      sender: "Admin",
      ticket_id: 3
    }
  ],
  "5": [ // Michael Chen
    {
      id: "msg_5_1",
      content: "Hi, when will product B be available again?",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      sender: "Michael Chen",
      ticket_id: 1
    },
    {
      id: "msg_5_2",
      content: "Hello Michael, product B will be restocked next week",
      direction: 'outgoing' as const,
      created_at: new Date(Date.now() - 1740000).toISOString(),
      sender: "Admin",
      ticket_id: 1
    },
    {
      id: "msg_5_3",
      content: "Kapan produk ini tersedia lagi?",
      direction: 'incoming' as const,
      created_at: new Date(Date.now() - 900000).toISOString(),
      sender: "Michael Chen",
      ticket_id: 2
    }
  ]
};

// Add interface for Message type
interface Message {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  created_at: string;
  sender: string;
  ticket_id: number;
}

// Enhanced demo messages with media content
const demoMessages: Message[] = [
  {
    id: "1",
    content: "Halo, saya tertarik dengan produk A. Boleh minta informasi harga?",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "2", 
    content: "Halo! Untuk produk A harganya Rp 150.000. Berikut katalog lengkapnya:",
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 6900000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1
  },
  {
    id: "3",
    content: "📄 Katalog_Produk_2024.pdf", // Document message
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 6890000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1
  },
  {
    id: "4",
    content: "🎵 Voice message", // Audio message
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 6300000).toISOString(),
    sender: "Ahmad Syukur", 
    ticket_id: 1
  },
  {
    id: "5",
    content: "📷 Product_Image.jpg", // Image message
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 6100000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "6",
    content: "🎥 Demo_Video.mp4", // Video message
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 5800000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1
  },
  {
    id: "7",
    content: "📍 Lokasi toko saya", // Location message
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 5600000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "8",
    content: "Terima kasih atas informasinya. Lokasi sangat mudah dijangkau!",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 5400000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "9",
    content: "Masih menunggu konfirmasi harga produk A (edited)",
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 600000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "10",
    content: "📞 Contact Card", // Contact sharing
    direction: 'incoming' as const,
    created_at: new Date(Date.now() - 300000).toISOString(),
    sender: "Ahmad Syukur",
    ticket_id: 1
  },
  {
    id: "11",
    content: "😊 Sticker", // Sticker message
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 120000).toISOString(),
    sender: "Admin Budi", 
    ticket_id: 1
  },
  {
    id: "12",
    content: "Baik pak, kami akan segera follow up pesanannya. Terima kasih!",
    direction: 'outgoing' as const,
    created_at: new Date(Date.now() - 60000).toISOString(),
    sender: "Admin Budi",
    ticket_id: 1
  }
];

export default function EnhancedContactConversationDemo() {
  const [selectedContactId, setSelectedContactId] = useState<string>("1");
  const [selectedTab, setSelectedTab] = useState<'needReply' | 'automated' | 'completed'>('needReply');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'unread' | 'name'>('time');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversationMode, setConversationMode] = useState<'unified' | 'perTicket'>('unified');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editContactForm, setEditContactForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '1990-01-01',
    gender: '',
    businessName: '',
    jobPosition: '',
    email: ''
  });
  const [messageExpiryTime, setMessageExpiryTime] = useState<Date | null>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update countdown timer
  const updateTimeRemaining = () => {
    if (!messageExpiryTime) return;
    
    const now = new Date();
    const diff = messageExpiryTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Expired');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(updateTimeRemaining, 1000);
    updateTimeRemaining(); // Initial call
    
    return () => clearInterval(timer);
  }, [messageExpiryTime]);

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Initialize form when contact changes
  const initializeContactForm = (contact: any) => {
    const nameParts = contact.name.split(' ');
    setEditContactForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      birthDate: '1990-01-01',
      gender: '',
      businessName: '',
      jobPosition: '',
      email: ''
    });
  };

  // Handle contact form changes
  const handleContactFormChange = (field: string, value: string) => {
    setEditContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save contact
  const handleSaveContact = () => {
    console.log('Saving contact:', editContactForm);
    setIsEditingContact(false);
    // In real app, this would call API to save contact
    alert('Contact berhasil disimpan!');
  };

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (!isEditingContact && activeContact) {
      initializeContactForm(activeContact);
    }
    setIsEditingContact(!isEditingContact);
  };

  // Get label by ID
  const getLabelById = (labelId: number) => {
    return demoLabels.find(label => label.id === labelId);
  };

  // Get labels for contact
  const getContactLabels = (contact: any) => {
    return (contact.labels || []).map((labelId: number) => getLabelById(labelId)).filter(Boolean);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
      } else {
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      }
    }
  };

  const getOnlineStatus = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'recent';
    return 'offline';
  };

  const getPriorityIcon = (priority: string, unreadCount: number) => {
    if (unreadCount > 5) return <Flame className="h-4 w-4 text-red-500" />;
    if (priority === 'high') return <Zap className="h-4 w-4 text-orange-500" />;
    if (priority === 'urgent') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTabContacts = () => {
    let contacts = [];
    switch (selectedTab) {
      case 'needReply':
        contacts = demoContacts.filter(c => c.category === 'needReply');
        break;
      case 'automated':
        contacts = demoContacts.filter(c => c.category === 'automated');
        break;
      case 'completed':
        contacts = demoContacts.filter(c => c.category === 'completed');
        break;
      default:
        contacts = demoContacts;
    }

    return contacts.sort((a, b) => {
      switch (sortBy) {
        case 'unread':
          return b.unread_count - a.unread_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'time':
        default:
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      }
    });
  };

  const filteredContacts = getTabContacts().filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.last_message?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickAction = (action: string, contact: any) => {
    console.log(`Quick action: ${action}`, contact);
  };

  const activeContact = demoContacts.find(c => c.id === selectedContactId);
  const currentMessages = (demoMessagesPerContact as Record<string, any[]>)[selectedContactId] || [];
  
  // Get messages based on conversation mode and selected ticket
  const getDisplayMessages = () => {
    if (!activeContact) return [];
    
    const allContactMessages = (demoMessagesPerContact as Record<string, any[]>)[selectedContactId] || [];
    
    if (conversationMode === 'unified') {
      // Show all messages for the contact
      return allContactMessages;
    } else {
      // Show messages for specific ticket only
      if (selectedTicketId) {
        // Filter messages for the selected ticket
        // For demo, we'll simulate ticket-specific messages
        const ticketMessages = allContactMessages.filter((_: any, index: number) => {
          if (selectedTicketId === 1) return index < 3; // First 3 messages for ticket 1
          if (selectedTicketId === 2) return index >= 3; // Remaining messages for ticket 2
          if (selectedTicketId === 3) return index >= 0; // All messages for automated tickets
          return false;
        });
        return ticketMessages;
      } else {
        // Default to first ticket's messages
        return allContactMessages.slice(0, 3);
      }
    }
  };
  
  const displayMessages = getDisplayMessages();
  
  // Get message count for current mode
  const getMessageCount = () => {
    if (conversationMode === 'unified') {
      return currentMessages.length;
    } else {
      return displayMessages.length;
    }
  };
  
  // Handle ticket click
  const handleTicketClick = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setConversationMode('perTicket');
  };
  
  // Handle "Lihat Semua Pesan" click
  const handleViewAllMessages = () => {
    setConversationMode('unified');
    setSelectedTicketId(null);
  };

  const getTabCounts = () => ({
    needReply: demoContacts.filter(c => c.category === 'needReply').length,
    automated: demoContacts.filter(c => c.category === 'automated').length,
    completed: demoContacts.filter(c => c.category === 'completed').length
  });

  const tabCounts = getTabCounts();

  // Drawer menu items
  const drawerMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', href: '/chat', active: true },
    { icon: Users, label: 'Kontak', href: '/contacts' },
    { icon: FileText, label: 'Tiket', href: '/tickets' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Headphones, label: 'Agen', href: '/agents' },
    { icon: Settings, label: 'Pengaturan', href: '/settings' },
    { icon: User, label: 'Profil', href: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Drawer Menu Button */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">WhatsApp Admin</h2>
                    <p className="text-xs text-gray-500">Customer Service</p>
                  </div>
                </div>
              </div>
              
              {/* Drawer Menu Items */}
              <div className="p-2">
                {drawerMenuItems.map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      item.active 
                        ? "bg-blue-50 text-blue-600 border border-blue-200" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* Drawer Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-200">A</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Menu Button */}
          <Button variant="ghost" size="sm" className="hidden lg:flex">
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              💬 Enhanced Chat Demo
            </h1>
            <p className="text-xs text-gray-500">Contact-based Conversation + Navigation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">A</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Contact Sidebar */}
        <div className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-80"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            {!sidebarCollapsed && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Percakapan</h2>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" title="Urutkan">
                          <Clock className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy('time')}>
                          <Clock className="h-4 w-4 mr-2" />
                          Waktu Terbaru
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('unread')}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Belum Dibaca
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('name')}>
                          <Phone className="h-4 w-4 mr-2" />
                          Nama A-Z
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      title="Toggle sidebar"
                    >
                      <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari kontak atau pesan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </>
            )}
            
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Tabs */}
          {!sidebarCollapsed && (
            <div className="flex border-b border-gray-200 flex-shrink-0">
              <button
                className={cn(
                  "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
                  selectedTab === 'needReply'
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => setSelectedTab('needReply')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Perlu Dibalas</span>
                  {tabCounts.needReply > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {tabCounts.needReply}
                    </Badge>
                  )}
                </div>
              </button>
              
              <button
                className={cn(
                  "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
                  selectedTab === 'automated'
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => setSelectedTab('automated')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Otomatis</span>
                  {tabCounts.automated > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs">
                      {tabCounts.automated}
                    </Badge>
                  )}
                </div>
              </button>
              
              <button
                className={cn(
                  "flex-1 py-3 px-2 text-sm font-medium transition-colors relative",
                  selectedTab === 'completed'
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => setSelectedTab('completed')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Selesai</span>
                  {tabCounts.completed > 0 && (
                    <Badge className="bg-green-500 text-white text-xs">
                      {tabCounts.completed}
                    </Badge>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredContacts.length > 0 ? (
              <div className={cn("divide-y divide-gray-100", sidebarCollapsed && "p-1 space-y-1")}>
                {filteredContacts.map((contact) => {
                  const isActive = selectedContactId === contact.id;
                  const onlineStatus = getOnlineStatus(contact.last_seen);
                  const priorityIcon = getPriorityIcon(contact.priority, contact.unread_count);
                  
                  return (
                    <div
                      key={contact.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:bg-gray-50",
                        isActive && "bg-blue-50 border-r-2 border-blue-600",
                        sidebarCollapsed && "p-2 rounded-lg hover:bg-gray-100"
                      )}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      {sidebarCollapsed ? (
                        <div className="flex justify-center">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={contact.avatar_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            {contact.unread_count > 0 && (
                              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                                {contact.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={contact.avatar_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                              onlineStatus === 'online' && "bg-green-500",
                              onlineStatus === 'recent' && "bg-yellow-500",
                              onlineStatus === 'offline' && "bg-gray-400"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                  {contact.name}
                                </h3>
                                {priorityIcon}
                                {contact.assigned_to && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
                                    {contact.assigned_to.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-xs text-gray-500">
                                  {formatTime(contact.last_activity)}
                                </span>
                                {contact.unread_count > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    {contact.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Contact Labels */}
                            {getContactLabels(contact).length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {getContactLabels(contact).slice(0, 2).map((label: any) => (
                                  <Badge 
                                    key={label?.id} 
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded-full font-medium",
                                      label?.color,
                                      label?.textColor
                                    )}
                                  >
                                    {label?.name}
                                  </Badge>
                                ))}
                                {getContactLabels(contact).length > 2 && (
                                  <Badge className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    +{getContactLabels(contact).length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {contact.last_message.content}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleQuickAction('read', contact)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Tandai Dibaca
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickAction('star', contact)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Bintangi
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickAction('archive', contact)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Arsipkan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Tidak ada kontak yang ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {activeContact ? `Chat dengan ${activeContact.name}` : 'Enhanced Chat Demo'}
              </h3>
              {activeContact && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{getMessageCount()} pesan</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getOnlineStatus(activeContact.last_seen) === 'online' && "bg-green-500",
                    getOnlineStatus(activeContact.last_seen) === 'recent' && "bg-yellow-500",
                    getOnlineStatus(activeContact.last_seen) === 'offline' && "bg-gray-400"
                  )} />
                </div>
              )}
            </div>
          </div>

          {/* Message Expiry Warning */}
          {activeContact && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Pesan Akan Kadaluarsa</span>
                    <span className="ml-2 font-mono bg-yellow-100 px-2 py-1 rounded text-xs">23:58:42</span>
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Hanya admin yang dapat mengirim pesan setelah periode ini berakhir
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {displayMessages.length > 0 ? (
              displayMessages.map((message: Message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.direction === 'outgoing' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group",
                      message.direction === 'outgoing'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    {/* Ticket Badge - Only show in unified mode */}
                    {conversationMode === 'unified' && message.ticket_id && (
                      <div className={cn(
                        "absolute -top-2 text-xs px-2 py-0.5 rounded-full text-white font-medium",
                        message.direction === 'outgoing' ? "-right-1" : "-left-1",
                        message.ticket_id === 1 && "bg-orange-500",
                        message.ticket_id === 2 && "bg-green-500", 
                        message.ticket_id === 3 && "bg-blue-500"
                      )}>
                        #{message.ticket_id}
                      </div>
                    )}

                    {/* 📎 Enhanced Message Content based on type */}
                    <div className="space-y-2">
                      {/* 📄 Document Message */}
                      {message.id === "3" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg border border-white/20">
                            <FileText className="h-8 w-8 text-blue-300" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Katalog_Produk_2024.pdf</p>
                              <p className="text-xs opacity-70">2.4 MB • PDF Document</p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 🎵 Voice Message */}
                      {message.id === "4" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center space-x-3 p-3 bg-gray-200 rounded-lg">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-700 hover:bg-gray-300">
                              <Play className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-1">
                                {/* Waveform representation */}
                                {[...Array(20)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1 bg-gray-600 rounded-full ${
                                      i < 8 ? 'h-2' : i < 12 ? 'h-4' : i < 16 ? 'h-3' : 'h-2'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>0:15</span>
                                <span>1x</span>
                              </div>
                            </div>
                            <Volume2 className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                      )}

                      {/* 📷 Image Message */}
                      {message.id === "5" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="relative">
                            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center border">
                              <div className="text-center text-gray-500">
                                <Image className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm font-medium">Product_Image.jpg</p>
                                <p className="text-xs">1920x1080 • 2.1 MB</p>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 🎥 Video Message */}
                      {message.id === "6" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="relative">
                            <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center border">
                              <div className="text-center text-white">
                                <div className="relative mb-2">
                                  <Video className="h-12 w-12 mx-auto" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0 bg-white/20 text-white hover:bg-white/30 rounded-full">
                                      <Play className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm font-medium">Demo_Video.mp4</p>
                                <p className="text-xs opacity-70">1:23 • 15.2 MB</p>
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              1:23
                            </div>
                            <div className="absolute top-2 right-2">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 bg-black/50 text-white hover:bg-black/70">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 📍 Location Message */}
                      {message.id === "7" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="bg-gray-200 rounded-lg p-3 border">
                            <div className="flex items-start space-x-3">
                              <div className="bg-red-500 p-2 rounded-lg">
                                <MapPin className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Toko Ahmad Syukur</p>
                                <p className="text-xs text-gray-600 mb-2">Jl. Sudirman No. 123, Jakarta Pusat</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>📍 -6.2088, 106.8456</div>
                                  <div>🕐 Open until 10:00 PM</div>
                                </div>
                                <div className="flex space-x-2 mt-2">
                                  <Button size="sm" variant="outline" className="h-6 text-xs">
                                    📱 Call
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-6 text-xs">
                                    🗺️ Directions
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 💰 Payment Link Message - For message ID 2 */}
                      {message.id === "2" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="bg-green-500 p-1 rounded">
                                  <span className="text-white text-xs">💰</span>
                                </div>
                                <span className="text-sm font-medium text-green-800">Payment Link</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                            </div>
                            <p className="text-sm text-green-700 mb-2">Produk A - Rp 150.000</p>
                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                              💳 Pay Now
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 😊 Animated Sticker - For message ID 8 */}
                      {message.id === "8" && (
                        <div className="space-y-2">
                          <p className="text-sm">{message.content}</p>
                          <div className="text-center py-2">
                            <div className="inline-block">
                              <div className="text-5xl animate-pulse">
                                👍
                              </div>
                              <p className="text-xs text-gray-600 mt-1">Thumbs up sticker</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Regular text messages */}
                      {!["2", "3", "4", "5", "6", "7", "8"].includes(message.id) && (
                        <p className="text-sm">{message.content}</p>
                      )}

                      {/* 📞 Contact Card Message - For message ID 1 when showing as contact */}
                      {message.id === "1" && message.content.includes("tertarik") && (
                        <div className="mt-2">
                          <div className="bg-white rounded-lg p-3 border shadow-sm">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  AS
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Ahmad Syukur</p>
                                <p className="text-xs text-gray-600">📱 +62 812-3456-7890</p>
                                <p className="text-xs text-gray-600">✉️ ahmad@example.com</p>
                              </div>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                  📱 Call
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                  💬 Chat
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 😊 Sticker Message - For message ID 8 */}
                      {message.id === "8" && (
                        <div className="mt-2 text-center">
                          <div className="inline-block bg-transparent">
                            <div className="text-6xl animate-bounce">
                              🎉
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Celebration Sticker</p>
                          </div>
                        </div>
                      )}

                      {/* 💰 Payment/Invoice Message - For outgoing message */}
                      {message.id === "2" && (
                        <div className="mt-2">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="bg-green-500 p-1 rounded">
                                  <span className="text-white text-xs">💰</span>
                                </div>
                                <span className="text-sm font-medium text-green-800">Payment Link</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                            </div>
                            <p className="text-sm text-green-700 mb-2">Produk A - Rp 150.000</p>
                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                              💳 Pay Now
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 💝 Message Reactions - Backend Requirement: Reaction System */}
                    {message.id === "1" && (
                      <div className="flex gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-200">
                          👍 1
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-200">
                          ❤️ 2
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Message status indicators */}
                    {message.id === "5" && (
                      <div className="flex gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-200">
                          😍 3
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-200">
                          👏 1
                        </Badge>
                      </div>
                    )}

                    {/* Timestamp and Status */}
                    <div className={cn(
                      "flex items-center justify-between mt-2 text-xs",
                      message.direction === 'outgoing' ? "text-blue-100" : "text-gray-500"
                    )}>
                      <span>
                        {formatTime(message.created_at)}
                        {message.id === "9" && " (edited)"}
                      </span>
                      {message.direction === 'outgoing' && (
                        <div className="flex items-center space-x-1">
                          {/* Different message statuses */}
                          {message.id === "9" ? (
                            <CheckCheck className="h-3 w-3 text-gray-400" />
                          ) : message.id === "6" ? (
                            <div className="flex items-center">
                              <CheckCheck className="h-3 w-3 text-blue-300" />
                              <span className="ml-1 text-xs">Seen</span>
                            </div>
                          ) : (
                            <CheckCheck className="h-3 w-3 text-blue-300" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 🔧 Message Actions - Backend Requirement: Message Management */}
                    <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 ml-2">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            console.log('🔄 Backend Required: POST /api/messages/reply', { message_id: message.id });
                          }}>
                            <Reply className="h-3 w-3 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            console.log('🔄 Backend Required: POST /api/messages/forward', { message_id: message.id });
                          }}>
                            <Forward className="h-3 w-3 mr-2" />
                            Forward
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            console.log('🔄 Backend Required: Copy to clipboard');
                          }}>
                            <Copy className="h-3 w-3 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            console.log('🔄 Backend Required: POST /api/messages/star', { message_id: message.id });
                          }}>
                            <Star className="h-3 w-3 mr-2" />
                            Star
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            console.log('🔄 Backend Required: POST /api/messages/reactions', { 
                              message_id: message.id, 
                              emoji: '👍' 
                            });
                          }}>
                            <ThumbsUp className="h-3 w-3 mr-2" />
                            React
                          </DropdownMenuItem>
                          {/* File-specific actions */}
                          {["3", "5", "6"].includes(message.id) && (
                            <DropdownMenuItem onClick={() => {
                              console.log('🔄 Backend Required: GET /api/files/download', { message_id: message.id });
                            }}>
                              <Download className="h-3 w-3 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {message.direction === 'outgoing' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                console.log('🔄 Backend Required: PUT /api/messages/edit', { message_id: message.id });
                              }}>
                                <Edit3 className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                console.log('🔄 Backend Required: DELETE /api/messages/' + message.id);
                              }} className="text-red-600">
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-16 text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Pilih Kontak</h3>
                  <p className="text-sm">Klik kontak di sidebar untuk melihat percakapan</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Message Input - Reveals Backend Requirements */}
          {activeContact && (
            <div className="border-t border-gray-200 bg-white space-y-3 p-4">
              {/* 🔍 Search in Chat - Backend Requirement: Message Search API */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search in this chat..."
                    className="pl-9 h-8 text-sm"
                    onChange={(e) => {
                      // 🔄 Backend Required: GET /api/messages/search
                      console.log('🔄 Backend Required: GET /api/messages/search', {
                        query: e.target.value,
                        contact_id: activeContact.id
                      });
                    }}
                  />
                </div>
                <Button size="sm" variant="outline" title="Message Filters">
                  <Filter className="h-3 w-3" />
                </Button>
              </div>

              {/* 💬 Main Input Area */}
              <div className="flex items-end space-x-2">
                {/* File Upload - Backend Requirement: File Processing */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" title="Attach Files">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {
                      console.log('🔄 Backend Required: POST /api/upload - Image');
                    }}>
                      <FileImage className="h-4 w-4 mr-2" />
                      Photo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      console.log('🔄 Backend Required: POST /api/upload - Document');
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      console.log('🔄 Backend Required: POST /api/upload - Video');
                    }}>
                      <FileVideo className="h-4 w-4 mr-2" />
                      Video
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      console.log('🔄 Backend Required: Location sharing API');
                    }}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Message Input with Auto-Draft */}
                <div className="flex-1">
                  <textarea
                    placeholder="Type a message..."
                    className="w-full min-h-[40px] max-h-32 resize-none border border-gray-200 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => {
                      // 🔄 Backend Required: Auto-save drafts
                      console.log('🔄 Backend Required: POST /api/drafts', {
                        contact_id: activeContact.id,
                        content: e.target.value
                      });
                      
                      // 🔄 Backend Required: WebSocket typing indicator
                      console.log('🔄 Backend Required: WS typing_start', {
                        contact_id: activeContact.id,
                        admin_id: 'current_admin'
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // 🔄 Backend Required: Send message
                        console.log('🔄 Backend Required: POST /api/messages/send', {
                          content: (e.target as HTMLTextAreaElement).value,
                          contact_id: activeContact.id,
                          type: 'text'
                        });
                      }
                    }}
                  />
                </div>

                {/* Voice Recording - Backend Requirement: Audio Processing */}
                <Button
                  size="sm"
                  variant="outline"
                  title="Voice Message"
                  onClick={() => {
                    console.log('🔄 Backend Required: POST /api/messages/voice', {
                      contact_id: activeContact.id,
                      audio_data: 'base64_audio_data'
                    });
                  }}
                >
                  <Mic className="h-4 w-4" />
                </Button>

                {/* Quick Replies - Backend Requirement: Template Management */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" title="Quick Replies">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="text-xs font-medium p-2 text-gray-500">Quick Replies:</div>
                    <DropdownMenuItem onClick={() => {
                      console.log('🔄 Backend Required: GET /api/templates/quick-replies');
                    }}>
                      "Terima kasih atas pertanyaannya..."
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      "Mohon tunggu sebentar..."
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      "Apakah ada yang bisa kami bantu lagi?"
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Emoji Picker */}
                <Button size="sm" variant="outline" title="Add Emoji">
                  <Smile className="h-4 w-4" />
                </Button>

                {/* Send Button */}
                <Button size="sm" title="Send Message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* ⌨️ Typing Indicator - Backend Requirement: Real-time Presence */}
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex space-x-1 mr-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                {activeContact.name} is typing...
              </div>

              {/* 🔥 Backend Requirements Summary */}
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2 text-sm">🔥 Enhanced Features - Backend Requirements:</h4>
                <div className="text-xs text-yellow-700 grid grid-cols-1 gap-1">
                  <div>• POST /api/messages/send - Text messaging</div>
                  <div>• POST /api/upload - File upload & processing</div>
                  <div>• POST /api/messages/voice - Voice messages</div>
                  <div>• GET /api/messages/search - In-chat search</div>
                  <div>• GET /api/templates/quick-replies - Templates</div>
                  <div>• POST /api/drafts - Auto-save drafts</div>
                  <div>• WebSocket: typing indicators & presence</div>
                  <div>• File processing: thumbnails, metadata</div>
                  <div>• Location sharing & media handling</div>
                </div>
              </div>

              {/* 🚀 Enhanced Message Features Demo */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-800 mb-3">🚀 Advanced Message Features:</h4>
                
                {/* Message Types Demo */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-700">Message Types & Actions:</div>
                  
                  {/* Audio Message */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">🎵 Audio Message</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/messages/voice');
                      }}>
                        <Mic className="h-3 w-3 mr-1" />
                        Record
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost">
                        <Play className="h-3 w-3" />
                      </Button>
                      <div className="flex-1 bg-gray-200 h-1 rounded-full">
                        <div className="bg-blue-500 h-1 rounded-full w-1/3"></div>
                      </div>
                      <span className="text-xs text-gray-500">0:15</span>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">📎 File Upload</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/upload');
                      }}>
                        <Paperclip className="h-3 w-3 mr-1" />
                        Attach
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">document.pdf</p>
                        <p className="text-xs text-gray-500">2.4 MB</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Message Reactions */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">💝 Message Reactions</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/messages/reactions');
                      }}>
                        <Heart className="h-3 w-3 mr-1" />
                        React
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">👍 3</Badge>
                      <Badge variant="secondary" className="text-xs">❤️ 2</Badge>
                      <Badge variant="secondary" className="text-xs">😊 1</Badge>
                    </div>
                  </div>

                  {/* Message Threading */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">↩️ Message Threading</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/messages/reply');
                      }}>
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                    <div className="text-xs text-blue-600 mb-1">↳ Replying to: "Halo, bagaimana kabar?"</div>
                    <div className="text-sm">Baik, terima kasih!</div>
                  </div>

                  {/* Location Sharing */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">📍 Location Sharing</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/messages/location');
                      }}>
                        <MapPin className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Jakarta Pusat</p>
                        <p className="text-xs text-gray-500">-6.2088, 106.8456</p>
                      </div>
                    </div>
                  </div>

                  {/* 💰 Payment & E-commerce Messages */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">💰 Payment Link</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/payments/create-link');
                      }}>
                        <span className="h-3 w-3 mr-1">💳</span>
                        Create
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Produk A</span>
                        <span className="text-sm font-bold text-green-600">Rp 150.000</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        💳 Pay with GoPay/OVO/DANA
                      </Button>
                    </div>
                  </div>

                  {/* 😊 Stickers & Emojis */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">😊 Stickers & Reactions</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: GET /api/stickers/packs');
                      }}>
                        <span className="h-3 w-3 mr-1">🎭</span>
                        Browse
                      </Button>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <div className="text-center">
                        <div className="text-2xl animate-bounce">🎉</div>
                        <span className="text-xs text-gray-500">Celebrate</span>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl animate-pulse">👍</div>
                        <span className="text-xs text-gray-500">Like</span>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">❤️</div>
                        <span className="text-xs text-gray-500">Love</span>
                      </div>
                    </div>
                  </div>

                  {/* 📞 Contact Cards */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">📞 Contact Sharing</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/contacts/share');
                      }}>
                        <User className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">AS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ahmad Syukur</p>
                        <p className="text-xs text-gray-500">+62 812-3456-7890</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        💬 Chat
                      </Button>
                    </div>
                  </div>

                  {/* 📅 Calendar & Scheduling */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">📅 Schedule Meeting</span>
                      <Button size="sm" variant="outline" onClick={() => {
                        console.log('🔄 Backend Required: POST /api/calendar/create-event');
                      }}>
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Product Demo</p>
                      <p className="text-xs text-gray-600">📅 Tomorrow, 2:00 PM</p>
                      <p className="text-xs text-gray-600">📍 Office Meeting Room</p>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
                          ✅ Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
                          ❌ Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Features */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-700">Real-time Features:</div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">⌨️ Typing Indicators</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Ahmad is typing...</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">🟢 Online Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">✓✓ Read Receipts</span>
                      <CheckCheck className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Complete Backend API Requirements */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2 text-sm">📋 Complete Backend API Requirements:</h5>
                  <div className="text-xs text-green-700 space-y-1">
                    <div><strong>Messages:</strong> POST /send, PUT /edit, DELETE /:id, POST /reply, POST /forward</div>
                    <div><strong>Files:</strong> POST /upload, GET /download/:id, POST /thumbnail</div>
                    <div><strong>Voice:</strong> POST /voice, GET /voice/:id/download</div>
                    <div><strong>Reactions:</strong> POST /reactions, DELETE /reactions</div>
                    <div><strong>Search:</strong> GET /search?q=query&contact_id=id</div>
                    <div><strong>Templates:</strong> GET /templates, POST /templates, PUT /templates/:id</div>
                    <div><strong>Drafts:</strong> POST /drafts, GET /drafts/:contact_id</div>
                    <div><strong>WebSocket Events:</strong> typing_start, typing_stop, message_delivered, message_read, presence_update</div>
                    <div><strong>Location:</strong> POST /location, GET /location/:id</div>
                    <div><strong>Status:</strong> PUT /messages/:id/read, GET /messages/:id/read-by</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Contact Info + Conversation Mode + Ticket History */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Contact Info Section */}
          {activeContact && (
            <div className="flex-shrink-0 border-b border-gray-200">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={activeContact.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(activeContact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{activeContact.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{activeContact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getOnlineStatus(activeContact.last_seen) === 'online' && "bg-green-500",
                        getOnlineStatus(activeContact.last_seen) === 'recent' && "bg-yellow-500",
                        getOnlineStatus(activeContact.last_seen) === 'offline' && "bg-gray-400"
                      )} />
                      <span>
                        {getOnlineStatus(activeContact.last_seen) === 'online' && 'Online'}
                        {getOnlineStatus(activeContact.last_seen) === 'recent' && 'Baru saja'}
                        {getOnlineStatus(activeContact.last_seen) === 'offline' && 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details - Scrollable when editing */}
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm">Detail Kontak</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleEditMode}
                        className="text-xs h-6"
                      >
                        {isEditingContact ? '❌ Batal' : '✏️ Edit'}
                      </Button>
                    </div>
                    
                    {/* Contact Labels - Always visible */}
                    {getContactLabels(activeContact).length > 0 && (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Contact Label</label>
                        <div className="flex items-center gap-1 flex-wrap">
                          {getContactLabels(activeContact).map((label: any) => (
                            <Badge 
                              key={label?.id} 
                              className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                label?.color,
                                label?.textColor
                              )}
                            >
                              {label?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Form - Only show when editing */}
                    {isEditingContact && (
                      <>
                        {/* First Name */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">First Name</label>
                          <Input 
                            value={editContactForm.firstName} 
                            onChange={(e) => handleContactFormChange('firstName', e.target.value)}
                            className="text-sm h-8"
                            placeholder="Masukkan nama depan"
                          />
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Last Name</label>
                          <Input 
                            value={editContactForm.lastName} 
                            onChange={(e) => handleContactFormChange('lastName', e.target.value)}
                            className="text-sm h-8"
                            placeholder="Masukkan nama belakang"
                          />
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Birth Date</label>
                          <Input 
                            type="date"
                            value={editContactForm.birthDate}
                            onChange={(e) => handleContactFormChange('birthDate', e.target.value)}
                            className="text-sm h-8"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Gender</label>
                          <select 
                            value={editContactForm.gender}
                            onChange={(e) => handleContactFormChange('gender', e.target.value)}
                            className="w-full text-sm h-8 border border-gray-200 rounded-md px-2 bg-white"
                          >
                            <option value="">Pilih gender</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                          </select>
                        </div>

                        {/* Business Name */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Business Name</label>
                          <Input 
                            value={editContactForm.businessName}
                            onChange={(e) => handleContactFormChange('businessName', e.target.value)}
                            className="text-sm h-8"
                            placeholder="Nama perusahaan"
                          />
                        </div>

                        {/* Job Position */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Job Position</label>
                          <Input 
                            value={editContactForm.jobPosition}
                            onChange={(e) => handleContactFormChange('jobPosition', e.target.value)}
                            className="text-sm h-8"
                            placeholder="Posisi pekerjaan"
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Email</label>
                          <Input 
                            type="email"
                            value={editContactForm.email}
                            onChange={(e) => handleContactFormChange('email', e.target.value)}
                            className="text-sm h-8"
                            placeholder="email@example.com"
                          />
                        </div>

                        {/* Save Button */}
                        <Button 
                          className="w-full mt-4" 
                          size="sm"
                          onClick={handleSaveContact}
                        >
                          💾 Simpan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Mode Section */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h4 className="font-medium text-gray-900 mb-3">Mode Percakapan</h4>
            <div className="flex gap-2">
              <Button
                variant={conversationMode === 'unified' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setConversationMode('unified')}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Terpadu
              </Button>
              <Button
                variant={conversationMode === 'perTicket' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setConversationMode('perTicket')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Per Tiket
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {conversationMode === 'unified' ? (
                <>
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                  <span>1 percakapan • {getMessageCount()} pesan</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 inline mr-1 text-orange-500" />
                  <span>{selectedTicketId ? `Tiket #${selectedTicketId}` : '1 tiket'} • {getMessageCount()} pesan</span>
                </>
              )}
            </div>
          </div>

          {/* Ticket History Section */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">🕓 Riwayat Tiket</h4>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-3">
                {/* Active Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <h5 className="text-sm font-medium text-gray-700">Percakapan Aktif (1)</h5>
                  </div>
                  {demoTicketEpisodes
                    .filter(episode => episode.category === 'PERLU_DIBALAS')
                    .map((episode) => (
                      <div
                        key={episode.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                          selectedTicketId === episode.id ? "bg-orange-50 border-orange-300" : "bg-white border-gray-200"
                        )}
                        onClick={() => handleTicketClick(episode.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-orange-600">Tiket #{episode.id}</span>
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                Perlu Dibalas
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                              {episode.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {episode.messageCount} pesan
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          Pesan Terakhir: {episode.lastMessage.content.substring(0, 50)}...
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(episode.created_at)}</span>
                          {episode.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {episode.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Completed Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <h5 className="text-sm font-medium text-gray-700">Selesai (1)</h5>
                  </div>
                  {demoTicketEpisodes
                    .filter(episode => episode.category === 'SELESAI')
                    .map((episode) => (
                      <div
                        key={episode.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                          selectedTicketId === episode.id ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
                        )}
                        onClick={() => handleTicketClick(episode.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-green-600">Tiket #{episode.id}</span>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                              {episode.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {episode.messageCount} pesan
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(episode.created_at)}</span>
                          <span>Selesai</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Automated Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <h5 className="text-sm font-medium text-gray-700">Otomatis (1)</h5>
                  </div>
                  {demoTicketEpisodes
                    .filter(episode => episode.category === 'OTOMATIS')
                    .map((episode) => (
                      <div
                        key={episode.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50",
                          selectedTicketId === episode.id ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                        )}
                        onClick={() => handleTicketClick(episode.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-600">Tiket #{episode.id}</span>
                              <Bot className="h-3 w-3 text-blue-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                              {episode.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {episode.messageCount} pesan
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(episode.created_at)}</span>
                          <span>Otomatis</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 