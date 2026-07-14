import { cookies } from "next/headers";
import es from "./es.json";
import en from "./en.json";

export type Locale = "es" | "en";

export async function getServerTranslations() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("contactflow:locale")?.value as Locale) || "es";
  const dict = locale === "en" ? en : es;

  return {
    t: (key: string, variables?: Record<string, string | number>) => {
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
    },
    locale,
  };
}
