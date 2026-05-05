// Smoke-test endpoint: confirms env vars are wired and the anon key
// can talk to the database. Reads the seeded `categories` table, which
// has `workspace_id IS NULL` rows that RLS lets the anon role see.
//
// On success: { ok: true, categories: <number> }
// On failure: { ok: false, error: "..." } with HTTP 500.

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        { ok: false, where: "query", error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, categories: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, where: "client", error: message },
      { status: 500 }
    );
  }
}
