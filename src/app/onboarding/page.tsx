"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Insert organization
      const orgId = crypto.randomUUID();
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 7);

      const { error: orgError } = await supabase.from("organizations").insert({
        id: orgId,
        name: orgName,
        slug,
        owner_id: user.id,
        created_by: user.id,
      });

      if (orgError) {
        setError(orgError.message);
        setLoading(false);
        return;
      }

      // 2. Insert member as owner
      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: orgId,
        profile_id: user.id,
        role: "owner",
        created_by: user.id,
      });

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // 3. Set organization cookie
      document.cookie = `contactflow:org_id=${orgId}; path=/; max-age=31536000; SameSite=Lax`;

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error al crear la organización");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              ContactFlow
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium cursor-pointer"
            >
              {t("auth.signOut")}
            </button>
          </div>

          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Crea tu Organización
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Para empezar a usar ContactFlow, crea un espacio de trabajo para ti o para tu equipo.
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="orgName"
                className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Nombre de la organización
              </label>
              <input
                id="orgName"
                type="text"
                required
                placeholder="Mi Empresa o Personal"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Comenzar"}
            </button>
          </form>

          <div className="flex justify-center mt-2 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </main>
  );
}
