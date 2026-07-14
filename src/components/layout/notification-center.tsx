"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, CircleAlert, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationCenter() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to notification updates
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAllRead = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .is("read_at", null);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
    setLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden py-1">
            <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-850/50">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-150">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={10} /> : <Check size={10} />}
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                      !n.read_at ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                    }`}
                  >
                    <div className="flex gap-2">
                      <CircleAlert size={14} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                          {n.title}
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-450 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-550 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
