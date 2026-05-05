// POST /api/integrations/telegram/start-pairing
//
// Generates an 8-char A-Z0-9 pairing code, stores it on
// channel_pairings with a 15-min TTL, and returns the deep-link URL
// the user can click to open the bot pre-loaded with `/start <code>`.

import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit 0/O/1/I

function generateCode(len = 8): string {
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) {
    out += ALPHA[bytes[i] % ALPHA.length];
  }
  return out;
}

export async function POST(req: Request) {
  void req;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
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

  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) {
    return NextResponse.json(
      { ok: false, reason: "bot_not_configured" },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await admin.from("channel_pairings").insert({
    code,
    workspace_id: membership.workspace_id,
    user_id: user.id,
    provider: "telegram",
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, reason: "db", message: error.message },
      { status: 500 },
    );
  }

  const url = `https://t.me/${username}?start=${code}`;

  // Render QR as data-URL so the UI can show it inline without an
  // extra round-trip. ~3 KB; cached in browser memory only.
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#15151a", light: "#ffffff" },
    });
  } catch {
    /* non-fatal — UI falls back to the deep-link button */
  }

  return NextResponse.json({
    ok: true,
    code,
    expires_at: expiresAt,
    url,
    qrDataUrl,
    botUsername: username,
  });
}
