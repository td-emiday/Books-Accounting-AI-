// GET /api/cron/paystack-rotate
//
// Daily Vercel Cron. Finds workspaces whose `pending_plan_change`
// effective_at is in the past, disables their old Paystack
// subscription, then charges the stored authorization with the new
// plan code (Paystack auto-creates a fresh subscription on success).
//
// Authentication: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
// when CRON_SECRET is set. Configure CRON_SECRET in env.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  chargeAuthorization,
  disableSubscription,
} from "@/lib/paystack";
import {
  paystackPlanCodeFor,
  priceKoboFor,
  type BillingCycle,
  type PublicTierId,
} from "@/lib/tiers";

export const dynamic = "force-dynamic";

type Pending = {
  public_id?: string;
  cycle?: string;
  effective_at?: string;
};

type WorkspaceRow = {
  id: string;
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  paystack_authorization_code: string | null;
  paystack_customer_code: string | null;
  pending_plan_change: Pending | null;
  // We need an email to charge — fall back to the owner's profile email.
  owner_id: string | null;
};

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // In prod we *require* a configured secret. Returning 200 with no
  // auth previously meant anyone could rotate every workspace's
  // subscription — that was a real security hole. Local dev still
  // gets a courtesy bypass via `CRON_BYPASS=1`.
  if (!secret) {
    if (process.env.CRON_BYPASS === "1" && process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: rows, error } = await admin
    .from("workspaces")
    .select(
      "id, paystack_subscription_code, paystack_email_token, paystack_authorization_code, paystack_customer_code, pending_plan_change, owner_id",
    )
    .not("pending_plan_change", "is", null)
    .lte("pending_plan_change->>effective_at", now);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];

  for (const ws of (rows ?? []) as WorkspaceRow[]) {
    const pending = ws.pending_plan_change ?? {};
    const publicId = pending.public_id as PublicTierId | undefined;
    const cycle = (pending.cycle ?? "MONTHLY") as BillingCycle;

    if (!publicId || (publicId !== "growth" && publicId !== "pro")) {
      results.push({ id: ws.id, ok: false, reason: "invalid_target_plan" });
      await admin.from("workspaces").update({ pending_plan_change: null }).eq("id", ws.id);
      continue;
    }
    if (!ws.paystack_authorization_code || !ws.paystack_customer_code) {
      results.push({ id: ws.id, ok: false, reason: "missing_authorization" });
      // Don't clear — they might pay manually and the auth lands later.
      continue;
    }
    const newPlanCode = paystackPlanCodeFor(publicId, cycle);
    const amountKobo = priceKoboFor(publicId, cycle);
    if (!newPlanCode || !amountKobo) {
      results.push({ id: ws.id, ok: false, reason: "plan_not_configured" });
      continue;
    }

    // Look up the owner's email — needed for charge_authorization.
    let email: string | null = null;
    if (ws.owner_id) {
      const { data: owner } = await admin
        .from("profiles")
        .select("email")
        .eq("id", ws.owner_id)
        .maybeSingle();
      email = owner?.email ?? null;
    }
    if (!email) {
      results.push({ id: ws.id, ok: false, reason: "missing_owner_email" });
      continue;
    }

    // 1) Disable the old subscription (best effort — if it's already
    //    expired naturally, Paystack returns an error we can ignore).
    if (ws.paystack_subscription_code && ws.paystack_email_token) {
      try {
        await disableSubscription({
          code: ws.paystack_subscription_code,
          token: ws.paystack_email_token,
        });
      } catch {
        // Non-fatal.
      }
    }

    // 2) Charge the stored authorization on the new plan. Paystack
    //    creates a new subscription server-side on success; the
    //    `subscription.create` webhook will record the new codes.
    try {
      await chargeAuthorization({
        email,
        amountKobo,
        authorizationCode: ws.paystack_authorization_code,
        planCode: newPlanCode,
        metadata: { workspace_id: ws.id, source: "scheduled_change" },
      });
      // Optimistic local update — webhook reconciles the rest.
      await admin
        .from("workspaces")
        .update({
          pending_plan_change: null,
          billing_cycle: cycle,
          subscription_status: "active",
        })
        .eq("id", ws.id);
      results.push({ id: ws.id, ok: true });
    } catch (e) {
      results.push({
        id: ws.id,
        ok: false,
        reason: e instanceof Error ? e.message : "charge_failed",
      });
      await admin
        .from("workspaces")
        .update({ subscription_status: "past_due" })
        .eq("id", ws.id);
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
