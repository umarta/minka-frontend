"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Quick Replies", href: "/quick-replies", icon: Zap },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Labels", href: "/labels", icon: Tags },
  { name: "Support Agents", href: "/agents", icon: Headphones },
  // { name: "Analytics", href: "/analytics", icon: Activity },
];

const settingsNavigation = [
  { name: "Active Sessions", href: "/sessions", icon: Smartphone },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col px-6 py-4 overflow-y-auto bg-white border-r border-gray-200 grow gap-y-5">
      {/* Logo */}
      <div className="flex items-center h-16 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minka AI</h1>
            <p className="text-sm text-gray-500">Powered by Kame</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1">
        <ul role="list" className="flex flex-col flex-1 gap-y-7">
          <li>
            <div className="text-xs font-semibold leading-6 tracking-wide text-gray-400 uppercase">
              Main Navigation
            </div>
            <ul role="list" className="mt-2 -mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-700 hover:text-green-700 hover:bg-green-50",
                        "group flex gap-x-3 rounded-l-md p-2 text-sm leading-6 font-medium transition-colors"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive
                            ? "text-green-600"
                            : "text-gray-400 group-hover:text-green-600",
                          "h-5 w-5 shrink-0"
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
          {/* <li>
            <div className="text-xs font-semibold leading-6 tracking-wide text-gray-400 uppercase">
              Account
            </div>
            <ul role="list" className="mt-2 -mx-2 space-y-1">
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
          </li> */}

          {/* User info and logout */}
          <li className="mt-auto">
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center p-2 text-sm font-medium text-gray-700 gap-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full">
                  <span className="text-sm font-medium text-white">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.username || "Admin"}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role || "admin"}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full p-2 mt-2 text-sm font-medium leading-6 text-gray-700 transition-colors gap-x-3 rounded-l-md hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                Sign out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
