import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MembersClient } from "./members-client";

export default async function TeamSettingsPage() {
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

  // 1. Fetch member role
  const { data: memberRecord } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("profile_id", user.id)
    .single();

  const userRole = memberRecord?.role || "viewer";

  // 2. Fetch Members
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      id,
      profile_id,
      role,
      created_at,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  // 3. Fetch Invitations
  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // 4. Resolve emails of members using administrative SDK listing
  const emailsMap: Record<string, string> = {};
  try {
    const adminClient = await createAdminClient();
    const {
      data: { users: authUsers },
    } = await adminClient.auth.admin.listUsers();

    (authUsers || []).forEach((u) => {
      emailsMap[u.id] = u.email || "";
    });
  } catch (err) {
    // Fallback if admin key is not configured yet
    members?.forEach((m) => {
      emailsMap[m.profile_id] = "miembro@contactflow.com";
    });
  }

  const formattedMembers = (members || []).map((m: any) => ({
    id: m.id,
    profile_id: m.profile_id,
    role: m.role,
    created_at: m.created_at,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  return (
    <MembersClient
      members={formattedMembers}
      invitations={invitations || []}
      userRole={userRole}
      userId={user.id}
      orgId={orgId}
      emailsMap={emailsMap}
    />
  );
}
