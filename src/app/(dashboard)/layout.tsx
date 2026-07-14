"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar Slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer container */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-neutral-900 h-full shadow-2xl animate-slide-in">
            <Sidebar collapsed={false} setCollapsed={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <React.Suspense fallback={<div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900" />}>
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </React.Suspense>
        
        {/* Children panel */}
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
