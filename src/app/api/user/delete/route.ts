import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Check user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    // Cascade delete user in auth schema (triggers on delete cascade in public schema)
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al eliminar usuario" }, { status: 500 });
  }
}
