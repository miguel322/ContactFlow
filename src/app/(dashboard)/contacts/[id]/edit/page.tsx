import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/contacts/contact-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select(`
      *,
      phones:contact_phones(*),
      emails:contact_emails(*),
      addresses:contact_addresses(*)
    `)
    .eq("id", id)
    .single();

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Editar Contacto
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Modifica los detalles del contacto y sus valores personalizados.
        </p>
      </div>

      <ContactForm contactId={id} initialData={contact} />
    </div>
  );
}
