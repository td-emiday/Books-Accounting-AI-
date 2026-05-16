"use server";

import { revalidatePath } from "next/cache";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { requireAdminUser } from "@/lib/admin-auth";

export async function addAdmin(form: { email: string; full_name: string }) {
  const me = await requireAdminUser();
  const supa = createAgentsAdminClient();
  const email = form.email.trim().toLowerCase();
  if (!email) throw new Error("Email required");
  const { error } = await supa.from("admin_users").insert({
    email,
    full_name: form.full_name.trim() || null,
    added_by: me.email,
    active: true,
  });
  if (error) throw error;
  revalidatePath("/admin/admins");
}

export async function setAdminActive(id: string, active: boolean) {
  const me = await requireAdminUser();
  const supa = createAgentsAdminClient();
  // Sanity: don't let an admin deactivate themselves and lock everyone out.
  const { data: row } = await supa
    .from("admin_users")
    .select("email")
    .eq("id", id)
    .maybeSingle();
  if (row?.email === me.email && !active) {
    throw new Error("You cannot deactivate yourself");
  }
  const { error } = await supa.from("admin_users").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/admins");
}
