"use server";

import { revalidatePath } from "next/cache";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { requireAdminUser } from "@/lib/admin-auth";

async function requireAdmin() {
  return await requireAdminUser();
}

export async function approveDraft(id: string) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa
    .from("content_drafts")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}`);
}

export async function rejectDraft(id: string, reason?: string) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa
    .from("content_drafts")
    .update({ status: "rejected", review_reason: reason ?? null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}`);
}

export async function updateDraftCopy(id: string, patch: {
  copy?: string;
  headline?: string | null;
  subheadline?: string | null;
  hashtags?: string[] | null;
}) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error } = await supa
    .from("content_drafts")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/admin/content/${id}`);
}

export async function markPostedManually(id: string, opts: { platformPostUrl?: string }) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  // Read draft to copy into archive
  const { data: draft, error: dErr } = await supa
    .from("content_drafts")
    .select("id,channel,pillar,copy,visual_url,week_of")
    .eq("id", id)
    .single();
  if (dErr || !draft) throw dErr ?? new Error("draft not found");

  await supa.from("content_archive").insert({
    draft_id: draft.id,
    channel: draft.channel,
    pillar: draft.pillar,
    copy: draft.copy,
    visual_url: draft.visual_url,
    platform_post_url: opts.platformPostUrl || null,
    posted_manually: true,
    week_of: draft.week_of,
  });
  const { error: uErr } = await supa
    .from("content_drafts")
    .update({ status: "posted_manually" })
    .eq("id", id);
  if (uErr) throw uErr;
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}`);
}

export async function approveAll(weekOf: string) {
  await requireAdmin();
  const supa = createAgentsAdminClient();
  const { error, count } = await supa
    .from("content_drafts")
    .update({ status: "approved" }, { count: "exact" })
    .eq("week_of", weekOf)
    .in("status", ["draft", "design_complete"])
    .eq("requires_human_review", false);
  if (error) throw error;
  revalidatePath("/admin/content");
  return count ?? 0;
}
