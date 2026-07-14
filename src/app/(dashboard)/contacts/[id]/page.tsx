import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetailClient } from "./contact-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Contact
  const { data: contact } = await supabase
    .from("contacts")
    .select(`
      *,
      owner:profiles!contacts_owner_id_fkey(display_name),
      phones:contact_phones(*),
      emails:contact_emails(*),
      addresses:contact_addresses(*)
    `)
    .eq("id", id)
    .single();

  if (!contact) {
    notFound();
  }

  // 2. Fetch User Membership Role
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", contact.organization_id)
    .eq("profile_id", user.id)
    .single();

  const userRole = membership?.role || "viewer";

  // 3. Fetch related timeline resources in parallel
  const interactionsPromise = supabase
    .from("interactions")
    .select("*, user:profiles(display_name)")
    .eq("contact_id", id)
    .order("date_time", { ascending: false });

  const notesPromise = supabase
    .from("contact_notes")
    .select("*, profile:profiles(display_name)")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  const tasksPromise = supabase
    .from("tasks")
    .select("*")
    .eq("contact_id", id)
    .order("due_date", { ascending: true });

  const filesPromise = supabase
    .from("contact_files")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  // 4. Fetch Custom field data
  const customDefsPromise = supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("organization_id", contact.organization_id);

  const customValuesPromise = supabase
    .from("custom_field_values")
    .select("field_definition_id, value")
    .eq("contact_id", id);

  // 5. Fetch audit logs (Only admins/owners see complete logs, but we let anyone see basic contact history)
  const auditLogsPromise = supabase
    .from("audit_logs")
    .select("*, profile:profiles(display_name)")
    .eq("entity_name", "contacts")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  const [
    interactionsRes,
    notesRes,
    tasksRes,
    filesRes,
    customDefsRes,
    customValuesRes,
    auditLogsRes,
  ] = await Promise.all([
    interactionsPromise,
    notesPromise,
    tasksPromise,
    filesPromise,
    customDefsPromise,
    customValuesPromise,
    auditLogsPromise,
  ]);

  // Build custom values map
  const customValuesMap: Record<string, string> = {};
  (customValuesRes.data || []).forEach((item) => {
    customValuesMap[item.field_definition_id] = item.value || "";
  });

  return (
    <ContactDetailClient
      contact={contact}
      interactions={interactionsRes.data || []}
      notes={notesRes.data || []}
      tasks={tasksRes.data || []}
      files={filesRes.data || []}
      auditLogs={auditLogsRes.data || []}
      customFields={customDefsRes.data || []}
      customValues={customValuesMap}
      userRole={userRole}
      userId={user.id}
    />
  );
}
