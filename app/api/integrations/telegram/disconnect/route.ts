// POST /api/integrations/telegram/disconnect
// Removes the calling user's Telegram channel binding.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";

export async function POST() {
  const home = getSiteOrigin();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${home}/sign-in`, 303);
  }

  const admin = createAdminClient();
  await admin
    .from("workspace_channels")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "telegram");

  return NextResponse.redirect(
    `${home}/app/settings?tab=integrations&channel=disconnected`,
    303,
  );
}
