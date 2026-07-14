import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IntegrationsClient } from "./integrations-client";

export default async function IntegrationsPage() {
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

  // Load configured integrations
  const { data: integrations } = await supabase
    .from("external_integrations")
    .select("*")
    .eq("organization_id", orgId);

  return <IntegrationsClient integrations={integrations || []} />;
}
