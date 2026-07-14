"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  color: string | null;
}

interface TagsClientProps {
  tags: TagItem[];
  userRole: string;
}

export function TagsClient({ tags: initialTags, userRole }: TagsClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [tags, setTags] = useState(initialTags);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  const isReadOnly = userRole === "viewer" || userRole === "member";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !name.trim()) return;

    setError(null);
    setSubmitting(true);

    const activeId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("contactflow:org_id="))
      ?.split("=")[1];

    if (!activeId) return;

    const { data, error: insertErr } = await supabase
      .from("tags")
      .insert({
        organization_id: activeId,
        name,
        color,
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else if (data) {
      setTags([...tags, data]);
      setName("");
      setColor("#6366f1");
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta etiqueta? Se desvinculará de todos los contactos.")) {
      return;
    }

    const { error: deleteErr } = await supabase.from("tags").delete().eq("id", id);

    if (!deleteErr) {
      setTags(tags.filter((t) => t.id !== id));
    } else {
      alert("Error al eliminar etiqueta: " + deleteErr.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Tag size={18} className="text-neutral-400" />
          {t("nav.tags")}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Crea y administra etiquetas para clasificar tus contactos en detalle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tags List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold bg-neutral-50 dark:bg-neutral-850"
              >
                <div
                  className="w-3 h-3 rounded-full border border-neutral-200"
                  style={{ backgroundColor: tag.color || "#94a3b8" }}
                />
                <span className="text-neutral-800 dark:text-neutral-200">{tag.name}</span>

                {!isReadOnly && (
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer ml-1"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          {tags.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              No has creado etiquetas en tu organización.
            </div>
          )}
        </div>

        {/* Create Tag Form */}
        {!isReadOnly && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs h-fit space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Crear Etiqueta</h3>
            
            {error && (
              <div className="p-3 text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 font-semibold text-neutral-700 dark:text-neutral-350">
              <div className="flex flex-col gap-1">
                <label>Nombre de la etiqueta</label>
                <input
                  type="text"
                  required
                  placeholder="VIP, Urgente, Nuevo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Color representativo</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={submitting}
                    className="w-10 h-8 rounded border border-neutral-350 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={submitting}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                <span>Crear etiqueta</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
