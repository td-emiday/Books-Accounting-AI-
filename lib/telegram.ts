// Thin Telegram Bot API client — server-side only.
// We only use a small surface: send messages, fetch a file path,
// download a file. Webhooks are processed in app/api/inbound/telegram.

const BASE = "https://api.telegram.org";

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return t;
}

async function call<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!res.ok || !json.ok) {
    throw new Error(`Telegram ${method} failed: ${json.description ?? res.statusText}`);
  }
  return json.result;
}

export type TgChatId = number | string;

export function sendMessage(p: {
  chat_id: TgChatId;
  text: string;
  parse_mode?: "Markdown" | "HTML";
  disable_web_page_preview?: boolean;
}): Promise<unknown> {
  return call("sendMessage", p);
}

export type TgFile = { file_id: string; file_path?: string; file_size?: number };

export function getFile(file_id: string): Promise<TgFile> {
  return call<TgFile>("getFile", { file_id });
}

/** Download a file's bytes given the path returned by getFile. */
export async function downloadFile(file_path: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const res = await fetch(`${BASE}/file/bot${token()}/${file_path}`);
  if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return {
    buffer: Buffer.from(ab),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

/** Set the webhook URL + secret. Run via scripts/telegram-set-webhook.ts. */
export function setWebhook(p: {
  url: string;
  secret_token: string;
  allowed_updates?: string[];
}): Promise<boolean> {
  return call<boolean>("setWebhook", {
    url: p.url,
    secret_token: p.secret_token,
    allowed_updates: p.allowed_updates ?? ["message"],
    drop_pending_updates: true,
  });
}
