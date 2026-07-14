"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Building, Save, Loader2 } from "lucide-react";

interface OrganizationClientProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  userRole: string;
}

export function OrganizationClient({ org: initialOrg, userRole }: OrganizationClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [org, setOrg] = useState(initialOrg);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isReadOnly = userRole === "viewer" || userRole === "member";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setMessage(null);
    setLoading(true);

    const normalizedSlug = org.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error } = await supabase
      .from("organizations")
      .update({
        name: org.name,
        slug: normalizedSlug,
        logo_url: org.logo_url,
      })
      .eq("id", org.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Organización actualizada con éxito." });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
      <div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Building size={18} className="text-neutral-400" />
          {t("nav.organization")}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Actualiza los detalles del espacio de trabajo compartido de tu empresa o equipo.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border text-sm font-medium ${
          message.type === "success"
            ? "bg-green-50 dark:bg-green-950/20 text-green-700 border-green-200"
            : "bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label>Nombre de la organización</label>
          <input
            type="text"
            required
            disabled={loading || isReadOnly}
            value={org.name}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label>Identificador Único (Slug - para URL)</label>
          <input
            type="text"
            required
            disabled={loading || isReadOnly}
            value={org.slug}
            onChange={(e) => setOrg({ ...org, slug: e.target.value })}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label>URL del Logotipo</label>
          <input
            type="url"
            disabled={loading || isReadOnly}
            value={org.logo_url || ""}
            onChange={(e) => setOrg({ ...org, logo_url: e.target.value })}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
          />
        </div>
      </div>

      {!isReadOnly && (
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          <span>Guardar Cambios</span>
        </button>
      )}
    </form>
  );
}
