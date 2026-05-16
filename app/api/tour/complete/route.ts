// POST /api/tour/complete
//
// Marks the workspace's tour as finished so the modal stops appearing
// on /app. Uses the user-authed client to resolve the workspace, then
// the service-role client to write — bypassing any RLS surprise on
// `workspaces.tour_completed_at` and guaranteeing the field actually
// gets set. Also busts the /app RSC cache so the next visit reads
// fresh state instead of a stale render.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 },
    );
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json(
      { ok: false, reason: "no_workspace" },
      { status: 404 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ tour_completed_at: new Date().toISOString() })
    .eq("id", membership.workspace_id);

  if (error) {
    console.error("[tour/complete] update failed", {
      workspace: membership.workspace_id,
      error: error.message,
    });
    return NextResponse.json(
      { ok: false, reason: "db_error" },
      { status: 500 },
    );
  }

  // Bust the RSC cache for /app so the dashboard reads the fresh
  // tour_completed_at on the next visit, not stale null.
  revalidatePath("/app", "layout");

  return NextResponse.json({ ok: true });
}
