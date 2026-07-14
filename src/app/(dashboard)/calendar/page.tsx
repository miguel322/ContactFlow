import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
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

  // Load pending tasks to display on calendar
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending");

  return <CalendarClient tasks={tasks || []} />;
}
