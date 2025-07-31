"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationToggle } from "@/components/ui/notification-toggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex items-center h-16 px-4 bg-white border-b border-gray-200 shadow-sm shrink-0 gap-x-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex self-stretch flex-1 gap-x-4 lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
          <Input
            className="block w-full py-2 pl-10 pr-3 text-gray-900 border-0 rounded-md bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-green-600 sm:text-sm"
            placeholder="Search messages, contacts, tickets..."
            type="search"
          />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Sound Toggle */}
          <NotificationToggle variant="ghost" size="sm" />

          {/* Notifications */}
          {/* <Button
            variant="ghost"
            size="sm"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="w-6 h-6" aria-hidden="true" />
            <span className="absolute flex w-3 h-3 -top-1 -right-1">
              <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-3 h-3 bg-red-500 rounded-full"></span>
            </span>
          </Button> */}

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-x-3">
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:text-sm lg:leading-6">
                <div className="font-medium text-gray-900">
                  {user?.username || "Admin"}
                </div>
                <div className="text-gray-400 capitalize">
                  {user?.role || "admin"}
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {user?.username?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
