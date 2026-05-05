// createTransaction — single helper used by inbound integrations
// (Telegram now, WhatsApp/import next) to insert a draft transaction
// into the workspace. Validates required fields, applies sensible
// defaults, and returns the inserted row.
//
// Caller passes a Supabase client — service-role for webhooks (no
// auth context), the user's client elsewhere. Don't bake the client
// into this helper, so RLS stays explicit.

import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateTransactionInput = {
  workspaceId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;             // major units (NGN)
  date: string;               // ISO YYYY-MM-DD
  description: string;
  source: string;             // 'TELEGRAM' | 'WHATSAPP' | 'BANK_IMPORT' | …
  currency?: string;
  vendorClient?: string | null;
  reference?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  categoryConfirmed?: boolean;
};

export type CreatedTransaction = {
  id: string;
  workspace_id: string;
  amount: number;
  date: string;
  description: string;
};

export async function createTransaction(
  client: SupabaseClient,
  input: CreateTransactionInput,
): Promise<CreatedTransaction> {
  if (!input.workspaceId) throw new Error("workspaceId required");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive number");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("date must be YYYY-MM-DD");
  }

  const row = {
    workspace_id: input.workspaceId,
    type: input.type,
    amount: input.amount,
    currency: input.currency ?? "NGN",
    date: input.date,
    description: input.description.slice(0, 200),
    vendor_client: input.vendorClient ?? null,
    source: input.source,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    receipt_url: input.receiptUrl ?? null,
    category_confirmed: input.categoryConfirmed ?? false,
  };

  const { data, error } = await client
    .from("transactions")
    .insert(row)
    .select("id, workspace_id, amount, date, description")
    .single();

  if (error) throw new Error(`insert transaction: ${error.message}`);
  return data as CreatedTransaction;
}
