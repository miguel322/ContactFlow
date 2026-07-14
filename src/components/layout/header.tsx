"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrgSwitcher } from "./org-switcher";
import { NotificationCenter } from "./notification-center";
import { ThemeToggle } from "../shared/theme-toggle";
import { LanguageSelector } from "../shared/language-selector";
import { UserMenu } from "./user-menu";
import { Menu, Search } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/contacts?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/contacts");
    }
  };

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-805 rounded-lg cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Org Switcher */}
        <OrgSwitcher />

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center relative w-64 lg:w-80"
        >
          <Search size={16} className="absolute left-3 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar contactos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/55 focus:bg-white dark:focus:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Localization & Toggles */}
        <LanguageSelector />
        <ThemeToggle />

        {/* Actions */}
        <NotificationCenter />
        
        {/* Divider */}
        <div className="h-6 w-px bg-neutral-250 dark:bg-neutral-800 mx-1" />

        {/* Profile */}
        <UserMenu />
      </div>
    </header>
  );
}
