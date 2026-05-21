// One-shot password recovery link generator for support/admin work.
// Uses Supabase Auth's admin generateLink — returns a URL that the
// user can click to set a new password. Link is single-use and
// expires within ~1 hour by default.
//
//   npx tsx scripts/admin-recovery-link.ts <email>
//
// Reads env from .env.local (SUPABASE_SERVICE_ROLE_KEY + URL).

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("usage: npx tsx scripts/admin-recovery-link.ts <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supa = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await supa.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: "https://www.emiday.io/auth/callback?next=/app",
    },
  });
  if (error) {
    console.error("generateLink failed:", error.message);
    process.exit(1);
  }
  console.log("\nRecovery link for", email, ":\n");
  console.log(data.properties?.action_link ?? "(no link returned)");
  console.log("\nClick it within ~1 hour. After resetting, you land on /app.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
