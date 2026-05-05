// POST /api/paystack/webhook
//
// Paystack server-to-server events. We verify HMAC against the secret
// key, then update workspaces + payments using the service-role client
// (so RLS doesn't block writes).

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paystack";
import {
  planTierFromPublicId,
  publicTierFromPlanCode,
} from "@/lib/tiers";

type PaystackEvent = {
  event: string;
  data: Record<string, unknown> & {
    customer?: { customer_code?: string; email?: string };
    plan?: { plan_code?: string } | string;
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    channel?: string;
    paid_at?: string;
    authorization?: { authorization_code?: string; reusable?: boolean };
    metadata?: { workspace_id?: string };
  };
};

export async function POST(req: Request) {
  const signature = req.headers.get("x-paystack-signature");
  const raw = await req.text();
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 400 });
  }

  const evt = JSON.parse(raw) as PaystackEvent;
  const admin = createAdminClient();

  // Resolve a workspace via metadata first (covers initial checkout),
  // then customer code (covers renewals + subscription state changes).
  async function resolveWorkspaceId(): Promise<string | null> {
    const fromMeta = evt.data.metadata?.workspace_id;
    if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
    const customerCode = evt.data.customer?.customer_code;
    if (!customerCode) return null;
    const { data } = await admin
      .from("workspaces")
      .select("id")
      .eq("paystack_customer_code", customerCode)
      .maybeSingle();
    return data?.id ?? null;
  }

  const planCode =
    typeof evt.data.plan === "object" && evt.data.plan
      ? (evt.data.plan as { plan_code?: string }).plan_code
      : typeof evt.data.plan === "string"
        ? evt.data.plan
        : null;

  const workspaceId = await resolveWorkspaceId();

  switch (evt.event) {
    case "charge.success": {
      // Append a payment row + (re)mark the workspace active.
      if (!workspaceId) break;
      await admin.from("payments").insert({
        workspace_id: workspaceId,
        paystack_reference: evt.data.reference ?? `ps_${Date.now()}`,
        paystack_event: evt.event,
        amount_kobo: evt.data.amount ?? 0,
        currency: evt.data.currency ?? "NGN",
        status: evt.data.status ?? "success",
        channel: evt.data.channel ?? null,
        paid_at: evt.data.paid_at ?? new Date().toISOString(),
        raw: evt.data,
      });

      const resolved = publicTierFromPlanCode(planCode);
      const planTier = resolved ? planTierFromPublicId(resolved.publicId) : null;
      const patch: Record<string, unknown> = {
        subscription_status: "active",
        paystack_customer_code: evt.data.customer?.customer_code ?? undefined,
      };
      if (planTier) patch.plan_tier = planTier;
      if (resolved?.cycle) patch.billing_cycle = resolved.cycle;
      // Stash the reusable authorization code so the end-of-cycle
      // cron can charge again on the new plan without user action.
      const authCode = evt.data.authorization?.authorization_code;
      const reusable = evt.data.authorization?.reusable;
      if (authCode && reusable !== false) patch.paystack_authorization_code = authCode;
      await admin.from("workspaces").update(patch).eq("id", workspaceId);
      break;
    }

    case "subscription.create": {
      if (!workspaceId) break;
      await admin
        .from("workspaces")
        .update({
          paystack_subscription_code: evt.data.subscription_code ?? null,
          paystack_email_token: evt.data.email_token ?? null,
          subscription_status: "active",
          current_period_end: evt.data.next_payment_date ?? null,
        })
        .eq("id", workspaceId);
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      if (!workspaceId) break;
      await admin
        .from("workspaces")
        .update({
          subscription_status:
            evt.event === "subscription.disable" ? "cancelled" : "non_renewing",
        })
        .eq("id", workspaceId);
      break;
    }

    case "invoice.payment_failed": {
      if (!workspaceId) break;
      await admin
        .from("workspaces")
        .update({ subscription_status: "past_due" })
        .eq("id", workspaceId);
      break;
    }

    default:
      // Ignore everything else for now — log via Paystack dashboard.
      break;
  }

  return NextResponse.json({ ok: true });
}
