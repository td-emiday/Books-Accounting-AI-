// POST /api/paystack/checkout
//
// Initiates a Paystack hosted checkout for the authenticated user's
// active workspace + chosen plan. Returns a 303 redirect to the
// Paystack-hosted authorization URL — the browser follows it. Card data
// never touches our frontend.
//
// Body: form-encoded { plan: "growth"|"pro", cycle: "MONTHLY"|"ANNUAL" }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializeTransaction } from "@/lib/paystack";
import {
  paystackPlanCodeFor,
  priceKoboFor,
  type BillingCycle,
  type PublicTierId,
} from "@/lib/tiers";
import { getSiteOrigin } from "@/lib/site-url";

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
      new URL("/app/settings?billing=invalid_plan", req.url),
      303,
    );
  }

  const planCode = paystackPlanCodeFor(plan, cycle);
  const amountKobo = priceKoboFor(plan, cycle);
  if (!planCode || !amountKobo) {
    return NextResponse.redirect(
      new URL("/app/settings?billing=plan_not_configured", req.url),
      303,
    );
  }

  // Find the active workspace so we can attach metadata + persist
  // customer/subscription codes after verify.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.redirect(new URL("/onboarding", req.url), 303);
  }

  // Mark the tour complete here. Whether the user clicked "Pay & start
  // using Emiday" inside the tour, or "Set up billing" from the banner
  // or settings, they've left the welcome flow either way. Doing this
  // server-side avoids the fire-and-forget /api/tour/complete fetch
  // racing against the redirect to Paystack.
  await supabase
    .from("workspaces")
    .update({ tour_completed_at: new Date().toISOString() })
    .eq("id", membership.workspace_id);

  const callbackUrl = `${getSiteOrigin(req)}/api/paystack/callback`;

  try {
    const txn = await initializeTransaction({
      email: user.email!,
      amountKobo,
      callbackUrl,
      planCode,
      metadata: {
        workspace_id: membership.workspace_id,
        user_id: user.id,
        plan,
        cycle,
      },
    });
    return NextResponse.redirect(txn.authorization_url, 303);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "checkout_failed";
    return NextResponse.redirect(
      new URL(`/app/settings?billing=error&reason=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  }
}
