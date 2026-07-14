"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Phone, Mail, MessageSquare, Calendar, Video, MapPin, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface InteractionsClientProps {
  interactions: any[];
}

export function InteractionsClient({ interactions }: InteractionsClientProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const getIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone size={16} className="text-blue-500" />;
      case "email":
        return <Mail size={16} className="text-purple-500" />;
      case "whatsapp":
      case "message":
        return <MessageSquare size={16} className="text-green-500" />;
      case "meeting":
        return <Calendar size={16} className="text-orange-500" />;
      case "videocall":
        return <Video size={16} className="text-indigo-500" />;
      case "visit":
        return <MapPin size={16} className="text-red-500" />;
      default:
        return <MessageSquare size={16} className="text-neutral-500" />;
    }
  };

  const filtered = interactions.filter((item) => {
    const matchesType = !filterType || item.type === filterType;
    const matchesSearch =
      !search ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.contact?.display_name?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t("nav.interactions")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Historial completo de llamadas, correos, reuniones y mensajes intercambiados con tus contactos.
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por descripción o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm bg-white dark:bg-neutral-900 focus:outline-none text-neutral-700 dark:text-neutral-350"
        >
          <option value="">Tipo de interacción: Todos</option>
          <option value="call">Llamada</option>
          <option value="email">Correo electrónico</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="meeting">Reunión</option>
          <option value="videocall">Videollamada</option>
          <option value="visit">Visita</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Large Timeline */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-2xs relative">
        <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100 dark:before:bg-neutral-800">
          {filtered.map((item) => (
            <div key={item.id} className="relative space-y-2">
              {/* Timeline dot */}
              <div className="absolute -left-6 top-1.5 p-1 rounded-full border border-white dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-800 shadow-xs">
                {getIcon(item.type)}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                <div>
                  <button
                    onClick={() => router.push(`/contacts/${item.contact_id}`)}
                    className="font-bold text-sm text-neutral-850 dark:text-neutral-200 hover:underline hover:text-indigo-650 cursor-pointer"
                  >
                    {item.contact?.display_name}
                  </button>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-2">
                    {formatDistanceToNow(new Date(item.date_time), {
                      addSuffix: true,
                      locale: locale === "es" ? es : undefined,
                    })}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-450 dark:text-neutral-500 font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                  Por: {item.user?.display_name}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850/60 rounded-xl border border-neutral-100/50 dark:border-neutral-800/40 text-xs text-neutral-700 dark:text-neutral-350 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </div>

              {item.result && (
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Resultado: {item.result}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400">
              No hay interacciones registradas que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
