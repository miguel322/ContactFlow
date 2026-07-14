"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreVertical,
  Pencil,
} from "lucide-react";

interface ContactsClientProps {
  contacts: any[];
  categories: any[];
  owners: any[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  userRole: string;
}

export function ContactsClient({
  contacts,
  categories,
  owners,
  totalPages,
  currentPage,
  totalCount,
  userRole,
}: ContactsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t } = useI18n();

  // Local state for filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [owner, setOwner] = useState(searchParams.get("owner") || "");
  const [archived, setArchived] = useState(searchParams.get("archived") === "true");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const isReadOnly = userRole === "viewer";
  const canDeletePermanent = userRole === "owner" || userRole === "admin";

  // Trigger search parameter updates in router
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (owner) params.set("owner", owner);
    if (archived) params.set("archived", "true");
    params.set("page", "1"); // reset to page 1 on filter
    router.push(`/contacts?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/contacts?${params.toString()}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(contacts.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  // Batch actions
  const handleBatchArchive = async () => {
    if (isReadOnly || selectedIds.length === 0) return;
    const nextStatus = archived ? "active" : "archived";
    const deletedAt = archived ? null : new Date().toISOString();

    const { error } = await supabase
      .from("contacts")
      .update({ status: nextStatus, deleted_at: deletedAt })
      .in("id", selectedIds);

    if (!error) {
      setSelectedIds([]);
      router.refresh();
    }
  };

  const handleBatchDelete = async () => {
    if (!canDeletePermanent || selectedIds.length === 0) return;
    if (!confirm(`¿Estás seguro de que quieres eliminar permanentemente ${selectedIds.length} contactos?`)) {
      return;
    }

    const { error } = await supabase.from("contacts").delete().in("id", selectedIds);
    if (!error) {
      setSelectedIds([]);
      router.refresh();
    }
  };

  // Export batch data to CSV
  const handleBatchExport = () => {
    const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id));
    const csvRows = [
      ["Nombre", "Empresa", "Cargo", "Estado", "Origen", "Emails", "Telefonos", "Web"],
    ];

    selectedContacts.forEach((c) => {
      const emailsStr = c.emails?.map((e: any) => e.email).join("; ");
      const phonesStr = c.phones?.map((p: any) => p.phone).join("; ");
      csvRows.push([
        c.display_name,
        c.company_name || "",
        c.job_title || "",
        c.status,
        c.source || "",
        emailsStr || "",
        phonesStr || "",
        c.website || "",
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((r) => r.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contactflow_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t("contacts.title")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Administra los contactos de tu equipo, aplica filtros avanzados y gestiona de forma masiva.
          </p>
        </div>
        
        {!isReadOnly && (
          <button
            onClick={() => router.push("/contacts/new")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            <span>{t("contacts.new")}</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder={t("contacts.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 focus:outline-none text-neutral-700 dark:text-neutral-350"
          >
            <option value="">{t("contacts.status")}: Todos</option>
            <option value="active">{t("contacts.active")}</option>
            <option value="inactive">{t("contacts.inactive")}</option>
            <option value="lead">{t("contacts.lead")}</option>
            <option value="customer">{t("contacts.customer")}</option>
            <option value="supplier">{t("contacts.supplier")}</option>
            <option value="employee">{t("contacts.employee")}</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 focus:outline-none text-neutral-700 dark:text-neutral-350"
          >
            <option value="">Categoría: Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Owner */}
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 focus:outline-none text-neutral-700 dark:text-neutral-350"
          >
            <option value="">Propietario: Todos</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-450 cursor-pointer">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            <span>Mostrar sólo archivados</span>
          </label>
          <button
            onClick={applyFilters}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-450 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Filter size={12} />
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selectedIds.length === contacts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                  />
                </th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Empresa</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Teléfono Principal</th>
                <th className="p-4">Correo Principal</th>
                <th className="p-4">Estado</th>
                <th className="p-4 w-12">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-350">
              {contacts.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const primaryPhone = c.phones?.find((p: any) => p.is_primary)?.phone || c.phones?.[0]?.phone || "—";
                const primaryEmail = c.emails?.find((e: any) => e.is_primary)?.email || c.emails?.[0]?.email || "—";
                const categoryName = c.category_assignments?.[0]?.category?.name || "Sin Categoría";
                const categoryColor = c.category_assignments?.[0]?.category?.color || "#e2e8f0";

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                      isSelected ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(c.id, e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                      />
                    </td>
                    <td
                      onClick={() => router.push(`/contacts/${c.id}`)}
                      className="p-4 font-bold text-neutral-900 dark:text-white cursor-pointer hover:underline"
                    >
                      {c.display_name}
                    </td>
                    <td className="p-4">{c.company_name || "—"}</td>
                    <td className="p-4">{c.job_title || "—"}</td>
                    <td className="p-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border"
                        style={{
                          borderColor: categoryColor,
                          color: categoryColor,
                          backgroundColor: `${categoryColor}15`,
                        }}
                      >
                        {categoryName}
                      </span>
                    </td>
                    <td className="p-4">{primaryPhone}</td>
                    <td className="p-4 truncate max-w-[120px]" title={primaryEmail}>
                      {primaryEmail}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full font-medium capitalize">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === c.id ? null : c.id)
                        }
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded hover:bg-neutral-105 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {actionMenuOpen === c.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                          <div className="absolute right-4 mt-1 w-36 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                router.push(`/contacts/${c.id}`);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={12} /> Ver detalles
                            </button>
                            {!isReadOnly && (
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  router.push(`/contacts/${c.id}/edit`);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                              >
                                 <Pencil size={12} /> Editar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {contacts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-405 dark:text-neutral-500 font-medium">
                    {t("contacts.noContacts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-850 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
            <span className="text-neutral-500 text-xs">
              Mostrando página {currentPage} de {totalPages} (Total: {totalCount} contactos)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch floating action bar */}
      {selectedIds.length > 0 && !isReadOnly && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-900 rounded-xl px-5 py-3.5 shadow-xl flex items-center gap-6 z-30 animate-slide-up">
          <span className="text-xs font-semibold text-indigo-650 dark:text-indigo-400">
            {selectedIds.length} seleccionados
          </span>
          <div className="flex gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <button
              onClick={handleBatchArchive}
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
            >
              <Archive size={14} />
              <span>{archived ? "Restaurar" : "Archivar"}</span>
            </button>
            <button
              onClick={handleBatchExport}
              className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 dark:border-neutral-855 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>
            {canDeletePermanent && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
