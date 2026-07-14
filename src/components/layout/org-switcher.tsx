"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, ChevronDown, Plus } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrgSwitcher() {
  const router = useRouter();
  const supabase = createClient();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadOrgs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          organization_id,
          organizations:organization_id (
            id,
            name,
            slug
          )
        `);

      if (data && !error) {
        const list: Organization[] = data
          .map((item: any) => item.organizations)
          .filter(Boolean);
        setOrgs(list);

        const activeId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("contactflow:org_id="))
          ?.split("=")[1];

        const match = list.find((o) => o.id === activeId) || list[0];
        if (match) {
          setActiveOrg(match);
          if (activeId !== match.id) {
            document.cookie = `contactflow:org_id=${match.id}; path=/; max-age=31536000; SameSite=Lax`;
          }
        }
      }
    }
    loadOrgs();
  }, [supabase]);

  const handleSelect = (org: Organization) => {
    setActiveOrg(org);
    setDropdownOpen(false);
    document.cookie = `contactflow:org_id=${org.id}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
      >
        <Building2 size={16} className="text-neutral-400" />
        <span className="max-w-[120px] truncate">{activeOrg?.name || "Seleccionar..."}</span>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Organizaciones
            </div>
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelect(org)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-2 cursor-pointer ${
                  org.id === activeOrg?.id ? "bg-neutral-50 dark:bg-neutral-800 font-medium" : ""
                }`}
              >
                <Building2 size={14} className="text-neutral-400" />
                <span className="truncate">{org.name}</span>
              </button>
            ))}
            <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
            <button
              onClick={() => {
                setDropdownOpen(false);
                router.push("/onboarding");
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-850 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <Plus size={14} />
              <span>Nueva organización</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
