// GET /api/paystack/callback?reference=...
//
// Paystack redirects the customer here after the hosted checkout
// resolves. We verify the transaction server-side and, on success,
// update the workspace's plan + subscription state. The webhook is
// the long-term source of truth, but this gives the user instant
// feedback by updating the workspace before the redirect into /app.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTransaction, listSubscriptionsForCustomer } from "@/lib/paystack";
import {
  planTierFromPublicId,
  publicTierFromPlanCode,
  type BillingCycle,
} from "@/lib/tiers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  if (!reference) {
    return NextResponse.redirect(new URL("/app/settings?billing=missing_reference", req.url), 303);
  }

  let txn;
  try {
    txn = await verifyTransaction(reference);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verify_failed";
    return NextResponse.redirect(
      new URL(`/app/settings?billing=error&reason=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  }

  if (txn.status !== "success") {
    return NextResponse.redirect(
      new URL(`/app/settings?billing=${txn.status}`, req.url),
      303,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Session expired during the Paystack hop — send to sign-in.
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  }

  const meta = (txn.metadata ?? {}) as Record<string, unknown>;
  const workspaceId =
    typeof meta.workspace_id === "string" ? meta.workspace_id : null;

  if (!workspaceId) {
    return NextResponse.redirect(
      new URL("/app/settings?billing=missing_workspace", req.url),
      303,
    );
  }

  // Resolve which plan + cycle was actually billed using the plan code
  // Paystack returned (don't trust the metadata we set client-side).
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
    // Non-fatal: the webhook will reconcile.
  }

  const patch: Record<string, unknown> = {
    paystack_customer_code: txn.customer.customer_code,
    subscription_status: "active",
  };
  if (planTier) patch.plan_tier = planTier;
  patch.billing_cycle = cycle;
  if (subscriptionCode) patch.paystack_subscription_code = subscriptionCode;
  if (emailToken) patch.paystack_email_token = emailToken;
  if (nextPaymentDate) patch.current_period_end = nextPaymentDate;

  await supabase.from("workspaces").update(patch).eq("id", workspaceId);

  return NextResponse.redirect(new URL("/app?billing=success", req.url), 303);
}
