import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
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

  // Load stats in parallel
  const totalContactsPromise = supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  const pendingTasksPromise = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "pending");

  const overdueTasksPromise = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString());

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthInteractionsPromise = supabase
    .from("interactions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("date_time", startOfMonth.toISOString());

  const recentContactsPromise = supabase
    .from("contacts")
    .select("id, display_name, company_name, job_title, status, created_at, avatar_url")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const upcomingMeetingsPromise = supabase
    .from("tasks")
    .select("id, title, due_date, priority, contact:contacts(display_name)")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(5);

  const recentInteractionsPromise = supabase
    .from("interactions")
    .select("id, type, date_time, description, contact:contacts(display_name)")
    .eq("organization_id", orgId)
    .order("date_time", { ascending: false })
    .limit(5);

  // Load all categories for counting
  const categoriesPromise = supabase
    .from("contact_categories")
    .select("id, name")
    .eq("organization_id", orgId);

  // Load all category assignments for this organization's contacts
  const categoryAssignmentsPromise = supabase
    .from("contact_category_assignments")
    .select("category_id, contact:contacts!inner(id, organization_id)")
    .eq("contact.organization_id", orgId);

  // Load status values to count
  const statusCountsPromise = supabase
    .from("contacts")
    .select("status")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  const [
    totalContactsRes,
    pendingTasksRes,
    overdueTasksRes,
    monthInteractionsRes,
    recentContactsRes,
    upcomingMeetingsRes,
    recentInteractionsRes,
    categoriesRes,
    assignmentsRes,
    statusCountsRes,
  ] = await Promise.all([
    totalContactsPromise,
    pendingTasksPromise,
    overdueTasksPromise,
    monthInteractionsPromise,
    recentContactsPromise,
    upcomingMeetingsPromise,
    recentInteractionsPromise,
    categoriesPromise,
    categoryAssignmentsPromise,
    statusCountsPromise,
  ]);

  // Build Category Chart Data
  const categories = categoriesRes.data || [];
  const assignments = assignmentsRes.data || [];
  const categoryMap: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryMap[cat.name] = 0;
  });
  assignments.forEach((ass: any) => {
    const matchedCat = categories.find((c) => c.id === ass.category_id);
    if (matchedCat) {
      categoryMap[matchedCat.name] = (categoryMap[matchedCat.name] || 0) + 1;
    }
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Build Status Chart Data
  const statusList = statusCountsRes.data || [];
  const statusMap: Record<string, number> = {};
  statusList.forEach((c) => {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <DashboardClient
      stats={{
        totalContacts: totalContactsRes.count || 0,
        pendingTasks: pendingTasksRes.count || 0,
        overdueTasks: overdueTasksRes.count || 0,
        monthInteractions: monthInteractionsRes.count || 0,
      }}
      recentContacts={recentContactsRes.data || []}
      upcomingMeetings={upcomingMeetingsRes.data || []}
      recentActivity={recentInteractionsRes.data || []}
      categoryData={categoryData}
      statusData={statusData}
    />
  );
}
