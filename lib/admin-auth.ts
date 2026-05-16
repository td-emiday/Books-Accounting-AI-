// Shared admin allowlist check. Reads from agents.admin_users so we can
// add/remove admins from the UI without a deploy.
import { createClient } from "@/lib/supabase/server";
import { createAgentsAdminClient } from "@/lib/supabase/agents";

// Fallback when DB is unreachable. Prevents lockout if the agents project goes down.
const HARDCODED_FALLBACK = new Set(["td@emiday.io"]);

export async function requireAdminUser(): Promise<{ email: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not signed in");

  // Try DB first
  try {
    const agents = createAgentsAdminClient();
    const { data, error } = await agents
      .from("admin_users")
      .select("email")
      .eq("email", user.email)
      .eq("active", true)
      .maybeSingle();
    if (!error && data) return { email: user.email };
  } catch {
    // fall through
  }

  if (HARDCODED_FALLBACK.has(user.email)) return { email: user.email };
  throw new Error("Unauthorised");
}

/** Boolean version for layouts/middleware that don't want to throw. */
export async function isAdminUser(): Promise<{ email: string } | null> {
  try {
    return await requireAdminUser();
  } catch {
    return null;
  }
}
