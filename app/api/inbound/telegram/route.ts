// POST /api/inbound/telegram
//
// Telegram Bot API webhook. Verifies the secret token, then:
//   /start <pair_code>   → consume code, bind workspace ↔ chat_id
//   photo / document     → ingest receipt → OCR → create transaction
//   text                 → reply with help (CFO chat backend is TBD)
//
// Always returns 200 to Telegram so it doesn't retry — we surface
// errors to the user as a chat reply instead.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  downloadFile,
  getFile,
  sendMessage,
  type TgChatId,
} from "@/lib/telegram";
import { extractReceipt, OcrError } from "@/lib/ocr";
import { createTransaction } from "@/lib/transactions/create";
import { askCFO, CfoError } from "@/lib/cfo";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";
// Receipts can take ~3-8s through OCR; allow generous Vercel timeout.
export const maxDuration = 30;

type TgMessage = {
  message_id: number;
  from?: { id: number; username?: string; first_name?: string; last_name?: string };
  chat: { id: number; type: string };
  date: number;
  text?: string;
  caption?: string;
  photo?: { file_id: string; file_size?: number; width?: number; height?: number }[];
  document?: { file_id: string; mime_type?: string; file_name?: string };
};

type TgUpdate = {
  update_id: number;
  message?: TgMessage;
};

function siteUrl(): string {
  return getSiteOrigin();
}

export async function POST(req: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || got !== expected) {
    // Don't 401 — that triggers Telegram retries. Return 200 silent.
    return NextResponse.json({ ok: true });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const text = (msg.text ?? "").trim();

  // /start <pair_code> arrives via deep-link (https://t.me/<bot>?start=CODE).
  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1]?.trim();
    if (code) {
      await handlePair(chatId, code, msg);
      return NextResponse.json({ ok: true });
    }
    await sendMessage({
      chat_id: chatId,
      text:
        "👋 Welcome to Emiday.\n\n" +
        "To connect, send me your 8-character pairing code. Get one at " +
        `${siteUrl()}/app/settings → Integrations → Connect Telegram.`,
    });
    return NextResponse.json({ ok: true });
  }

  // Forgiving pairing: if the chat isn't paired yet but the message
  // looks like our pair-code shape (8 chars, A-Z2-9), try to consume it
  // as a code. This is what saves users who tapped the deep-link but
  // didn't tap "Start" (Telegram doesn't auto-send /start <code> for
  // first-time bot interactions on some clients).
  const channel = await lookupChannel(chatId);
  if (!channel) {
    if (looksLikePairCode(text)) {
      await handlePair(chatId, text, msg);
      return NextResponse.json({ ok: true });
    }
    await sendMessage({
      chat_id: chatId,
      text:
        "This chat isn't connected to a workspace yet.\n\n" +
        "Send me your 8-character pairing code, or grab a fresh one at\n" +
        `${siteUrl()}/app/settings → Integrations.`,
    });
    return NextResponse.json({ ok: true });
  }

  if (msg.photo?.length || (msg.document && isImageDoc(msg.document.mime_type))) {
    await handleReceipt(channel, msg).catch(async (e) => {
      // Log the full error to Vercel runtime logs so we can debug,
      // but tailor the user-facing message to the failure mode.
      console.error("[telegram] receipt failed", {
        chatId,
        workspace: channel.workspace_id,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });

      const text = receiptErrorReply(e);
      await sendMessage({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "/help" || text === "/start") {
    await replyHelp(chatId);
    return NextResponse.json({ ok: true });
  }

  // Plain text → ask the CFO. We acknowledge with a typing action so
  // the user knows we got it; the OpenAI call usually returns within
  // 2-5s. Errors are mapped to user-friendly copy server-side.
  if (text.length > 0) {
    await handleCfoQuestion(channel, msg, text).catch(async (e) => {
      console.error("[telegram] cfo failed", {
        chatId,
        workspace: channel.workspace_id,
        error: e instanceof Error ? e.message : String(e),
      });
      const reply = cfoErrorReply(e);
      await sendMessage({ chat_id: chatId, text: reply });
    });
    return NextResponse.json({ ok: true });
  }

  // Empty / non-text message — fall through silently.
  return NextResponse.json({ ok: true });
}

async function handleCfoQuestion(
  channel: Channel,
  msg: TgMessage,
  text: string,
) {
  const chatId = msg.chat.id;
  // Best-effort typing indicator; ignore errors since it's UX sugar.
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendChatAction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      },
    );
  } catch {
    /* ignore */
  }

  const admin = createAdminClient();
  const ans = await askCFO(admin, channel.workspace_id, text);
  await sendMessage({
    chat_id: chatId,
    text: ans.text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

function cfoErrorReply(e: unknown): string {
  if (e instanceof CfoError) {
    switch (e.code) {
      case "missing_key":
        return "Ask-the-CFO isn't switched on in this environment yet. The team has been notified.";
      case "openai_429":
        return "I'm rate-limited right now. Try again in 30 seconds.";
      case "openai_401":
      case "openai_403":
        return "Ask-the-CFO authentication is broken. Ping the team.";
      case "no_workspace":
        return "I couldn't find your workspace. Try logging in at " + getSiteOrigin();
    }
  }
  return "Sorry, something went wrong while reading your books. Try again in a moment.";
}

// ──────────────────────── pairing ────────────────────────────────────

async function handlePair(chatId: TgChatId, code: string, msg: TgMessage) {
  const admin = createAdminClient();
  const upper = code.toUpperCase();

  // Atomic claim: only succeed when used_at is null and not expired.
  const { data: pairing, error } = await admin
    .from("channel_pairings")
    .update({ used_at: new Date().toISOString() })
    .eq("code", upper)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("workspace_id, user_id, provider")
    .maybeSingle();

  if (error || !pairing) {
    await sendMessage({
      chat_id: chatId,
      text:
        "That pairing code is invalid or expired. " +
        `Generate a fresh one at ${siteUrl()}/app/settings.`,
    });
    return;
  }

  // Bind chat ↔ workspace. If this telegram chat was previously bound
  // (e.g. user re-pairs), upsert by (provider, external_id).
  const username = msg.from?.username ?? null;
  const displayName = [msg.from?.first_name, msg.from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || null;

  await admin.from("workspace_channels").upsert(
    {
      workspace_id: pairing.workspace_id,
      user_id: pairing.user_id,
      provider: "telegram",
      external_id: String(chatId),
      username,
      display_name: displayName,
    },
    { onConflict: "provider,external_id" },
  );

  // Look up workspace name for a friendlier reply.
  const { data: ws } = await admin
    .from("workspaces")
    .select("name")
    .eq("id", pairing.workspace_id)
    .maybeSingle();

  const wsName = ws?.name ?? "your workspace";
  const firstName = msg.from?.first_name?.trim();
  const greeting = firstName ? `Hi ${firstName}, ` : "";
  await sendMessage({
    chat_id: chatId,
    text:
      `✅ ${greeting}your Emiday account is connected to *${wsName}*.\n\n` +
      "*Here's what I can do for you:*\n\n" +
      "📸 *Snap a receipt* — send me a photo and I'll OCR it, categorise " +
      "it, and add a draft transaction to your books.\n\n" +
      "💬 *Ask me anything about your books* — \"what's my revenue this " +
      "month?\", \"how much did I spend on rent?\", \"am I profitable?\". " +
      "I read your books and answer in plain English.\n\n" +
      "💵 *Track spending in real time* — every receipt you forward " +
      "shows up instantly at " + siteUrl() + "/app/transactions.\n\n" +
      "🧾 *Coming soon*\n" +
      "  • Forward bank statement PDFs to import in bulk\n" +
      "  • Daily summaries + filing reminders\n\n" +
      "Try it now — send a receipt photo, or just ask me a question. /help any time.",
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

// ─────────────────────── receipts ────────────────────────────────────

type Channel = { workspace_id: string; user_id: string };

async function lookupChannel(chatId: TgChatId): Promise<Channel | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_channels")
    .select("workspace_id, user_id")
    .eq("provider", "telegram")
    .eq("external_id", String(chatId))
    .maybeSingle();
  return data ?? null;
}

// Map OCR / pipeline errors to user-friendly chat replies. We name the
// real cause when it's actionable (format, config), but keep generic
// "try again" copy for transient/unknown errors.
function receiptErrorReply(e: unknown): string {
  const home = siteUrl();
  if (e instanceof OcrError) {
    switch (e.code) {
      case "missing_key":
        return (
          "Receipt scanning isn't switched on in this environment yet — " +
          "the team has been notified. Try again in a few minutes."
        );
      case "unsupported_format":
        return (
          "I can't read that file type. Send it as a regular *photo* " +
          "(JPEG/PNG) — not a HEIC or PDF document.\n\n" +
          "On iPhone: tap the camera icon, take/pick a photo, then send. " +
          "Avoid the paperclip → File option."
        );
      case "openai_401":
      case "openai_403":
        return (
          "Receipt scanning isn't authorised in this environment. " +
          "Ping the team — the OpenAI key needs a refresh."
        );
      case "openai_429":
        return "I'm rate-limited right now. Try the same receipt again in 30s.";
      case "openai_400":
        return (
          "OpenAI rejected the image. Try a clearer photo (good lighting, " +
          "receipt flat on a contrasting surface)."
        );
      case "bad_json":
        return "I couldn't parse the receipt. Try a clearer photo.";
      case "network":
        return "I couldn't reach my OCR service. Try again in a moment.";
    }
  }
  const detail = e instanceof Error ? e.message : "unknown error";
  return (
    "Sorry, I couldn't read that receipt. Try again or upload it at\n" +
    `${home}/app/transactions.\n\n_${detail.slice(0, 200)}_`
  );
}

// Pair codes are 8 chars from the unambiguous A-Z23456789 alphabet
// (omits 0/O, 1/I). Match that exact shape so a one-word receipt
// description like "Shoprite" doesn't get mistakenly consumed.
function looksLikePairCode(text: string): boolean {
  const s = text.toUpperCase();
  return /^[A-HJ-NP-Z2-9]{8}$/.test(s);
}

function isImageDoc(mime?: string | null): boolean {
  if (!mime) return false;
  return (
    mime.startsWith("image/") ||
    mime === "application/pdf"
  );
}

async function handleReceipt(channel: Channel, msg: TgMessage) {
  const chatId = msg.chat.id;
  // Acknowledge so the user knows we got it (OCR can take a few seconds).
  await sendMessage({ chat_id: chatId, text: "📎 Got it — reading the receipt…" });

  // Pick the largest photo size, or the document.
  const fileId =
    msg.photo?.[msg.photo.length - 1]?.file_id ?? msg.document?.file_id;
  if (!fileId) throw new Error("no file_id on message");

  const file = await getFile(fileId);
  if (!file.file_path) throw new Error("Telegram returned no file_path");
  const { buffer, contentType } = await downloadFile(file.file_path);

  // Upload to Supabase Storage under <workspace>/<id>.<ext>
  const admin = createAdminClient();
  const ext = pickExt(contentType, file.file_path);
  const objectPath = `${channel.workspace_id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("receipts")
    .upload(objectPath, buffer, { contentType, upsert: false });
  if (upErr) throw new Error(`storage: ${upErr.message}`);

  // OCR (PDF skips for v1 — gpt-4o-mini doesn't accept PDF directly).
  if (contentType === "application/pdf") {
    await sendMessage({
      chat_id: chatId,
      text:
        "PDF receipts aren't auto-parsed yet — I've stashed it under " +
        "Documents. Photos work today!",
    });
    return;
  }

  const extract = await extractReceipt(buffer, contentType);

  if (!extract.amount) {
    await sendMessage({
      chat_id: chatId,
      text:
        "I couldn't find a total on that receipt. Send a clearer photo, " +
        `or add it manually at ${siteUrl()}/app/transactions.`,
    });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const txn = await createTransaction(admin, {
    workspaceId: channel.workspace_id,
    type: extract.type,
    amount: extract.amount,
    currency: extract.currency,
    date: extract.date ?? today,
    description: extract.description || extract.vendor || "Receipt",
    vendorClient: extract.vendor,
    source: "TELEGRAM",
    receiptUrl: objectPath,
    notes: extract.line_items
      ? extract.line_items
          .slice(0, 10)
          .map((l) => `• ${l.name}${l.amount ? ` — ${l.amount}` : ""}`)
          .join("\n")
      : null,
    categoryConfirmed: false,
  });

  const fmt = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: extract.currency,
    maximumFractionDigits: 0,
  });

  await sendMessage({
    chat_id: chatId,
    text:
      `✅ Logged *${fmt.format(extract.amount)}* — ${extract.vendor ?? "receipt"} ` +
      `(${extract.date ?? "today"}).\n\n` +
      `View → ${siteUrl()}/app/transactions`,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });

  void txn; // unused but kept explicit
}

function pickExt(contentType: string, filePath: string): string {
  const fromMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "application/pdf": "pdf",
  };
  if (fromMime[contentType]) return fromMime[contentType];
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot + 1) : "bin";
}

async function replyHelp(chatId: TgChatId) {
  await sendMessage({
    chat_id: chatId,
    text:
      "📒 *Emiday bot*\n\n" +
      "Send me:\n" +
      "• A *receipt photo* — I'll OCR it and log a draft transaction.\n" +
      "• Any *question about your books* — \"how much did I spend on " +
      "rent this month?\", \"what's my biggest expense?\", \"am I " +
      "profitable?\"\n\n" +
      "Coming soon: bank statement PDFs, daily summaries, filing reminders.",
    parse_mode: "Markdown",
  });
}
