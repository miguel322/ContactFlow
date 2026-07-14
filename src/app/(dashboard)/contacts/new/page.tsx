import React from "react";
import { ContactForm } from "@/components/contacts/contact-form";

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Crear Contacto
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Añade un nuevo contacto a tu organización para empezar a registrar interacciones.
        </p>
      </div>

      <ContactForm />
    </div>
  );
}
