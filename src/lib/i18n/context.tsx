"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import es from "./es.json";
import en from "./en.json";

export type Locale = "es" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )contactflow:locale=([^;]*)/);
    const savedLocale = match
      ? (match[1] as Locale)
      : (localStorage.getItem("contactflow:locale") as Locale);
    if (savedLocale === "es" || savedLocale === "en") {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `contactflow:locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem("contactflow:locale", newLocale);
  };

  const t = (key: string, variables?: Record<string, string | number>) => {
    const dict = locale === "en" ? en : es;
    const keys = key.split(".");
    let val: any = dict;
    for (const k of keys) {
      val = val?.[k];
    }
    if (typeof val !== "string") return key;
    if (variables) {
      let str = val;
      for (const [k, v] of Object.entries(variables)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
      return str;
    }
    return val;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
