import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OrganizationClient } from "./organization-client";

export default async function OrganizationSettingsPage() {
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

  // Fetch organization details
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url")
    .eq("id", orgId)
    .single();

  if (!org) {
    redirect("/onboarding");
  }

  // Fetch member role
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("profile_id", user.id)
    .single();

  const userRole = membership?.role || "viewer";

  return (
    <OrganizationClient
      org={org}
      userRole={userRole}
    />
  );
}
