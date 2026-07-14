import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get("contactflow:org_id")?.value;

  if (!orgId) {
    redirect("/onboarding");
  }

  // 1. Fetch User Role
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("profile_id", user.id)
    .single();

  const userRole = membership?.role || "viewer";

  // 2. Fetch Tasks in parallel with Contacts and Team members
  const tasksPromise = supabase
    .from("tasks")
    .select(`
      *,
      contact:contacts(display_name)
    `)
    .eq("organization_id", orgId)
    .order("due_date", { ascending: true });

  const contactsPromise = supabase
    .from("contacts")
    .select("id, display_name")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("display_name", { ascending: true });

  const teamPromise = supabase
    .from("organization_members")
    .select("profile_id, profiles(display_name)")
    .eq("organization_id", orgId);

  const [tasksRes, contactsRes, teamRes] = await Promise.all([
    tasksPromise,
    contactsPromise,
    teamPromise,
  ]);

  const teamMembers = (teamRes.data || [])
    .map((t: any) => ({
      id: t.profile_id,
      name: t.profiles?.display_name || "Desconocido",
    }))
    .filter(Boolean);

  return (
    <TasksClient
      tasks={tasksRes.data || []}
      contacts={contactsRes.data || []}
      teamMembers={teamMembers}
      userRole={userRole}
      userId={user.id}
    />
  );
}
