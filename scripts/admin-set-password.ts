// Set a password on an account directly via the Supabase Auth admin
// API. Intended ONLY for support / break-glass — the user should
// change it from Settings → Security as soon as they're back in.
//
//   npx tsx scripts/admin-set-password.ts <email>            # generates a strong temp password
//   npx tsx scripts/admin-set-password.ts <email> <password>  # sets a chosen password

import { config as loadEnv } from "dotenv";
import path from "node:path";
import crypto from "node:crypto";
loadEnv({ path: path.join(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const chosen = process.argv[3];

if (!email) {
  console.error("usage: npx tsx scripts/admin-set-password.ts <email> [password]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Strong, memorable temp password if none given: 4 words + 2 digits.
const ALPHA =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function strongTemp(): string {
  const bytes = crypto.randomBytes(20);
  let out = "";
  for (let i = 0; i < 20; i++) out += ALPHA[bytes[i] % ALPHA.length];
  return out;
}

const password = chosen ?? strongTemp();

const supa = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Find the user by email
  const { data: users, error: listErr } = await supa.auth.admin.listUsers();
  if (listErr) {
    console.error("listUsers failed:", listErr.message);
    process.exit(1);
  }
  const user = users.users.find((u) => u.email === email);
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const { error: updErr } = await supa.auth.admin.updateUserById(user.id, {
    password,
  });
  if (updErr) {
    console.error("updateUserById failed:", updErr.message);
    process.exit(1);
  }

  console.log("\n✔ Password updated for", email);
  console.log("  Temp password:", password);
  console.log("\nSign in at https://www.emiday.io/sign-in");
  console.log(
    "Then immediately change it from Settings → Security (or send yourself a real recovery link once Site URL is fixed).\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
