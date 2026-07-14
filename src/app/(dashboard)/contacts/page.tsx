import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ContactsClient } from "./contacts-client";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    owner?: string;
    page?: string;
    archived?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  let orgId = cookieStore.get("contactflow:org_id")?.value;

  if (!orgId) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("profile_id", user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].organization_id;
    } else {
      redirect("/onboarding");
    }
  }

  // Resolve searchParams
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "";
  const category = resolvedParams.category || "";
  const owner = resolvedParams.owner || "";
  const archived = resolvedParams.archived || "false";
  const currentPage = parseInt(resolvedParams.page || "1", 10);

  // 1. Fetch user role
  const { data: memberRecord } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("profile_id", user.id)
    .single();

  const userRole = memberRecord?.role || "viewer";

  // 2. Fetch categories
  const { data: categories } = await supabase
    .from("contact_categories")
    .select("id, name")
    .eq("organization_id", orgId);

  // 3. Fetch team members (owners)
  const { data: teamMembers } = await supabase
    .from("organization_members")
    .select("profile_id, profiles(display_name)")
    .eq("organization_id", orgId);

  const owners = (teamMembers || [])
    .map((tm: any) => ({
      id: tm.profile_id,
      name: tm.profiles?.display_name || "Desconocido",
    }))
    .filter(Boolean);

  // 4. Build Core Paginated Contacts Query
  let query = supabase
    .from("contacts")
    .select(
      `
      id,
      display_name,
      company_name,
      job_title,
      status,
      source,
      website,
      created_at,
      avatar_url,
      phones:contact_phones(id, phone, is_primary),
      emails:contact_emails(id, email, is_primary),
      category_assignments:contact_category_assignments(
        category:contact_categories(id, name, color)
      )
    `,
      { count: "exact" }
    )
    .eq("organization_id", orgId);

  // Filter archived
  if (archived === "true") {
    query = query.eq("status", "archived");
  } else {
    query = query.is("deleted_at", null).neq("status", "archived");
  }

  // Search
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  // Status
  if (status) {
    query = query.eq("status", status);
  }

  // Category Filter
  if (category) {
    const { data: assigns } = await supabase
      .from("contact_category_assignments")
      .select("contact_id")
      .eq("category_id", category);

    const ids = (assigns || []).map((a) => a.contact_id);
    query = query.in("id", ids);
  }

  // Owner Filter
  if (owner) {
    query = query.eq("owner_id", owner);
  }

  // Order
  query = query.order("display_name", { ascending: true });

  // Pagination Slice
  const limit = 10;
  const offset = (currentPage - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: contacts, count } = await query;
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <ContactsClient
      contacts={contacts || []}
      categories={categories || []}
      owners={owners}
      totalPages={totalPages}
      currentPage={currentPage}
      totalCount={totalCount}
      userRole={userRole}
    />
  );
}
