import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AuditClient } from "./audit-client";

export default async function AuditSettingsPage() {
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

  // Fetch User Role
  const { data: memberRecord } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("profile_id", user.id)
    .single();

  const userRole = memberRecord?.role || "viewer";

  // Fetch Audit logs
  let logs: any[] = [];
  if (userRole === "owner" || userRole === "admin") {
    const { data } = await supabase
      .from("audit_logs")
      .select("*, profile:profiles(display_name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    
    logs = data || [];
  }

  return <AuditClient logs={logs} userRole={userRole} />;
}
