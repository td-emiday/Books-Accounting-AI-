// POST /api/tour/complete
// Marks the active workspace's onboarding tour as finished so the modal
// stops appearing on /app. Also accepts a `decision` flag — "subscribed"
// (user clicked Pay & start) or "later" (Skip) — for analytics.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ ok: false, reason: "no_workspace" }, { status: 404 });
  }

  await supabase
    .from("workspaces")
    .update({ tour_completed_at: new Date().toISOString() })
    .eq("id", membership.workspace_id);

  return NextResponse.json({ ok: true });
}
