"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  User,
  Building,
  Users,
  Settings,
  Shield,
  Clock,
  Tag,
  Layers,
} from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  const menuItems = [
    { name: t("nav.profile"), href: "/settings/profile", icon: User },
    { name: t("nav.organization"), href: "/settings/organization", icon: Building },
    { name: t("nav.members"), href: "/settings/members", icon: Users },
    { name: t("nav.categories"), href: "/settings/categories", icon: Layers },
    { name: t("nav.tags"), href: "/settings/tags", icon: Tag },
    { name: t("nav.customFields"), href: "/settings/custom-fields", icon: Settings },
    { name: t("nav.security"), href: "/settings/security", icon: Shield },
    { name: t("nav.audit"), href: "/settings/audit", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Configuración del sistema
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Personaliza tu perfil, gestiona miembros de equipo, define campos y revisa auditoría.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings sub-sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 h-fit">
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400"
                      : "text-neutral-550 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xs min-h-[500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
