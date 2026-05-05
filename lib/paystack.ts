// Thin Paystack REST client — server-side only. Never import from a
// "use client" file. We use the secret key for everything; the hosted
// checkout URL returned by initialize() is what we redirect users to,
// so card data never touches our frontend.

const BASE = "https://api.paystack.co";

function key(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  return k;
}

type CallInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function call<T>(path: string, init: CallInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    // Always hit the network — Paystack data is never cacheable.
    cache: "no-store",
  });

  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !json.status) {
    throw new Error(`Paystack ${path} failed: ${json.message ?? res.statusText}`);
  }
  return json.data;
}

// ─────────────────── Transactions / Subscriptions ────────────────────

export type InitTxn = {
  email: string;
  amountKobo: number;       // Paystack expects amount in kobo
  reference?: string;
  callbackUrl: string;
  planCode?: string;        // when set, Paystack auto-creates a subscription
  metadata?: Record<string, unknown>;
};

export type InitTxnResp = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export function initializeTransaction(p: InitTxn): Promise<InitTxnResp> {
  return call<InitTxnResp>("/transaction/initialize", {
    method: "POST",
    body: {
      email: p.email,
      amount: p.amountKobo,
      reference: p.reference,
      callback_url: p.callbackUrl,
      plan: p.planCode,
      metadata: p.metadata,
    },
  });
}

export type VerifyTxnResp = {
  reference: string;
  status: "success" | "failed" | "abandoned";
  amount: number;
  currency: string;
  channel: string;
  paid_at: string;
  customer: { id: number; customer_code: string; email: string };
  plan?: string;            // plan code (or empty string)
  plan_object?: { id: number; plan_code: string };
  metadata?: Record<string, unknown>;
};

export function verifyTransaction(reference: string): Promise<VerifyTxnResp> {
  return call<VerifyTxnResp>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// Subscriptions (Paystack auto-creates the subscription when `plan` is
// passed to initialize, so we mostly only need to disable on cancel).

export type Subscription = {
  id: number;
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
  customer: { customer_code: string };
  plan: { plan_code: string };
};

export function listSubscriptionsForCustomer(
  customerCode: string,
): Promise<Subscription[]> {
  return call<Subscription[]>(
    `/subscription?customer=${encodeURIComponent(customerCode)}`,
  );
}

export function disableSubscription(p: {
  code: string;
  token: string;
}): Promise<unknown> {
  return call("/subscription/disable", { method: "POST", body: p });
}

// Charge a saved authorization (reusable token from charge.success).
// When `plan` is supplied, Paystack creates a fresh subscription on
// success — this is how end-of-cycle plan changes are applied.

export type ChargeAuthArgs = {
  email: string;
  amountKobo: number;
  authorizationCode: string;
  reference?: string;
  planCode?: string;
  metadata?: Record<string, unknown>;
};

export type ChargeAuthResp = {
  reference: string;
  status: "success" | "failed" | "abandoned";
  amount: number;
  currency: string;
  customer: { customer_code: string };
};

export function chargeAuthorization(p: ChargeAuthArgs): Promise<ChargeAuthResp> {
  return call<ChargeAuthResp>("/transaction/charge_authorization", {
    method: "POST",
    body: {
      email: p.email,
      amount: p.amountKobo,
      authorization_code: p.authorizationCode,
      reference: p.reference,
      plan: p.planCode,
      metadata: p.metadata,
    },
  });
}

// ──────────────────────────── Plans ──────────────────────────────────

export type Plan = {
  id: number;
  name: string;
  plan_code: string;
  amount: number;       // kobo
  interval: "monthly" | "annually" | "weekly" | "daily";
};

export function createPlan(p: {
  name: string;
  amountKobo: number;
  interval: "monthly" | "annually";
  description?: string;
}): Promise<Plan> {
  return call<Plan>("/plan", {
    method: "POST",
    body: {
      name: p.name,
      amount: p.amountKobo,
      interval: p.interval,
      description: p.description,
      currency: "NGN",
    },
  });
}

// ──────────────────────────── Webhook verify ─────────────────────────

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = createHmac("sha512", key()).update(rawBody).digest("hex");
  // timingSafeEqual requires equal-length buffers
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
