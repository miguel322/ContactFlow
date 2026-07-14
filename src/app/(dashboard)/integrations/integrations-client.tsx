"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Globe, Share2, Mail, CheckCircle2, ShieldX, RefreshCw } from "lucide-react";

interface IntegrationsClientProps {
  integrations: any[];
}

export function IntegrationsClient({ integrations: initialIntegrations }: IntegrationsClientProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [integrs, setIntegrs] = useState<any[]>(initialIntegrations);
  const [syncing, setSyncing] = useState<string | null>(null);

  const googleConnected = integrs.find((i) => i.provider === "google_contacts" && i.is_active);
  const outlookConnected = integrs.find((i) => i.provider === "outlook_contacts" && i.is_active);

  const handleToggle = (provider: string, connected: boolean) => {
    // Toggling connection status
    const matched = integrs.find((i) => i.provider === provider);
    if (matched) {
      setIntegrs(
        integrs.map((i) => (i.provider === provider ? { ...i, is_active: !connected } : i))
      );
    } else {
      setIntegrs([
        ...integrs,
        { provider, is_active: true, last_synced_at: new Date().toISOString() },
      ]);
    }
  };

  const handleSync = (provider: string) => {
    setSyncing(provider);
    setTimeout(() => {
      setSyncing(null);
      setIntegrs(
        integrs.map((i) =>
          i.provider === provider ? { ...i, last_synced_at: new Date().toISOString() } : i
        )
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t("nav.integrations")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Sincroniza tus contactos de Google, Outlook o iCloud de forma segura con ContactFlow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Contacts Integration */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg">
                <Globe size={24} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                googleConnected ? "bg-green-50 text-green-600 dark:bg-green-950/20" : "bg-neutral-100 text-neutral-500"
              }`}>
                {googleConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Google Contacts</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-1">
                Importa y sincroniza automáticamente los contactos de tu cuenta de Google.
              </p>
            </div>
            {googleConnected && (
              <p className="text-[10px] text-neutral-400">
                Última sincronización: {new Date(googleConnected.last_synced_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-neutral-100 dark:border-neutral-800/60 pt-4 mt-2">
            <button
              onClick={() => handleToggle("google_contacts", !!googleConnected)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                googleConnected
                  ? "bg-red-50 hover:bg-red-100 text-red-650 border-red-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              }`}
            >
              {googleConnected ? "Desconectar" : "Conectar cuenta"}
            </button>
            {googleConnected && (
              <button
                disabled={syncing === "google_contacts"}
                onClick={() => handleSync("google_contacts")}
                className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 rounded-lg text-neutral-500 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={14} className={syncing === "google_contacts" ? "animate-spin" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Outlook Contacts Integration */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-lg">
                <Mail size={24} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                outlookConnected ? "bg-green-50 text-green-600 dark:bg-green-950/20" : "bg-neutral-100 text-neutral-500"
              }`}>
                {outlookConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">Microsoft Outlook</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-1">
                Sincroniza tus libretas de direcciones de Office 365 y Outlook.com.
              </p>
            </div>
            {outlookConnected && (
              <p className="text-[10px] text-neutral-400">
                Última sincronización: {new Date(outlookConnected.last_synced_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-neutral-100 dark:border-neutral-800/60 pt-4 mt-2">
            <button
              onClick={() => handleToggle("outlook_contacts", !!outlookConnected)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                outlookConnected
                  ? "bg-red-50 hover:bg-red-100 text-red-650 border-red-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              }`}
            >
              {outlookConnected ? "Desconectar" : "Conectar cuenta"}
            </button>
            {outlookConnected && (
              <button
                disabled={syncing === "outlook_contacts"}
                onClick={() => handleSync("outlook_contacts")}
                className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 rounded-lg text-neutral-500 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={14} className={syncing === "outlook_contacts" ? "animate-spin" : ""} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
