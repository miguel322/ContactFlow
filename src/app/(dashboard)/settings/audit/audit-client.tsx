"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Clock, Search, ShieldX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  entity_name: string;
  entity_id: string;
  created_at: string;
  profile: {
    display_name: string | null;
  } | null;
  previous_values: any;
  new_values: any;
}

interface AuditClientProps {
  logs: AuditLog[];
  userRole: string;
}

export function AuditClient({ logs, userRole }: AuditClientProps) {
  const { t } = useI18n();
  const [filterAction, setFilterAction] = useState("");

  const isAuthorized = userRole === "owner" || userRole === "admin";

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <ShieldX size={48} className="text-red-500 animate-pulse" />
        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-250">Acceso Denegado</h2>
        <p className="text-xs text-neutral-500 max-w-sm">
          Sólo los administradores y el propietario de la organización pueden revisar el registro de auditoría de seguridad.
        </p>
      </div>
    );
  }

  const filtered = logs.filter((log) => {
    return !filterAction || log.action === filterAction;
  });

  return (
    <div className="space-y-6 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Clock size={18} className="text-neutral-400" />
            {t("nav.audit")}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Registro cronológico de seguridad. Todas las operaciones CRUD críticas de la organización se auditan automáticamente.
          </p>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 focus:outline-none text-neutral-700 dark:text-neutral-350"
        >
          <option value="">Acción: Todas</option>
          <option value="create">Creación (Create)</option>
          <option value="update">Modificación (Update)</option>
          <option value="delete">Eliminación (Delete)</option>
          <option value="restore">Restauración (Restore)</option>
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Operador</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">Identificador</th>
                <th className="p-3">Modificaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {filtered.map((log) => {
                let changes = "—";
                if (log.action === "update" && log.previous_values && log.new_values) {
                  const prev = log.previous_values;
                  const next = log.new_values;
                  const diffs: string[] = [];
                  Object.keys(next).forEach((key) => {
                    if (
                      prev[key] !== next[key] &&
                      key !== "updated_at" &&
                      typeof prev[key] !== "object"
                    ) {
                      diffs.push(`${key}: "${prev[key]}" ➔ "${next[key]}"`);
                    }
                  });
                  changes = diffs.join(", ") || "Campos internos";
                } else if (log.action === "create") {
                  changes = "Inicialización de registro";
                }

                return (
                  <tr key={log.id}>
                    <td className="p-3">
                      {format(new Date(log.created_at), "PPpp", { locale: es })}
                    </td>
                    <td className="p-3 font-bold">{log.profile?.display_name || "Sistema"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        log.action === "create"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/20"
                          : log.action === "update"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20"
                          : "bg-red-50 text-red-750 dark:bg-red-950/20"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 capitalize">{log.entity_name}</td>
                    <td className="p-3 font-mono text-[10px] truncate max-w-[80px]" title={log.entity_id}>
                      {log.entity_id}
                    </td>
                    <td className="p-3 max-w-xs truncate" title={changes}>
                      {changes}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-400">
                    No se han registrado auditorías que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
