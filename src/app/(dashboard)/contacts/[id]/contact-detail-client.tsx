"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Plus,
  Trash2,
  Edit,
  Archive,
  RotateCcw,
  CheckSquare,
  Pin,
  Globe,
  Tag,
  Paperclip,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface ContactDetailClientProps {
  contact: any;
  interactions: any[];
  notes: any[];
  tasks: any[];
  files: any[];
  auditLogs: any[];
  customFields: any[];
  customValues: Record<string, string>;
  userRole: string;
  userId: string;
}

export function ContactDetailClient({
  contact,
  interactions: initialInteractions,
  notes: initialNotes,
  tasks: initialTasks,
  files: initialFiles,
  auditLogs,
  customFields,
  customValues,
  userRole,
  userId,
}: ContactDetailClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("summary");
  const [interactions, setInteractions] = useState(initialInteractions);
  const [notes, setNotes] = useState(initialNotes);
  const [tasks, setTasks] = useState(initialTasks);
  const [files, setFiles] = useState(initialFiles);

  const [submitting, setSubmitting] = useState(false);

  // Quick Action form inputs
  const [noteContent, setNoteContent] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);

  const [intType, setIntType] = useState("call");
  const [intDesc, setIntDesc] = useState("");
  const [intResult, setIntResult] = useState("connected");
  const [intDir, setIntDir] = useState("outgoing");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");

  const [uploading, setUploading] = useState(false);

  const isReadOnly = userRole === "viewer";
  const canDeletePermanent = userRole === "owner" || userRole === "admin";

  // Actions
  const handleArchive = async () => {
    if (isReadOnly) return;
    const nextStatus = contact.status === "archived" ? "active" : "archived";
    const deletedAt = nextStatus === "archived" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("contacts")
      .update({ status: nextStatus, deleted_at: deletedAt })
      .eq("id", contact.id);

    if (!error) {
      router.refresh();
    }
  };

  const handlePermanentDelete = async () => {
    if (!canDeletePermanent) return;
    if (!confirm("¿Estás seguro de que quieres eliminar permanentemente este contacto y toda su información relacionada?")) {
      return;
    }

    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
    if (!error) {
      router.push("/contacts");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !noteContent.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id: contact.id,
        profile_id: userId,
        content: noteContent,
        is_private: notePrivate,
        is_pinned: false,
      })
      .select(`*, profile:profiles(display_name)`)
      .single();

    if (data && !error) {
      setNotes([data, ...notes]);
      setNoteContent("");
    }
    setSubmitting(false);
  };

  const handleTogglePinNote = async (noteId: string, isPinned: boolean) => {
    if (isReadOnly) return;
    const { error } = await supabase
      .from("contact_notes")
      .update({ is_pinned: !isPinned })
      .eq("id", noteId);

    if (!error) {
      setNotes(
        notes.map((n) => (n.id === noteId ? { ...n, is_pinned: !isPinned } : n))
      );
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !intDesc.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        organization_id: contact.organization_id,
        contact_id: contact.id,
        type: intType,
        date_time: new Date().toISOString(),
        direction: intDir,
        result: intResult,
        description: intDesc,
        user_id: userId,
      })
      .select(`*, user:profiles(display_name)`)
      .single();

    if (data && !error) {
      setInteractions([data, ...interactions]);
      setIntDesc("");
    }
    setSubmitting(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !taskTitle.trim() || !taskDue) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        organization_id: contact.organization_id,
        contact_id: contact.id,
        title: taskTitle,
        due_date: new Date(taskDue).toISOString(),
        priority: taskPriority,
        status: "pending",
      })
      .select()
      .single();

    if (data && !error) {
      setTasks([data, ...tasks]);
      setTaskTitle("");
      setTaskDue("");
    }
    setSubmitting(false);
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (isReadOnly) return;
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", taskId);

    if (!error) {
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Enforce < 5MB file limit
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo excede el tamaño máximo permitido (5MB)");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${contact.organization_id}/${contact.id}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file to Supabase storage bucket
      const { error: uploadErr } = await supabase.storage
        .from("contact-files")
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      // Save file record in database
      const { data, error: dbErr } = await supabase
        .from("contact_files")
        .insert({
          organization_id: contact.organization_id,
          contact_id: contact.id,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          created_by: userId,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      setFiles([data, ...files]);
    } catch (err: any) {
      alert(err.message || "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string, filePath: string) => {
    if (isReadOnly) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) return;

    try {
      await supabase.storage.from("contact-files").remove([filePath]);
      await supabase.from("contact_files").delete().eq("id", fileId);
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err: any) {
      alert(err.message || "Error al eliminar archivo");
    }
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("contact-files")
        .download(filePath);
      
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      alert("Error al descargar archivo: " + err.message);
    }
  };

  const primaryPhone = contact.phones?.find((p: any) => p.is_primary)?.phone || contact.phones?.[0]?.phone;
  const primaryEmail = contact.emails?.find((e: any) => e.is_primary)?.email || contact.emails?.[0]?.email;

  const tabs = [
    { id: "summary", label: "Resumen", icon: FileText },
    { id: "info", label: "Info Personal", icon: MapPin },
    { id: "interactions", label: "Interacciones", icon: MessageSquare },
    { id: "notes", label: "Notas", icon: Pin },
    { id: "reminders", label: "Recordatorios", icon: CheckSquare },
    { id: "files", label: "Archivos", icon: Paperclip },
    { id: "history", label: "Historial", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Upper Card Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-805 flex items-center justify-center text-xl font-bold border border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-600 dark:text-neutral-400">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.display_name} className="w-full h-full object-cover" />
            ) : (
              contact.display_name[0].toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              {contact.display_name}
              <span className="text-xs px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-full font-semibold capitalize">
                {contact.status}
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {contact.company_name} {contact.job_title ? `— ${contact.job_title}` : ""}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/contacts/${contact.id}/edit`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
            >
              <Edit size={14} /> Editar
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
            >
              {contact.status === "archived" ? (
                <>
                  <RotateCcw size={14} /> Restaurar
                </>
              ) : (
                <>
                  <Archive size={14} /> Archivar
                </>
              )}
            </button>
            {canDeletePermanent && (
              <button
                onClick={handlePermanentDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex overflow-x-auto gap-2 scrollbar-none pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-96">
        {/* SUMMARY TAB */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Profile Bio / Description */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Resumen del contacto</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {contact.description || "Sin descripción disponible."}
                </p>
              </div>

              {/* Recent Activity Mini-Timeline */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Actividad reciente</h3>
                <div className="relative pl-6 space-y-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-neutral-100 dark:before:bg-neutral-800">
                  {interactions.slice(0, 3).map((act) => (
                    <div key={act.id} className="relative space-y-1">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border border-white dark:border-neutral-900 bg-indigo-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-250 capitalize">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {formatDistanceToNow(new Date(act.date_time), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-450">{act.description}</p>
                    </div>
                  ))}
                  {interactions.length === 0 && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 pl-2">No hay interacciones registradas.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Contact & Details card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-5 h-fit">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Detalles rápidos</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-neutral-400" />
                  {primaryPhone ? (
                    <a href={`tel:${primaryPhone}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {primaryPhone}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Sin teléfono</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-neutral-400" />
                  {primaryEmail ? (
                    <a href={`mailto:${primaryEmail}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {primaryEmail}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Sin correo</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-neutral-400" />
                  {contact.website ? (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {contact.website}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Sin sitio web</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-neutral-400" />
                  <span className="text-neutral-700 dark:text-neutral-350">
                    Fuente: {contact.source || "Directo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
              Información Completa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Phones List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider block">Teléfonos</span>
                {contact.phones?.length === 0 ? (
                  <p className="text-neutral-400 text-xs">No hay teléfonos registrados.</p>
                ) : (
                  contact.phones?.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                      <span className="font-semibold text-neutral-750 dark:text-neutral-300">{p.phone}</span>
                      <span className="text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md capitalize">
                        {p.type} {p.is_primary && "• Principal"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Emails List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider block">Correos</span>
                {contact.emails?.length === 0 ? (
                  <p className="text-neutral-400 text-xs">No hay correos registrados.</p>
                ) : (
                  contact.emails?.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                      <span className="font-semibold text-neutral-755 dark:text-neutral-300">{e.email}</span>
                      <span className="text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md capitalize">
                        {e.type} {e.is_primary && "• Principal"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Addresses List */}
              <div className="space-y-2.5 md:col-span-2">
                <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider block">Direcciones</span>
                {contact.addresses?.length === 0 ? (
                  <p className="text-neutral-400 text-xs">No hay direcciones registradas.</p>
                ) : (
                  contact.addresses?.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-850 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-neutral-750 dark:text-neutral-300">
                          {a.street}
                        </p>
                        <p className="text-xs text-neutral-450">
                          {a.city}, {a.state} {a.postal_code} — {a.country}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md capitalize">
                        {a.type} {a.is_primary && "• Principal"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Custom fields values */}
              {customFields.length > 0 && (
                <div className="space-y-2.5 md:col-span-2 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
                  <span className="text-xs font-semibold text-neutral-455 uppercase tracking-wider block">
                    Campos Personalizados
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customFields.map((field) => {
                      const val = customValues[field.id];
                      return (
                        <div key={field.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-100/40 dark:border-neutral-800/40">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-400">{field.label}:</span>
                          <span className="text-neutral-900 dark:text-white font-medium">
                            {val === "true" ? "Sí" : val === "false" ? "No" : val || "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTERACTIONS TAB */}
        {activeTab === "interactions" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-250">Línea de tiempo de interacciones</h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-neutral-150 dark:before:bg-neutral-800">
                {interactions.map((act) => (
                  <div key={act.id} className="relative space-y-1.5">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900 bg-indigo-500" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-150 uppercase tracking-wider">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-550">
                          {formatDistanceToNow(new Date(act.date_time), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        Por: {act.user?.display_name || "Desconocido"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-350 bg-neutral-50 dark:bg-neutral-850 p-2.5 rounded-lg">
                      {act.description}
                    </p>
                    {act.result && (
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        Resultado: {act.result}
                      </span>
                    )}
                  </div>
                ))}
                {interactions.length === 0 && (
                  <p className="text-xs text-neutral-400 pl-2">No se han registrado llamadas o reuniones.</p>
                )}
              </div>
            </div>

            {/* Quick Interaction Form */}
            {!isReadOnly && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4 h-fit">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Registrar Interacción</h3>
                <form onSubmit={handleAddInteraction} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Tipo
                    </label>
                    <select
                      value={intType}
                      onChange={(e) => setIntType(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-200 focus:outline-none"
                    >
                      <option value="call">Llamada</option>
                      <option value="meeting">Reunión</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Correo electrónico</option>
                      <option value="message">Mensaje de texto</option>
                      <option value="videocall">Videollamada</option>
                      <option value="visit">Visita en oficina</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Dirección
                    </label>
                    <div className="flex gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="dir"
                          checked={intDir === "outgoing"}
                          onChange={() => setIntDir("outgoing")}
                        />
                        <span>Saliente</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="dir"
                          checked={intDir === "incoming"}
                          onChange={() => setIntDir("incoming")}
                        />
                        <span>Entrante</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Detalle
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Escribe un breve resumen de lo conversado..."
                      value={intDesc}
                      onChange={(e) => setIntDesc(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none text-neutral-700 dark:text-neutral-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={12} /> : "Registrar"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="md:col-span-2 space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white dark:bg-neutral-900 border p-5 rounded-xl shadow-2xs space-y-3 relative group ${
                    note.is_pinned
                      ? "border-yellow-200 dark:border-yellow-905"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-neutral-450">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {note.profile?.display_name}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: es })}
                      </span>
                      {note.is_private && (
                        <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded">
                          Privado
                        </span>
                      )}
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleTogglePinNote(note.id, note.is_pinned)}
                        className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                          note.is_pinned ? "text-yellow-500" : "text-neutral-400"
                        }`}
                      >
                        <Pin size={14} className="fill-current" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-6">No hay anotaciones asociadas a este contacto.</p>
              )}
            </div>

            {/* Quick Note Form */}
            {!isReadOnly && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4 h-fit">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Añadir Anotación</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    required
                    rows={4}
                    placeholder="Escribe una nota interna para recordar..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none text-neutral-700 dark:text-neutral-200"
                  />

                  <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-450 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notePrivate}
                      onChange={(e) => setNotePrivate(e.target.checked)}
                    />
                    <span>Marcar como privada (sólo visible para mí)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={12} /> : "Añadir nota"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* REMINDERS TAB */}
        {activeTab === "reminders" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task list */}
            <div className="md:col-span-2 space-y-3.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl flex items-center justify-between gap-4 transition-all ${
                    task.status === "completed" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {!isReadOnly && (
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => handleToggleTaskStatus(task.id, task.status)}
                        className="w-4 h-4 text-indigo-650 cursor-pointer"
                      />
                    )}
                    <div>
                      <p
                        className={`text-xs font-semibold text-neutral-800 dark:text-neutral-200 ${
                          task.status === "completed" ? "line-through" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                        Vence: {format(new Date(task.due_date), "PPpp", { locale: es })}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    task.priority === "urgent"
                      ? "bg-red-50 text-red-650 dark:bg-red-950/20"
                      : task.priority === "high"
                      ? "bg-orange-50 text-orange-650 dark:bg-orange-950/20"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-6">No hay recordatorios pendientes.</p>
              )}
            </div>

            {/* Quick Task Form */}
            {!isReadOnly && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4 h-fit">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Programar Seguimiento</h3>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Tarea
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Llamar para negociar contrato..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none text-neutral-700 dark:text-neutral-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Fecha y Hora
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none text-neutral-700 dark:text-neutral-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Prioridad
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none text-neutral-700 dark:text-neutral-200"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={12} /> : "Programar"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === "files" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Archivos y adjuntos</h3>
              
              {!isReadOnly && (
                <label className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                  {uploading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Subir archivo</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-neutral-50 dark:bg-neutral-855 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex justify-between items-start gap-4 relative"
                >
                  <div
                    onClick={() => handleFileDownload(file.file_path, file.name)}
                    className="space-y-1 cursor-pointer flex-1"
                  >
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate hover:underline">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {!isReadOnly && (
                    <button
                      onClick={() => handleFileDelete(file.id, file.file_path)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {files.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-neutral-400">
                  No se han adjuntado archivos.
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-250">Historial de auditoría</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-450">
                    <th className="py-2.5 font-semibold">Fecha</th>
                    <th className="py-2.5 font-semibold">Usuario</th>
                    <th className="py-2.5 font-semibold">Acción</th>
                    <th className="py-2.5 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-350">
                  {auditLogs.map((log) => {
                    let details = "—";
                    if (log.action === "update" && log.previous_values && log.new_values) {
                      // Compare display name, status, job title
                      const prev = log.previous_values;
                      const next = log.new_values;
                      const changes: string[] = [];
                      ["display_name", "status", "job_title", "company_name"].forEach((key) => {
                        if (prev[key] !== next[key]) {
                          changes.push(`${key}: "${prev[key]}" ➔ "${next[key]}"`);
                        }
                      });
                      details = changes.join(", ") || "Otros cambios";
                    } else if (log.action === "create") {
                      details = "Creado originalmente";
                    }

                    return (
                      <tr key={log.id}>
                        <td className="py-2.5">
                          {format(new Date(log.created_at), "PPpp", { locale: es })}
                        </td>
                        <td className="py-2.5">{log.profile?.display_name || "Sistema"}</td>
                        <td className="py-2.5 capitalize">{log.action}</td>
                        <td className="py-2.5 max-w-xs truncate">{details}</td>
                      </tr>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-neutral-400">
                        No hay registros históricos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
