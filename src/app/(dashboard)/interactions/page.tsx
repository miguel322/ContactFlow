import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { InteractionsClient } from "@/components/layout/interactions-client";

export default async function InteractionsPage() {
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

  // Fetch all interactions for the active organization
  const { data: interactions } = await supabase
    .from("interactions")
    .select(`
      *,
      contact:contacts(id, display_name),
      user:profiles(id, display_name)
    `)
    .eq("organization_id", orgId)
    .order("date_time", { ascending: false });

  return <InteractionsClient interactions={interactions || []} />;
}
