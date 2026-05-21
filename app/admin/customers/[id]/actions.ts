"use server";

// Server actions for the workspace deep-dive page. Every action
// gates on requireAdminUser() (throws if the caller isn't on the
// admin allowlist) and writes via the service-role product client
// so RLS doesn't block legitimate ops work.

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createProductAdminClient } from "@/lib/supabase/product";
import { sendMail } from "@/lib/mail";
import { getSiteOrigin } from "@/lib/site-url";

// ───────────────────── trial + subscription ─────────────────────

/** Extend a workspace's trial by N days. Useful for friends/beta cohort
 *  that need more runway without a Paystack charge. */
export async function extendTrial(workspaceId: string, days: number) {
  await requireAdminUser();
  if (!Number.isFinite(days) || days <= 0 || days > 365) {
    throw new Error("days must be 1..365");
  }
  const supa = createProductAdminClient();

  const { data: ws, error: readErr } = await supa
    .from("workspaces")
    .select("trial_ends_at")
    .eq("id", workspaceId)
    .maybeSingle();
  if (readErr) throw readErr;

  // Extend from the *later* of "now" and "current trial_ends_at" so
  // we don't accidentally shorten a still-active trial.
  const base = ws?.trial_ends_at
    ? Math.max(Date.now(), new Date(ws.trial_ends_at).getTime())
    : Date.now();
  const next = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supa
    .from("workspaces")
    .update({ trial_ends_at: next })
    .eq("id", workspaceId);
  if (error) throw error;
  revalidatePath(`/admin/customers/${workspaceId}`);
}

/** Mark a workspace as fully paid without a Paystack charge. For comp
 *  plans, friends, post-refund reactivations. Sets subscription_status
 *  to 'active' and pushes current_period_end out N days. */
export async function compPlan(workspaceId: string, days: number = 30) {
  await requireAdminUser();
  const supa = createProductAdminClient();
  const periodEnd = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await supa
    .from("workspaces")
    .update({
      subscription_status: "active",
      current_period_end: periodEnd,
    })
    .eq("id", workspaceId);
  if (error) throw error;
  revalidatePath(`/admin/customers/${workspaceId}`);
}

// ───────────────────── tour + onboarding ─────────────────────

/** Clear tour_completed_at so the user sees the welcome tour again. */
export async function resetTour(workspaceId: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();
  const { error } = await supa
    .from("workspaces")
    .update({ tour_completed_at: null })
    .eq("id", workspaceId);
  if (error) throw error;
  revalidatePath(`/admin/customers/${workspaceId}`);
}

// ───────────────────── Telegram pairing ─────────────────────

const PAIR_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatePairCode(len = 8): string {
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += PAIR_ALPHA[bytes[i] % PAIR_ALPHA.length];
  return out;
}

/** Mint an 8-char Telegram pairing code on the user's behalf. Useful
 *  when supporting a user over the phone — they can't reach Settings
 *  but you can read them a code that pairs their chat. */
export async function generateTelegramPairing(
  workspaceId: string,
  userId: string,
): Promise<{ code: string; url: string }> {
  await requireAdminUser();
  const supa = createProductAdminClient();
  const code = generatePairCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supa.from("channel_pairings").insert({
    code,
    workspace_id: workspaceId,
    user_id: userId,
    provider: "telegram",
    expires_at: expiresAt,
  });
  if (error) throw error;

  const username = process.env.TELEGRAM_BOT_USERNAME || "EmidayBot";
  return {
    code,
    url: `https://t.me/${username}?start=${code}`,
  };
}

// ───────────────────── emails ─────────────────────

/** Resend the welcome email to the workspace owner. */
export async function resendWelcome(workspaceId: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();

  const { data: ws } = await supa
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws?.owner_id) throw new Error("Workspace has no owner");

  const { data: profile } = await supa
    .from("profiles")
    .select("email, full_name")
    .eq("id", ws.owner_id)
    .maybeSingle();
  if (!profile?.email) throw new Error("Owner profile has no email");

  const firstName =
    (profile.full_name as string | null)?.split(/\s+/)[0] ??
    profile.email.split("@")[0];

  await sendMail({
    template: "welcome",
    to: profile.email,
    subject: `Welcome to Emiday, ${firstName} — your 10 days starts now`,
    workspaceId: ws.id,
    userId: ws.owner_id,
    // No dedupe — admin explicitly asked for a resend.
    props: {
      firstName,
      workspaceName: ws.name ?? "your workspace",
      appUrl: `${getSiteOrigin()}/app`,
      telegramBot: process.env.TELEGRAM_BOT_USERNAME,
    },
  });
  revalidatePath(`/admin/customers/${workspaceId}`);
}

// ───────────────────── auth ─────────────────────

/** Revoke every active Supabase session for the workspace owner — they
 *  next visit the site signed out. Useful when locking someone out. */
export async function forceSignOut(workspaceId: string) {
  await requireAdminUser();
  const supa = createProductAdminClient();

  const { data: ws } = await supa
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws?.owner_id) throw new Error("Workspace has no owner");

  // Supabase admin signOut revokes ALL refresh tokens for the user.
  const { error } = await supa.auth.admin.signOut(ws.owner_id, "global");
  if (error) throw error;
  revalidatePath(`/admin/customers/${workspaceId}`);
}

// ───────────────────── destructive: full delete ─────────────────────

/** Delete the workspace AND its owning user. Cascades through every
 *  child table (members, channels, txns, payments, email_log) via the
 *  ON DELETE CASCADE we set on those FKs. Caller must pass the
 *  workspace's exact name as a confirmation guard. */
export async function deleteWorkspaceAndOwner(
  workspaceId: string,
  confirmName: string,
) {
  await requireAdminUser();
  const supa = createProductAdminClient();

  const { data: ws } = await supa
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws) throw new Error("Workspace not found");

  if ((confirmName ?? "").trim() !== (ws.name ?? "").trim()) {
    throw new Error(`Confirmation name didn't match. Expected "${ws.name}".`);
  }

  // Wipe receipt storage objects first — they aren't FK-cascaded.
  await supa.storage
    .from("receipts")
    .list(`${workspaceId}/`, { limit: 1000 })
    .then(async ({ data: files }) => {
      if (!files || files.length === 0) return;
      const paths = files.map((f) => `${workspaceId}/${f.name}`);
      await supa.storage.from("receipts").remove(paths);
    })
    .catch(() => {
      /* non-fatal; bucket may not exist in dev */
    });

  // workspaces.owner_id has RESTRICT, so delete the workspace first.
  const { error: wsErr } = await supa
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);
  if (wsErr) throw wsErr;

  if (ws.owner_id) {
    // auth.users delete cascades to profiles via FK.
    const { error: userErr } = await supa.auth.admin.deleteUser(ws.owner_id);
    if (userErr) {
      console.error(
        "[admin] deleteWorkspaceAndOwner: workspace deleted but auth user delete failed",
        userErr,
      );
      // Don't rethrow — workspace is already gone. Surface in caller.
    }
  }

  revalidatePath("/admin/customers");
}
