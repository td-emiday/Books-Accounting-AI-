const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  plan?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createSubscription(params: {
  customer: string;
  plan: string;
}) {
  return paystackRequest('/subscription', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function cancelSubscription(subscriptionCode: string, token: string) {
  return paystackRequest('/subscription/disable', {
    method: 'POST',
    body: JSON.stringify({ code: subscriptionCode, token }),
  });
}

export async function verifyTransaction(reference: string) {
  return paystackRequest(`/transaction/verify/${reference}`);
}

export async function listTransactions(params?: {
  perPage?: number;
  page?: number;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams(params as any).toString();
  return paystackRequest(`/transaction?${query}`);
}
