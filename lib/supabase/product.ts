// Service-role Supabase client for the PRODUCT project (EMIDAY ACC — yegefmfggpicsmiulfkk).
// Used by the /admin/customers page to read workspaces, profiles, subscriptions.
// Bypasses RLS — only call from server actions/pages that have verified admin auth.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createProductAdminClient() {
  const url = process.env.PRODUCT_SUPABASE_URL;
  const key = process.env.PRODUCT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Product Supabase client requires PRODUCT_SUPABASE_URL and PRODUCT_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
}
