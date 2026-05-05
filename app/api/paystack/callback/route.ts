// GET /api/paystack/callback?reference=...
//
// Paystack redirects the customer here after the hosted checkout
// resolves. We verify server-side and update the workspace using the
// service-role client — that way the redirect always lands on /app
// even if the user's session cookie was dropped during the Paystack
// hop. The webhook is still the long-term source of truth.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction, listSubscriptionsForCustomer } from "@/lib/paystack";
import {
  planTierFromPublicId,
  publicTierFromPlanCode,
  type BillingCycle,
} from "@/lib/tiers";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  const home = siteOrigin(req);

  if (!reference) {
    return NextResponse.redirect(`${home}/app?billing=missing_reference`, 303);
  }

  let txn;
  try {
    txn = await verifyTransaction(reference);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify_failed";
    return NextResponse.redirect(
      `${home}/app?billing=error&reason=${encodeURIComponent(msg)}`,
      303,
    );
  }

  if (txn.status !== "success") {
    return NextResponse.redirect(`${home}/app?billing=${txn.status}`, 303);
  }

  const meta = (txn.metadata ?? {}) as Record<string, unknown>;
  const workspaceId =
    typeof meta.workspace_id === "string" ? meta.workspace_id : null;

  if (!workspaceId) {
    return NextResponse.redirect(`${home}/app?billing=missing_workspace`, 303);
  }

  // Resolve plan + cycle from the plan code Paystack returned (don't
  // trust client-supplied metadata for the tier itself).
  const planCode = txn.plan_object?.plan_code ?? txn.plan ?? null;
  const resolved = publicTierFromPlanCode(planCode);
  const planTier = resolved ? planTierFromPublicId(resolved.publicId) : null;
  const cycle: BillingCycle = resolved?.cycle ?? "MONTHLY";

  // Look up the subscription Paystack just created so we can store
  // its code + email_token (needed for cancel/manage flows).
  let subscriptionCode: string | null = null;
  let emailToken: string | null = null;
  let nextPaymentDate: string | null = null;
  try {
    const subs = await listSubscriptionsForCustomer(txn.customer.customer_code);
    const match = subs.find((s) => s.plan?.plan_code === planCode);
    if (match) {
      subscriptionCode = match.subscription_code;
      emailToken = match.email_token;
      nextPaymentDate = match.next_payment_date;
    }
  } catch {
    // Non-fatal: the webhook reconciles.
  }

  const patch: Record<string, unknown> = {
    paystack_customer_code: txn.customer.customer_code,
    subscription_status: "active",
    // Tour is implicitly complete once payment lands.
    tour_completed_at: new Date().toISOString(),
  };
  if (planTier) patch.plan_tier = planTier;
  patch.billing_cycle = cycle;
  if (subscriptionCode) patch.paystack_subscription_code = subscriptionCode;
  if (emailToken) patch.paystack_email_token = emailToken;
  if (nextPaymentDate) patch.current_period_end = nextPaymentDate;

  // Service-role client: bypasses RLS and works even when the user's
  // session cookie was dropped during the Paystack hop.
  const admin = createAdminClient();
  await admin.from("workspaces").update(patch).eq("id", workspaceId);

  // Always land on the dashboard. If the session is intact, they're
  // signed in. If not, the proxy will route them through sign-in and
  // straight back here.
  return NextResponse.redirect(`${home}/app?billing=success`, 303);
}
