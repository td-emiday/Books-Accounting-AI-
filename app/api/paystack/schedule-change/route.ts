// POST /api/paystack/schedule-change
//
// Schedules a plan change to apply at the end of the current billing
// cycle. We don't talk to Paystack now — just stash the target on the
// workspace. The /api/cron/paystack-rotate job applies it at
// `current_period_end` by disabling the old subscription and charging
// the stored authorization on the new plan.
//
// Body: form-encoded { plan, cycle }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  paystackPlanCodeFor,
  type BillingCycle,
  type PublicTierId,
} from "@/lib/tiers";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  }

  const form = await req.formData();
  const plan = String(form.get("plan") ?? "").toLowerCase() as PublicTierId;
  const cycle = String(form.get("cycle") ?? "MONTHLY").toUpperCase() as BillingCycle;

  if (plan !== "growth" && plan !== "pro") {
    return NextResponse.redirect(
      new URL("/app/settings?tab=billing&billing=invalid_plan", req.url),
      303,
    );
  }
  if (!paystackPlanCodeFor(plan, cycle)) {
    return NextResponse.redirect(
      new URL("/app/settings?tab=billing&billing=plan_not_configured", req.url),
      303,
    );
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(id, current_period_end, subscription_status, plan_tier, billing_cycle)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  type WsRow = {
    id: string;
    current_period_end: string | null;
    subscription_status: string | null;
    plan_tier: string | null;
    billing_cycle: string | null;
  };
  const wsRaw = membership?.workspace as unknown;
  const ws: WsRow | null = Array.isArray(wsRaw)
    ? ((wsRaw[0] as WsRow) ?? null)
    : ((wsRaw as WsRow | null) ?? null);

  if (!ws) {
    return NextResponse.redirect(new URL("/onboarding", req.url), 303);
  }

  // No active subscription → there's nothing to roll over. Send them
  // straight to checkout for an immediate start instead.
  if (ws.subscription_status !== "active") {
    return NextResponse.redirect(
      new URL("/app/settings?tab=billing&billing=no_active_sub_to_change", req.url),
      303,
    );
  }

  // Effective at the next renewal. Fall back to "+30 days" if for some
  // reason we don't have a renewal date yet (we usually do).
  const effectiveAt =
    ws.current_period_end ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("workspaces")
    .update({
      pending_plan_change: {
        public_id: plan,
        cycle,
        effective_at: effectiveAt,
      },
    })
    .eq("id", ws.id);

  return NextResponse.redirect(
    new URL("/app/settings?tab=billing&billing=scheduled", req.url),
    303,
  );
}
