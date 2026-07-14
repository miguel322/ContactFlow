"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CheckSquare,
  Calendar,
  Download,
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.contacts"), href: "/contacts", icon: Users },
    { name: t("nav.interactions"), href: "/interactions", icon: MessageSquare },
    { name: t("nav.tasks"), href: "/tasks", icon: CheckSquare },
    { name: t("nav.calendar"), href: "/calendar", icon: Calendar },
    { name: t("nav.imports"), href: "/imports", icon: Download },
    { name: t("nav.integrations"), href: "/integrations", icon: Share2 },
    { name: t("nav.settings"), href: "/settings/profile", icon: Settings },
  ];

  return (
    <aside
      className={`bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-all duration-300 z-10 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 h-16 border-b border-neutral-100 dark:border-neutral-800/60">
          {!collapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              ContactFlow
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350 cursor-pointer ml-auto transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href.split("/profile")[0]));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group relative ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-semibold"
                    : "text-neutral-550 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-indigo-500 dark:text-indigo-400" : "text-neutral-450 dark:text-neutral-500"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-14 scale-0 group-hover:scale-100 bg-neutral-950 dark:bg-neutral-800 text-white dark:text-neutral-100 text-xs px-2 py-1 rounded shadow-lg z-30 transition-transform duration-200 origin-left whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/60 text-[10px] text-neutral-400 dark:text-neutral-500 text-center">
          &copy; {new Date().getFullYear()} ContactFlow
        </div>
      )}
    </aside>
  );
}
