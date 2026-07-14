"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Trash2, Loader2, Settings } from "lucide-react";

interface CustomFieldDef {
  id: string;
  name: string;
  label: string;
  type: string;
  options: string[] | null;
  is_required: boolean;
}

interface CustomFieldsClientProps {
  definitions: CustomFieldDef[];
  userRole: string;
}

export function CustomFieldsClient({
  definitions: initialDefinitions,
  userRole,
}: CustomFieldsClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [definitions, setDefinitions] = useState(initialDefinitions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [optionsStr, setOptionsStr] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  const isReadOnly = userRole === "viewer" || userRole === "member";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !name.trim() || !label.trim()) return;

    setError(null);
    setSubmitting(true);

    const activeId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("contactflow:org_id="))
      ?.split("=")[1];

    if (!activeId) return;

    const parsedOptions =
      type === "select"
        ? optionsStr
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : null;

    // Normalize name to snake_case
    const normalizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    const { data, error: insertErr } = await supabase
      .from("custom_field_definitions")
      .insert({
        organization_id: activeId,
        name: normalizedName,
        label,
        type,
        options: parsedOptions,
        is_required: isRequired,
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else if (data) {
      setDefinitions([...definitions, data]);
      setName("");
      setLabel("");
      setType("text");
      setOptionsStr("");
      setIsRequired(false);
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta definición de campo? Se borrarán todos los valores guardados para este campo en tus contactos.")) {
      return;
    }

    const { error: deleteErr } = await supabase
      .from("custom_field_definitions")
      .delete()
      .eq("id", id);

    if (!deleteErr) {
      setDefinitions(definitions.filter((d) => d.id !== id));
    } else {
      alert("Error al eliminar campo: " + deleteErr.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Settings size={18} className="text-neutral-400" />
          {t("nav.customFields")}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Define campos adicionales para registrar información especializada en tus contactos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Definitions List */}
        <div className="md:col-span-2 space-y-4">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="bg-neutral-50 dark:bg-neutral-855 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex justify-between items-center gap-4 text-xs font-semibold"
            >
              <div>
                <p className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
                  {def.label}
                  {def.is_required && <span className="text-red-500 ml-1">*</span>}
                </p>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5">
                  Nombre técnico: {def.name} • Tipo: <span className="capitalize">{def.type}</span>
                </p>
                {def.options && (
                  <p className="text-[9px] text-neutral-400 mt-1">
                    Opciones: {def.options.join(", ")}
                  </p>
                )}
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => handleDelete(def.id)}
                  className="text-red-600 hover:text-red-750 p-1 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {definitions.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              No has creado campos personalizados para tus contactos.
            </div>
          )}
        </div>

        {/* Create Field Form */}
        {!isReadOnly && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs h-fit space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Crear Campo</h3>
            
            {error && (
              <div className="p-3 text-red-650 dark:text-red-450 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 font-semibold text-neutral-700 dark:text-neutral-350">
              <div className="flex flex-col gap-1">
                <label>Etiqueta (Ej. RFC o Código Postal)</label>
                <input
                  type="text"
                  required
                  placeholder="RFC o Segmento"
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setName(e.target.value);
                  }}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Nombre Técnico (se auto-genera)</label>
                <input
                  type="text"
                  required
                  placeholder="rfc"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 focus:outline-none text-neutral-500 dark:text-neutral-450"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Tipo de dato</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                >
                  <option value="text">Texto corto</option>
                  <option value="long_text">Texto largo</option>
                  <option value="number">Número</option>
                  <option value="date">Fecha</option>
                  <option value="boolean">Sí / No</option>
                  <option value="select">Lista de opciones (Select)</option>
                  <option value="email">Correo electrónico</option>
                  <option value="phone">Teléfono</option>
                  <option value="url">URL Enlace</option>
                </select>
              </div>

              {type === "select" && (
                <div className="flex flex-col gap-1">
                  <label>Opciones (separadas por comas)</label>
                  <input
                    type="text"
                    required
                    placeholder="Opción A, Opción B, Opción C"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    disabled={submitting}
                    className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
                <span>¿Es obligatorio al registrar contactos?</span>
              </label>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !label.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                <span>Crear campo</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
