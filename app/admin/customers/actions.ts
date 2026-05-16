"use server";

import { revalidatePath } from "next/cache";
import { createProductAdminClient } from "@/lib/supabase/product";
import { requireAdminUser } from "@/lib/admin-auth";

export async function suspendWorkspace(id: string, reason: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();
  const { error } = await supa
    .from("workspaces")
    .update({ suspended_at: new Date().toISOString(), suspended_reason: reason || "admin action" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/customers");
}

export async function unsuspendWorkspace(id: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();
  const { error } = await supa
    .from("workspaces")
    .update({ suspended_at: null, suspended_reason: null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/customers");
}

export async function sendPasswordReset(email: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();
  // Supabase admin auth: generate a recovery link the user can click to reset.
  // Returns a URL; we don't email it directly here — that's their auth flow's job.
  const { data, error } = await supa.auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  return { link: data.properties.action_link };
}
