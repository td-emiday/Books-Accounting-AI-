// Service-role Supabase client. Bypasses RLS — use ONLY in server-only
// paths that have been authenticated by another mechanism (Paystack
// webhook signature, cron job secret, internal tooling).
//
// Never import this from client components or any handler that accepts
// arbitrary user input without external verification first.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Service-role Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
