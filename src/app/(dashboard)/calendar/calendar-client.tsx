"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Clock,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

interface CalendarClientProps {
  tasks: any[];
}

export function CalendarClient({ tasks }: CalendarClientProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get padding days for calendar grid start (empty cells or prev month days)
  // standard grid starts on Sunday/Monday. Let's make it start on Monday.
  const startDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const paddingCells = Array.from({ length: startDayOfWeek });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-blue-500 text-white";
      default:
        return "bg-neutral-400 text-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t("nav.calendar")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Vista cronológica mensual de tus tareas y recordatorios de seguimiento.
          </p>
        </div>

        <button
          onClick={() => router.push("/tasks")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          <span>Nuevo recordatorio</span>
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
        {/* Calendar Nav Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/50">
          <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center border-b border-neutral-100 dark:border-neutral-850 text-xs font-semibold text-neutral-500 uppercase py-3 bg-neutral-50/30 dark:bg-neutral-900/20">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-neutral-100 dark:divide-neutral-850 border-collapse">
          {/* Padding */}
          {paddingCells.map((_, i) => (
            <div key={`pad-${i}`} className="bg-neutral-50/20 dark:bg-neutral-950/20" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => isSameDay(parseISO(t.due_date), day));

            return (
              <div key={day.toISOString()} className="p-2 space-y-1 overflow-hidden hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10 transition-colors flex flex-col justify-between">
                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 block">
                  {format(day, "d")}
                </span>

                <div className="flex-1 overflow-y-auto space-y-1 max-h-[85px] scrollbar-none">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (t.contact_id) {
                          router.push(`/contacts/${t.contact_id}`);
                        } else {
                          router.push("/tasks");
                        }
                      }}
                      className={`text-[9px] font-bold p-1 rounded-sm truncate hover:opacity-90 cursor-pointer flex items-center gap-1 ${getPriorityColor(
                        t.priority
                      )}`}
                      title={`${t.title} (${t.priority})`}
                    >
                      <Clock size={8} />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
