import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import "@/lib/debug"; // Load debug utilities

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WhatsApp Admin CS - Customer Service Management System",
  description: "Complete WhatsApp Admin Customer Service Management System with real-time chat, session management, and analytics",
  keywords: "WhatsApp, Admin, Customer Service, Chat, Management, WAHA",
  authors: [{ name: "WhatsApp Admin CS Team" }],
  viewport: "width=device-width, initial-scale=1",
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
      </body>
    </html>
  );
}
