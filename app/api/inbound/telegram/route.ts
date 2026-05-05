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
import { extractReceipt } from "@/lib/ocr";
import { createTransaction } from "@/lib/transactions/create";
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
        "👋 Welcome to Emiday. To connect this chat to your workspace, " +
        "open the app → Settings → Integrations → Connect Telegram.",
    });
    return NextResponse.json({ ok: true });
  }

  // For everything else, we need a paired chat.
  const channel = await lookupChannel(chatId);
  if (!channel) {
    await sendMessage({
      chat_id: chatId,
      text:
        "This chat isn't connected to a workspace yet.\n\n" +
        `Open ${siteUrl()}/app/settings → Integrations to pair.`,
    });
    return NextResponse.json({ ok: true });
  }

  if (msg.photo?.length || (msg.document && isImageDoc(msg.document.mime_type))) {
    await handleReceipt(channel, msg).catch(async (e) => {
      await sendMessage({
        chat_id: chatId,
        text:
          "Sorry, I couldn't read that receipt. Try again or upload it via " +
          `${siteUrl()}/app/transactions.\n\n_${(e as Error).message}_`,
        parse_mode: "Markdown",
      });
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "/help" || text === "/start") {
    await replyHelp(chatId);
    return NextResponse.json({ ok: true });
  }

  // Plain text — CFO chat backend is out of scope. Surface help.
  await sendMessage({
    chat_id: chatId,
    text:
      "Send me a receipt photo and I'll log it for you.\n\n" +
      "Other commands: /help",
  });
  return NextResponse.json({ ok: true });
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

  await sendMessage({
    chat_id: chatId,
    text:
      `✅ Connected to *${ws?.name ?? "your workspace"}*.\n\n` +
      "Send me a receipt photo and I'll log it for you. /help for commands.",
    parse_mode: "Markdown",
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
      "• A *receipt photo* — I'll OCR it and log a draft transaction.\n\n" +
      "Coming soon: bank statement PDFs, ask-your-CFO questions, filing reminders.",
    parse_mode: "Markdown",
  });
}
