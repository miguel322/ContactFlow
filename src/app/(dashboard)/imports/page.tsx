import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImportsClient } from "./imports-client";

export default async function ImportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Importar Contactos
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Usa nuestro asistente interactivo para cargar tus contactos desde archivos CSV, planillas Excel o vCard.
        </p>
      </div>

      <ImportsClient />
    </div>
  );
}
