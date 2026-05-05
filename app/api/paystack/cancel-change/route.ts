// POST /api/paystack/cancel-change
// Clears a workspace's pending_plan_change. Local-only — no Paystack call.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.redirect(new URL("/onboarding", req.url), 303);
  }

  await supabase
    .from("workspaces")
    .update({ pending_plan_change: null })
    .eq("id", membership.workspace_id);

  return NextResponse.redirect(
    new URL("/app/settings?tab=billing&billing=change_cancelled", req.url),
    303,
  );
}
