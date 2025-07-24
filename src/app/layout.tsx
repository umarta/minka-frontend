import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/debug"; // Load debug utilities
import { createWebSocketManager } from '@/lib/websocket';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Inisialisasi WebSocketManager sekali di root
if (typeof window !== 'undefined') {
  createWebSocketManager();
}

export const metadata: Metadata = {
  title: "Kame | Minka  AI",
  description: "Complete WhatsApp Admin Customer Service Management System with real-time chat, session management, and analytics",
  keywords: "WhatsApp, Admin, Customer Service, Chat, Management, WAHA",
  authors: [{ name: "WhatsApp Admin CS Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
