// Service-role Supabase client for the AGENTS project (jjcslovajuxsqykrdacv).
// This is a different project from the main product DB. Used by the /admin/content
// dashboard to read and update content_drafts, content_archive, and content_rules.
//
// Auth is handled by the main emiday-next Supabase (createClient from ./server) —
// only after we've confirmed the user is td@emiday.io do we instantiate this client.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAgentsAdminClient() {
  const url = process.env.AGENTS_SUPABASE_URL;
  const key = process.env.AGENTS_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Agents Supabase client requires AGENTS_SUPABASE_URL and AGENTS_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "agents" },
  });
}
