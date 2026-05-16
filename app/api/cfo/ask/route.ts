// POST /api/cfo/ask
// Body: { message: string }
// Auth: signed-in user; workspace resolved from membership.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askCFO, CfoError } from "@/lib/cfo";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  // Same 30/min cap the Telegram bot uses. Keyed by user.id so a
  // user signed in on multiple tabs / devices still shares a bucket.
  const rl = checkRateLimit({
    key: `cfo:user:${user.id}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limited",
        retryAfterMs: rl.retryAfterMs,
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body: { message?: unknown };
  try {
    body = (await req.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json({ ok: false, reason: "no_workspace" }, { status: 404 });
  }

  try {
    const ans = await askCFO(supabase, membership.workspace_id, message);
    return NextResponse.json({ ok: true, answer: ans.text, modelMs: ans.modelMs });
  } catch (e) {
    const code = e instanceof CfoError ? e.code : "unknown";
    const msg = e instanceof Error ? e.message : "unknown error";
    console.error("[cfo/ask] failed", { code, msg, workspace: membership.workspace_id });
    return NextResponse.json(
      { ok: false, reason: code, message: msg.slice(0, 240) },
      { status: 500 },
    );
  }
}
