import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
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

  // Fetch Categories
  const { data: categories } = await supabase
    .from("contact_categories")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  return <CategoriesClient categories={categories || []} userRole={userRole} />;
}
