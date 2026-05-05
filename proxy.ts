// Next 16 proxy (formerly middleware). Runs before every matched route.
//
// Two jobs:
//   1. Refresh the Supabase auth cookies (so SSR + Server Actions see
//      a fresh session).
//   2. Gate /app/* routes — if no authenticated user, bounce to /sign-in
//      with a redirect-back parameter.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/app") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/reports");
  if (!isProtected) return response;

  // Re-read the user inside the proxy. updateSession refreshed the
  // cookies, but we need a separate validated read to gate the route.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only at this point; updateSession already wrote.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and API health checks.
    "/((?!_next/static|_next/image|favicon.ico|api/health).*)",
  ],
};
