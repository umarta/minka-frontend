'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Users,
  Ticket,
  Settings,
  BarChart3,
  Headphones,
  Tags,
  Smartphone,
  Activity,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/stores/auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Active Sessions', href: '/sessions', icon: Smartphone },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Labels', href: '/labels', icon: Tags },
  { name: 'Support Agents', href: '/agents', icon: Headphones },
  { name: 'Analytics', href: '/analytics', icon: Activity },
];

const settingsNavigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 py-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WAHA Admin</h1>
            <p className="text-sm text-gray-500">WhatsApp CS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
              Main Navigation
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50',
                        'group flex gap-x-3 rounded-l-md p-2 text-sm leading-6 font-medium transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Settings */}
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
              Account
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50',
                        'group flex gap-x-3 rounded-l-md p-2 text-sm leading-6 font-medium transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User info and logout */}
          <li className="mt-auto">
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-x-3 p-2 text-sm font-medium text-gray-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                  <span className="text-sm font-medium text-white">
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.username || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role || 'admin'}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2 flex w-full items-center gap-x-3 rounded-l-md p-2 text-sm leading-6 font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                Sign out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
} 