"use server";

import { revalidatePath } from "next/cache";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { requireAdminUser } from "@/lib/admin-auth";

async function requireAdmin() {
  await requireAdminUser();
}

const SUPABASE_FUNCTIONS_BASE = "https://jjcslovajuxsqykrdacv.supabase.co/functions/v1";

/** Invoke an edge function with the service-role key. */
async function invokeFunction(name: string, body: Record<string, unknown> = {}): Promise<string> {
  const key = process.env.AGENTS_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("AGENTS_SUPABASE_SERVICE_ROLE_KEY not set");
  const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} failed (${res.status}): ${text}`);
  return text;
}

export async function runContentAgent(opts: { dryRun?: boolean } = {}) {
  await requireAdmin();
  const result = await invokeFunction("content-agent", { dry_run: opts.dryRun ?? false });
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  return result;
}

export async function runDesignAgent() {
  await requireAdmin();
  const result = await invokeFunction("design-agent", {});
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  return result;
}

export async function runDistribution() {
  await requireAdmin();
  const result = await invokeFunction("distribution-agent", {});
  revalidatePath("/admin");
  revalidatePath("/admin/archive");
  return result;
}

export async function runWeeklyCycle() {
  await requireAdmin();
  const result = await invokeFunction("weekly-cycle", {});
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  return result;
}

// Facts CRUD ------------------------------------------------------------

export async function addFact(form: { fact: string; category: string }) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa.from("facts").insert({
    fact: form.fact,
    category: form.category || null,
    approved_by: "td@emiday.io",
  });
  if (error) throw error;
  revalidatePath("/admin/facts");
}

export async function toggleFact(id: string, active: boolean) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa.from("facts").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/facts");
}

export async function deleteFact(id: string) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa.from("facts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/facts");
}

// Rules — read-only mostly, but allow deactivating bad rules ------------

export async function setRuleActive(id: string, active: boolean) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa
    .from("content_rules")
    .update({ active, source: "human" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/rules");
}
