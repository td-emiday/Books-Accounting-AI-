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
import { trialStateFor } from "@/lib/trial";

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

  // Trial gate. Runs here (proxy/middleware) so nested layouts under
  // /app/* can't slip past the check that previously only ran in
  // app/app/layout.tsx.
  //
  // We never lock the trial-expired page itself, the billing routes
  // (so users can pay through the lock screen), or the cancel/manage
  // flows. /onboarding stays open so a user mid-onboarding doesn't
  // get bounced before they can pick a plan.
  const isAppRoute = pathname.startsWith("/app");
  const isExempt =
    pathname === "/trial-expired" ||
    pathname.startsWith("/api/paystack") ||
    pathname.startsWith("/api/cron");
  if (isAppRoute && !isExempt) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select(
        "workspace:workspaces(plan_tier, subscription_status, trial_ends_at)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    type WsRow = {
      plan_tier: string | null;
      subscription_status: string | null;
      trial_ends_at: string | null;
    };
    const wsRaw = membership?.workspace as unknown;
    const ws: WsRow | null = Array.isArray(wsRaw)
      ? ((wsRaw[0] as WsRow) ?? null)
      : ((wsRaw as WsRow | null) ?? null);

    if (ws) {
      const trial = trialStateFor({
        subscriptionStatus: ws.subscription_status,
        trialEndsAt: ws.trial_ends_at,
        planTier: ws.plan_tier,
      });
      if (trial.status === "locked") {
        const url = request.nextUrl.clone();
        url.pathname = "/trial-expired";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and API health checks.
    "/((?!_next/static|_next/image|favicon.ico|api/health).*)",
  ],
};
