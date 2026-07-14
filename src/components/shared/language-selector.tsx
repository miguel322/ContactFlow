"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "es" ? "en" : "es")}
      className="text-xs font-semibold px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
    >
      {locale === "es" ? "English" : "Español"}
    </button>
  );
}
