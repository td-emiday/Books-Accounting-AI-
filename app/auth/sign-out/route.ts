// POST-only sign-out endpoint. Forms can target this directly
// without needing a server action wrapper for the pure logout case.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${getSiteOrigin()}/sign-in`, { status: 303 });
}
