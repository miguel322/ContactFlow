"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Plus, CheckSquare, Clock, CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { format, isToday, isBefore, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TasksClientProps {
  tasks: any[];
  contacts: any[];
  teamMembers: any[];
  userRole: string;
  userId: string;
}

export function TasksClient({
  tasks: initialTasks,
  contacts,
  teamMembers,
  userRole,
  userId,
}: TasksClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [tasks, setTasks] = useState(initialTasks);
  const [submitting, setSubmitting] = useState(false);

  // Form Inputs
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contactId, setContactId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [filter, setFilter] = useState("all");

  const isReadOnly = userRole === "viewer";

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !title.trim() || !dueDate) return;

    setSubmitting(true);
    const activeId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("contactflow:org_id="))
      ?.split("=")[1];

    if (!activeId) return;

    // Create task
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        organization_id: activeId,
        contact_id: contactId ? contactId : null,
        title,
        description: desc,
        due_date: new Date(dueDate).toISOString(),
        priority,
        status: "pending",
        created_by: userId,
      })
      .select(`*, contact:contacts(display_name)`)
      .single();

    if (task && !taskErr) {
      // Create assignee if selected
      if (assigneeId) {
        await supabase.from("task_assignees").insert({
          task_id: task.id,
          profile_id: assigneeId,
        });
      }

      setTasks([task, ...tasks]);
      setTitle("");
      setDesc("");
      setDueDate("");
      setContactId("");
      setAssigneeId("");
    }

    setSubmitting(false);
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
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

  // Group tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date))
  );

  const todayTasks = tasks.filter(
    (t) => t.status !== "completed" && isToday(parseISO(t.due_date))
  );

  const upcomingTasks = tasks.filter(
    (t) => t.status !== "completed" && isAfter(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date))
  );

  const completedTasks = tasks.filter((t) => t.status === "completed");

  const getFilteredTasks = () => {
    switch (filter) {
      case "overdue":
        return overdueTasks;
      case "today":
        return todayTasks;
      case "upcoming":
        return upcomingTasks;
      case "completed":
        return completedTasks;
      default:
        return tasks;
    }
  };

  const visibleTasks = getFilteredTasks();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Columns: Tasks List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t("nav.tasks")}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Gestiona los recordatorios y seguimientos de clientes de tu equipo.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-1 overflow-x-auto scrollbar-none pb-px text-xs font-bold">
          {[
            { id: "all", label: "Todos" },
            { id: "overdue", label: `Vencidos (${overdueTasks.length})` },
            { id: "today", label: `Hoy (${todayTasks.length})` },
            { id: "upcoming", label: `Próximos (${upcomingTasks.length})` },
            { id: "completed", label: "Completados" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                filter === item.id
                  ? "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tasks Display */}
        <div className="space-y-4">
          {visibleTasks.map((task) => {
            const isTaskOverdue =
              task.status !== "completed" &&
              isBefore(parseISO(task.due_date), new Date()) &&
              !isToday(parseISO(task.due_date));

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-neutral-900 border p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-2xs ${
                  task.status === "completed"
                    ? "opacity-60 border-neutral-200 dark:border-neutral-800"
                    : isTaskOverdue
                    ? "border-red-200 dark:border-red-950/40"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {!isReadOnly && (
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => handleToggleStatus(task.id, task.status)}
                      className="w-4.5 h-4.5 text-indigo-650 cursor-pointer rounded"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold text-neutral-850 dark:text-neutral-250 ${
                          task.status === "completed" ? "line-through" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      {isTaskOverdue && (
                        <span className="flex items-center gap-0.5 text-[9px] text-red-600 font-bold bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                          <AlertCircle size={8} /> Vencido
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-neutral-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {format(parseISO(task.due_date), "PPpp", { locale: es })}
                      </span>
                      {task.contact && (
                        <>
                          <span>•</span>
                          <span
                            onClick={() => router.push(`/contacts/${task.contact_id}`)}
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Contacto: {task.contact.display_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    task.priority === "urgent"
                      ? "bg-red-50 text-red-650 dark:bg-red-950/20"
                      : task.priority === "high"
                      ? "bg-orange-50 text-orange-650 dark:bg-orange-950/20"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            );
          })}

          {visibleTasks.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              No hay recordatorios pendientes en esta sección.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Create Form */}
      {!isReadOnly && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs h-fit space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={18} className="text-neutral-400" />
            Nuevo Recordatorio
          </h2>

          <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <div className="flex flex-col gap-1">
              <label>Título de la tarea</label>
              <input
                type="text"
                required
                placeholder="Ej. Enviar cotización final..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label>Descripción (Opcional)</label>
              <textarea
                placeholder="Detalla pasos a seguir..."
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label>Vencimiento</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label>Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label>Asignar a</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-855 dark:text-neutral-200"
                >
                  <option value="">Seleccionar...</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label>Asociar contacto (Opcional)</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-855 dark:text-neutral-200"
              >
                <option value="">Ninguno</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : "Crear Recordatorio"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
