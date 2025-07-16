'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationToggle } from '@/components/ui/notification-toggle';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Input
            className="block w-full rounded-md border-0 bg-gray-50 py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-green-600 sm:text-sm"
            placeholder="Search messages, contacts, tickets..."
            type="search"
          />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Sound Toggle */}
          <NotificationToggle variant="ghost" size="sm" />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-x-3">
              <div className="hidden lg:flex lg:flex-col lg:items-end lg:text-sm lg:leading-6">
                <div className="text-gray-900 font-medium">
                  {user?.username || 'Admin'}
                </div>
                <div className="text-gray-400 capitalize">
                  {user?.role || 'admin'}
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                <span className="text-sm font-medium text-white">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 