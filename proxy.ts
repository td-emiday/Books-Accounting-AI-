// Next 16 proxy (formerly middleware). Runs before every matched route.
//
// Three jobs:
//   1. Subdomain routing: ops.emiday.io serves the /admin/* shell as if it
//      were the root, so visitors see clean URLs (ops.emiday.io/customers
//      instead of ops.emiday.io/admin/customers).
//   2. Refresh the Supabase auth cookies (so SSR + Server Actions see
//      a fresh session).
//   3. Gate /app/* routes — if no authenticated user, bounce to /sign-in
//      with a redirect-back parameter. Plus trial-expired gate.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { trialStateFor } from "@/lib/trial";

// Hosts that should mount /admin at the root.
const ADMIN_HOSTS = new Set(["ops.emiday.io", "ops.emiday.local"]);

// Paths that DON'T get rewritten on the ops subdomain — auth flow, Next
// internals, API routes, and the /admin tree itself (so direct visits to
// ops.emiday.io/admin/content still work).
const OPS_PASS_THROUGH = [
  "/admin",
  "/sign-in",
  "/sign-up",
  "/auth",
  "/api",
  "/_next",
  "/favicon",
];

function isOpsHost(host: string): boolean {
  return ADMIN_HOSTS.has(host.split(":")[0].toLowerCase());
}

/** Copy session cookies set by updateSession onto a new response. */
function carryCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export async function proxy(request: NextRequest) {
  // 1. Refresh auth cookies on every request. Side effect: request.cookies is
  // mutated with refreshed values, so downstream rewrites inherit them.
  const response = await updateSession(request);

  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // 2. ops.emiday.io subdomain routing — mount /admin/* at the root.
  if (isOpsHost(host)) {
    const isPass = OPS_PASS_THROUGH.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!isPass) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      url.search = search;
      return carryCookies(response, NextResponse.rewrite(url));
    }
    // Pass-through paths on ops still need auth refresh, which already happened.
    return response;
  }

  // 3. Main domain (emiday.io) — existing protected-route gating.
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
    },
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
