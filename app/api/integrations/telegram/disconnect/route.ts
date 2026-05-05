// POST /api/integrations/telegram/disconnect
// Removes the calling user's Telegram channel binding.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004"),
      303,
    );
  }

  const admin = createAdminClient();
  await admin
    .from("workspace_channels")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "telegram");

  return NextResponse.redirect(
    new URL(
      "/app/settings?tab=integrations&channel=disconnected",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004",
    ),
    303,
  );
}
