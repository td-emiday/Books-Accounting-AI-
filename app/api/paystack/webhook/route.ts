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
import { sendMail } from "@/lib/mail";
import { getSiteOrigin } from "@/lib/site-url";

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
      // Idempotent on paystack_reference (UNIQUE in migration 010).
      // Paystack retries webhooks aggressively — without an upsert
      // here, a retried charge.success would 23505 and we'd 500
      // back to Paystack, kicking off more retries.
      const { error: payErr } = await admin
        .from("payments")
        .upsert(
          {
            workspace_id: workspaceId,
            paystack_reference: evt.data.reference ?? `ps_${Date.now()}`,
            paystack_event: evt.event,
            amount_kobo: evt.data.amount ?? 0,
            currency: evt.data.currency ?? "NGN",
            status: evt.data.status ?? "success",
            channel: evt.data.channel ?? null,
            paid_at: evt.data.paid_at ?? new Date().toISOString(),
            raw: evt.data,
          },
          { onConflict: "paystack_reference", ignoreDuplicates: true },
        );
      if (payErr) {
        console.error("[paystack] payments upsert failed", {
          workspace: workspaceId,
          reference: evt.data.reference,
          error: payErr.message,
        });
      }

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

      // Receipt email — fire-and-forget. Idempotent on
      // (workspace_id, template) within 12h, so a retried Paystack
      // webhook doesn't double-mail. We pull the workspace name +
      // owner email after the update lands.
      void sendReceiptEmail({
        admin,
        workspaceId,
        amountKobo: evt.data.amount ?? 0,
        currency: evt.data.currency ?? "NGN",
        reference: evt.data.reference ?? `ps_${Date.now()}`,
        paidAt: evt.data.paid_at ?? new Date().toISOString(),
        planTier,
        cycle: resolved?.cycle ?? "MONTHLY",
        nextPaymentDate: typeof evt.data.next_payment_date === "string"
          ? evt.data.next_payment_date
          : null,
        customerEmail: evt.data.customer?.email ?? null,
      });
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

      void sendDunningEmail({
        admin,
        workspaceId,
        customerEmail: evt.data.customer?.email ?? null,
        planCode: planCode ?? null,
      });
      break;
    }

    default:
      // Ignore everything else for now — log via Paystack dashboard.
      break;
  }

  return NextResponse.json({ ok: true });
}

// ────────────────────── email helpers ────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>;

async function workspaceEmailTarget(
  admin: AdminClient,
  workspaceId: string,
  customerEmail: string | null,
): Promise<{ to: string; firstName: string; workspaceName: string; ownerId: string | null } | null> {
  // Prefer the workspace owner's profile email; fall back to whatever
  // Paystack tells us about the customer.
  const { data: ws } = await admin
    .from("workspaces")
    .select("name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!ws) return null;

  let ownerEmail: string | null = null;
  let fullName: string | null = null;
  if (ws.owner_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", ws.owner_id)
      .maybeSingle();
    ownerEmail = profile?.email ?? null;
    fullName = profile?.full_name ?? null;
  }

  const to = ownerEmail ?? customerEmail;
  if (!to) return null;

  const firstName = (fullName ?? to).split(/[\s@]/)[0] || "there";
  return {
    to,
    firstName,
    workspaceName: (ws.name as string) ?? "your workspace",
    ownerId: ws.owner_id ?? null,
  };
}

function planLabelFor(planTier: string | null): "Growth" | "Pro" {
  if (planTier === "PRO" || planTier === "BUSINESS") return "Pro";
  return "Growth";
}

function priceLabelFor(planTier: string | null, cycle: string): string {
  const label = planLabelFor(planTier);
  const monthly = label === "Pro" ? 150_000 : 85_000;
  if (cycle === "ANNUAL") {
    return `₦${(monthly * 10).toLocaleString("en-NG")}/yr`;
  }
  return `₦${monthly.toLocaleString("en-NG")}/mo`;
}

async function sendReceiptEmail(args: {
  admin: AdminClient;
  workspaceId: string;
  amountKobo: number;
  currency: string;
  reference: string;
  paidAt: string;
  planTier: string | null;
  cycle: string;
  nextPaymentDate: string | null;
  customerEmail: string | null;
}) {
  try {
    const target = await workspaceEmailTarget(
      args.admin,
      args.workspaceId,
      args.customerEmail,
    );
    if (!target) return;
    const planLabel = planLabelFor(args.planTier);
    await sendMail({
      template: "receipt",
      to: target.to,
      subject: `Receipt — ₦${Math.round(args.amountKobo / 100).toLocaleString("en-NG")} · Emiday ${planLabel}`,
      workspaceId: args.workspaceId,
      userId: target.ownerId,
      // Idempotent: same reference within 12h is a duplicate webhook.
      dedupeWithinHours: 12,
      metadata: { reference: args.reference },
      props: {
        firstName: target.firstName,
        workspaceName: target.workspaceName,
        amountKobo: args.amountKobo,
        currency: args.currency,
        reference: args.reference,
        paidAt: args.paidAt,
        planLabel,
        cycleLabel: args.cycle === "ANNUAL" ? "Annual" : "Monthly",
        nextBillingDate: args.nextPaymentDate,
        billingUrl: `${getSiteOrigin()}/app/settings?tab=billing`,
      },
    });
  } catch (e) {
    console.error("[paystack] receipt email failed", {
      workspace: args.workspaceId,
      reference: args.reference,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function sendDunningEmail(args: {
  admin: AdminClient;
  workspaceId: string;
  customerEmail: string | null;
  planCode: string | null;
}) {
  try {
    const target = await workspaceEmailTarget(
      args.admin,
      args.workspaceId,
      args.customerEmail,
    );
    if (!target) return;
    const resolved = publicTierFromPlanCode(args.planCode);
    const planTier = resolved
      ? planTierFromPublicId(resolved.publicId)
      : null;
    const cycle = resolved?.cycle ?? "MONTHLY";
    const planLabel = planLabelFor(planTier);
    await sendMail({
      template: "payment_failed",
      to: target.to,
      subject: "We couldn't charge your card — let's fix that",
      workspaceId: args.workspaceId,
      userId: target.ownerId,
      // Don't dunning-mail the same workspace more than once a day.
      dedupeWithinHours: 24,
      props: {
        firstName: target.firstName,
        workspaceName: target.workspaceName,
        planLabel,
        priceLabel: priceLabelFor(planTier, cycle),
        retryUrl: `${getSiteOrigin()}/app/settings?tab=billing`,
        daysOfDataRetention: 7,
      },
    });
  } catch (e) {
    console.error("[paystack] dunning email failed", {
      workspace: args.workspaceId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
