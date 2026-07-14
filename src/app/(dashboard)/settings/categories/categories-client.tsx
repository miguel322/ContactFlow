"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Trash2, Loader2, Layers } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
}

interface CategoriesClientProps {
  categories: Category[];
  userRole: string;
}

export function CategoriesClient({
  categories: initialCategories,
  userRole,
}: CategoriesClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [categories, setCategories] = useState(initialCategories);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");

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
      .from("contact_categories")
      .insert({
        organization_id: activeId,
        name,
        color,
        description,
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else if (data) {
      setCategories([...categories, data]);
      setName("");
      setColor("#3b82f6");
      setDescription("");
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría? Se desvinculará de todos los contactos.")) {
      return;
    }

    const { error: deleteErr } = await supabase
      .from("contact_categories")
      .delete()
      .eq("id", id);

    if (!deleteErr) {
      setCategories(categories.filter((c) => c.id !== id));
    } else {
      alert("Error al eliminar categoría: " + deleteErr.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Layers size={18} className="text-neutral-400" />
          {t("nav.categories")}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Define agrupaciones para clasificar tus contactos en el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="md:col-span-2 space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-neutral-50 dark:bg-neutral-855 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex justify-between items-center gap-4 text-xs font-semibold"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border border-neutral-200"
                  style={{ backgroundColor: cat.color || "#e2e8f0" }}
                />
                <div>
                  <p className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-650 hover:text-red-750 p-1 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              No has creado categorías en tu organización.
            </div>
          )}
        </div>

        {/* Create Category Form */}
        {!isReadOnly && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs h-fit space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Crear Categoría</h3>
            
            {error && (
              <div className="p-3 text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 font-semibold text-neutral-700 dark:text-neutral-350">
              <div className="flex flex-col gap-1">
                <label>Nombre de la categoría</label>
                <input
                  type="text"
                  required
                  placeholder="Clientes o Proveedores"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
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

              <div className="flex flex-col gap-1">
                <label>Descripción (Opcional)</label>
                <textarea
                  placeholder="Detalles sobre este tipo de contactos..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                <span>Crear categoría</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
