"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Plus,
  PhoneCall,
  CalendarDays,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardClientProps {
  stats: {
    totalContacts: number;
    pendingTasks: number;
    overdueTasks: number;
    monthInteractions: number;
  };
  recentContacts: any[];
  upcomingMeetings: any[];
  recentActivity: any[];
  categoryData: any[];
  statusData: any[];
}

export function DashboardClient({
  stats,
  recentContacts,
  upcomingMeetings,
  recentActivity,
  categoryData,
  statusData,
}: DashboardClientProps) {
  const router = useRouter();
  const { t, locale } = useI18n();

  // Mock monthly data for chart since we seed it recently
  const monthlyData = [
    { name: "Ene", contacts: Math.max(0, stats.totalContacts - 15) },
    { name: "Feb", contacts: Math.max(0, stats.totalContacts - 12) },
    { name: "Mar", contacts: Math.max(0, stats.totalContacts - 8) },
    { name: "Abr", contacts: Math.max(0, stats.totalContacts - 6) },
    { name: "May", contacts: Math.max(0, stats.totalContacts - 2) },
    { name: "Jun", contacts: stats.totalContacts },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#6B7280"];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t("nav.dashboard")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Vista general del estado de tus relaciones y tareas pendientes.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div
          onClick={() => router.push("/contacts")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              {t("dashboard.totalContacts")}
            </span>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {stats.totalContacts}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-105 transition-transform">
            <Users size={20} />
          </div>
        </div>

        {/* Monthly Interactions */}
        <div
          onClick={() => router.push("/interactions")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              {t("dashboard.interactionsMonth")}
            </span>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {stats.monthInteractions}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => router.push("/tasks")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              {t("dashboard.pendingTasks")}
            </span>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {stats.pendingTasks}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-lg group-hover:scale-105 transition-transform">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => router.push("/tasks?filter=overdue")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              {t("dashboard.overdueTasks")}
            </span>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-red-650 dark:group-hover:text-red-400 transition-colors">
              {stats.overdueTasks}
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-450 rounded-lg group-hover:scale-105 transition-transform">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Quick Actions & Evolution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-neutral-400" />
              {t("dashboard.evolution")}
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="contacts"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorContacts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("dashboard.quickActions")}
          </h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/contacts/new")}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-md">
                <Plus size={16} />
              </div>
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {t("dashboard.addContact")}
                </p>
                <p className="text-xs text-neutral-450 dark:text-neutral-500">Agrega una persona o empresa</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/interactions")}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 rounded-md">
                <PhoneCall size={16} />
              </div>
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {t("dashboard.addInteraction")}
                </p>
                <p className="text-xs text-neutral-450 dark:text-neutral-500">Registra una llamada o reunión</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/tasks")}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-green-50 dark:bg-green-950/20 text-green-650 dark:text-green-400 rounded-md">
                <CalendarDays size={16} />
              </div>
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {t("dashboard.addTask")}
                </p>
                <p className="text-xs text-neutral-450 dark:text-neutral-500">Crea un recordatorio para tu equipo</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Breakdowns & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts by Category & Status */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Distribución de Contactos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Category breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {t("dashboard.contactsByCategory")}
              </span>
              <div className="space-y-2">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-neutral-450 dark:text-neutral-550">Sin datos de categorías</p>
                ) : (
                  categoryData.map((cat, index) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                        <span className="text-neutral-500 dark:text-neutral-400">{cat.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-105 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${stats.totalContacts > 0 ? (cat.value / stats.totalContacts) * 100 : 0}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {t("dashboard.leadsByStatus")}
              </span>
              <div className="space-y-2">
                {statusData.length === 0 ? (
                  <p className="text-xs text-neutral-450 dark:text-neutral-550">Sin datos de estados</p>
                ) : (
                  statusData.map((stat, index) => (
                    <div key={stat.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}
                        />
                        <span className="text-neutral-700 dark:text-neutral-300 capitalize">{stat.name}</span>
                      </div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{stat.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Added Contacts */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {t("dashboard.recentContacts")}
            </h2>
            <button
              onClick={() => router.push("/contacts")}
              className="text-xs text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recentContacts.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-405 dark:text-neutral-500">
                Aún no has agregado contactos
              </div>
            ) : (
              recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-805 flex items-center justify-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        contact.display_name[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {contact.display_name}
                      </p>
                      <p className="text-[10px] text-neutral-450 dark:text-neutral-500 truncate max-w-[130px]">
                        {contact.company_name || "Freelancer"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full font-medium">
                    {contact.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("dashboard.recentActivity")}
          </h2>
          <div className="flex flex-col gap-3.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100 dark:before:bg-neutral-800">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-405 dark:text-neutral-500">
                Sin actividad reciente registrada
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="flex gap-3 items-start relative pl-6">
                  <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 bg-indigo-500 z-10" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-none">
                      {act.contact?.display_name || "Contacto"}
                    </p>
                    <p className="text-[11px] text-neutral-550 dark:text-neutral-450 leading-snug">
                      <span className="font-semibold capitalize text-indigo-650 dark:text-indigo-400">{act.type}:</span>{" "}
                      {act.description}
                    </p>
                    <span className="text-[9px] text-neutral-400 dark:text-neutral-550 block">
                      {formatDistanceToNow(new Date(act.date_time), {
                        addSuffix: true,
                        locale: locale === "es" ? es : undefined,
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
