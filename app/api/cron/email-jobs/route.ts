// GET /api/cron/email-jobs
//
// Daily Vercel Cron (03:00 UTC). Two trial-stage emails:
//   1. Trial midpoint  — workspaces ~5 days into their 10-day trial
//   2. Trial ending    — workspaces with <24h left on their trial
//
// Both go through lib/mail.sendMail which dedupes via email_log so
// even a manual re-run won't double-send. We write a summary back to
// the response for inspection in vercel logs.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HOUR = 60 * 60 * 1000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.CRON_BYPASS === "1" && process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }
  const got = req.headers.get("authorization") ?? "";
  return got === `Bearer ${secret}`;
}

type WorkspaceRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
  plan_tier: string | null;
  billing_cycle: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

const ngn = (n: number) =>
  `₦${Math.round(n).toLocaleString("en-NG")}`;

const planLabelFor = (planTier: string | null): "Growth" | "Pro" =>
  planTier === "PRO" || planTier === "BUSINESS" ? "Pro" : "Growth";

const priceLabelFor = (planTier: string | null, cycle: string | null) => {
  const monthly = planLabelFor(planTier) === "Pro" ? 150_000 : 85_000;
  return cycle === "ANNUAL" ? `₦${(monthly * 10).toLocaleString("en-NG")}/yr`
    : `₦${monthly.toLocaleString("en-NG")}/mo`;
};

const firstOf = (full: string | null, email: string | null) => {
  if (full && full.trim()) return full.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "there";
};

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  // Pull every workspace currently in trial. Cheap query — workspace
  // table is small at this stage; we filter in code.
  const { data: rows, error } = await admin
    .from("workspaces")
    .select(
      "id, name, owner_id, plan_tier, billing_cycle, trial_ends_at, subscription_status",
    )
    .in("subscription_status", ["pending", "past_due"])
    .not("trial_ends_at", "is", null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const midpoint: WorkspaceRow[] = [];
  const ending: WorkspaceRow[] = [];

  for (const ws of (rows ?? []) as WorkspaceRow[]) {
    if (!ws.trial_ends_at) continue;
    const endsAt = new Date(ws.trial_ends_at).getTime();
    const msLeft = endsAt - now;
    if (msLeft <= 0) continue;        // already locked

    // Midpoint window: ~5 days into the 10-day trial = 5 days remaining,
    // give or take 12h either side so the daily cron always catches it.
    const days = msLeft / (24 * HOUR);
    if (days <= 5.5 && days >= 4.5) midpoint.push(ws);

    // Ending window: less than 24h, more than 12h. Catches each
    // workspace exactly once before lock-out.
    const hours = msLeft / HOUR;
    if (hours <= 24 && hours >= 12) ending.push(ws);
  }

  const results: { template: string; workspace: string; status: string }[] = [];

  for (const ws of midpoint) {
    const r = await sendTrialMidpoint(admin, ws);
    results.push({ template: "trial_midpoint", workspace: ws.id, status: r });
  }
  for (const ws of ending) {
    const r = await sendTrialEnding(admin, ws);
    results.push({ template: "trial_ending", workspace: ws.id, status: r });
  }

  return NextResponse.json({
    ok: true,
    scanned: rows?.length ?? 0,
    candidates: { midpoint: midpoint.length, ending: ending.length },
    results,
  });
}

async function ownerEmail(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string | null,
): Promise<ProfileRow | null> {
  if (!ownerId) return null;
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", ownerId)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

async function sendTrialMidpoint(
  admin: ReturnType<typeof createAdminClient>,
  ws: WorkspaceRow,
): Promise<string> {
  const owner = await ownerEmail(admin, ws.owner_id);
  if (!owner?.email) return "skipped_no_owner";

  // Pull a tiny snapshot of activity to personalise the body.
  const { count: txnCount } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id);

  let topCategory: string | null = null;
  let topCategoryAmount: number | null = null;
  if ((txnCount ?? 0) > 0) {
    const since = new Date(Date.now() - 30 * 24 * HOUR).toISOString().slice(0, 10);
    const { data: txns } = await admin
      .from("transactions")
      .select("amount, type, category:categories(name)")
      .eq("workspace_id", ws.id)
      .gte("date", since)
      .limit(500);
    const totals = new Map<string, number>();
    for (const t of (txns ?? []) as {
      amount: number | string;
      type: string;
      category: { name: string } | { name: string }[] | null;
    }[]) {
      if (t.type !== "EXPENSE") continue;
      const cat = Array.isArray(t.category) ? t.category[0] : t.category;
      const name = cat?.name ?? "Uncategorised";
      const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
      totals.set(name, (totals.get(name) ?? 0) + amt);
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted[0]) {
      topCategory = sorted[0][0];
      topCategoryAmount = sorted[0][1];
    }
  }

  const daysLeft =
    ws.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(ws.trial_ends_at).getTime() - Date.now()) / (24 * HOUR)))
      : 0;

  const firstName = firstOf(owner.full_name, owner.email);
  const result = await sendMail({
    template: "trial_midpoint",
    to: owner.email,
    subject:
      (txnCount ?? 0) > 0
        ? "Halfway through your trial — here's what's working"
        : `${daysLeft} days left in your Emiday trial`,
    workspaceId: ws.id,
    userId: owner.id,
    dedupeWithinHours: 24 * 7, // never twice in the same trial
    props: {
      firstName,
      workspaceName: ws.name ?? "your workspace",
      daysLeft,
      txnsLogged: txnCount ?? 0,
      topCategory,
      topCategoryAmount,
      appUrl: `${getSiteOrigin()}/app`,
    },
  });
  return result.status;
}

async function sendTrialEnding(
  admin: ReturnType<typeof createAdminClient>,
  ws: WorkspaceRow,
): Promise<string> {
  const owner = await ownerEmail(admin, ws.owner_id);
  if (!owner?.email) return "skipped_no_owner";

  const { count: txnCount } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id);

  const hoursLeft = ws.trial_ends_at
    ? Math.max(
        0,
        (new Date(ws.trial_ends_at).getTime() - Date.now()) / HOUR,
      )
    : 0;

  const planLabel = planLabelFor(ws.plan_tier);
  const firstName = firstOf(owner.full_name, owner.email);
  const result = await sendMail({
    template: "trial_ending",
    to: owner.email,
    subject: "Your trial ends tomorrow",
    workspaceId: ws.id,
    userId: owner.id,
    dedupeWithinHours: 24 * 7, // never twice
    props: {
      firstName,
      workspaceName: ws.name ?? "your workspace",
      hoursLeft,
      txnsLogged: txnCount ?? 0,
      planLabel,
      priceLabel: priceLabelFor(ws.plan_tier, ws.billing_cycle),
      billingUrl: `${getSiteOrigin()}/app/settings?tab=billing`,
    },
  });
  return result.status;
}
