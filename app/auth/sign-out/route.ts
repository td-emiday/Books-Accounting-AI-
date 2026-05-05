// POST-only sign-out endpoint. Forms can target this directly
// without needing a server action wrapper for the pure logout case.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL(
      "/sign-in",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004"
    ),
    { status: 303 }
  );
}
