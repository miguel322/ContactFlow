"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { LogOut, ShieldAlert, User, Settings, Layers } from "lucide-react";

interface UserProfile {
  display_name: string;
  avatar_url: string | null;
  email: string;
}

export function UserMenu() {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile({
        display_name: prof?.display_name || user.email?.split("@")[0] || "Usuario",
        avatar_url: prof?.avatar_url || null,
        email: user.email || "",
      });
    }
    loadProfile();
  }, [supabase]);

  const handleSignOut = async (scope: "local" | "global") => {
    setDropdownOpen(false);
    await supabase.auth.signOut({ scope });
    // Remove cookies
    document.cookie = "contactflow:org_id=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  };

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
      : "U";

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 text-indigo-750 dark:text-indigo-300 font-semibold text-sm transition-colors cursor-pointer overflow-hidden border border-indigo-200 dark:border-indigo-850"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden py-1">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                {profile?.display_name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {profile?.email}
              </p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/settings/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User size={15} className="text-neutral-400" />
                <span>{t("nav.profile")}</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/settings/organization");
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Settings size={15} className="text-neutral-400" />
                <span>{t("nav.settings")}</span>
              </button>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

            <div className="py-1">
              <button
                onClick={() => handleSignOut("local")}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>{t("auth.signOut")}</span>
              </button>

              <button
                onClick={() => handleSignOut("global")}
                className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldAlert size={14} />
                <span>{t("auth.signOutAll")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
