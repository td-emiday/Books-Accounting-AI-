// Session-refresh helper used from proxy.ts (Next 16 root file convention).
//
// Supabase auth tokens live in cookies. They expire on a short TTL and
// must be refreshed on the server before any subsequent request can
// trust them. Calling supabase.auth.getUser() inside this helper does
// exactly that — and forwards updated cookies on the response.
//
// IMPORTANT: per Supabase docs, do NOT call supabase.auth.getSession()
// here — getSession() reads from local storage and trusts the client.
// getUser() validates the JWT against Supabase Auth and is the only
// reliable signal of authentication on the server.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refresh the session if it's expired and validate it. The result
  // is intentionally not used here — the call's side effect (refreshed
  // cookies on supabaseResponse) is what matters. Auth gating happens
  // in proxy.ts using its own getUser() call.
  await supabase.auth.getUser();

  return supabaseResponse;
}
