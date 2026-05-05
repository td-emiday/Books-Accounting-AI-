"use client";

// Telegram pairing UI for Settings → Integrations.
// On click → POST /api/integrations/telegram/start-pairing → renders
// the deep-link button + the bare 8-char code (so a user on a
// different device can copy/paste).

import { useState } from "react";
import { Icon } from "./icon";

type ChannelBinding = {
  provider: "telegram" | "whatsapp";
  externalId: string;
  username: string | null;
  displayName: string | null;
};

type StartResp = {
  ok: boolean;
  code?: string;
  url?: string;
  qrDataUrl?: string | null;
  botUsername?: string;
  expires_at?: string;
  reason?: string;
};

export function TelegramConnect({
  channels,
}: {
  channels: ChannelBinding[];
}) {
  const existing = channels.find((c) => c.provider === "telegram");
  const [pending, setPending] = useState<StartResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/integrations/telegram/start-pairing", {
        method: "POST",
      });
      const json = (await res.json()) as StartResp;
      if (!json.ok) {
        setErr(reasonToCopy(json.reason));
        return;
      }
      setPending(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (existing) {
    return (
      <div className="integration-card">
        <div className="integration-head">
          <div className="integration-icon" aria-hidden>
            <TgGlyph />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="integration-title">Telegram</div>
            <div className="integration-meta">
              Connected
              {existing.username
                ? ` as @${existing.username}`
                : existing.displayName
                  ? ` as ${existing.displayName}`
                  : ""}
              .
            </div>
          </div>
          <form method="POST" action="/api/integrations/telegram/disconnect">
            <button type="submit" className="btn">Disconnect</button>
          </form>
        </div>
        <p className="integration-help">
          Send a receipt photo to the bot — I&apos;ll OCR it and log a draft
          transaction. Open Telegram and message your bot, or use a fresh
          pairing code if you switched accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="integration-card">
      <div className="integration-head">
        <div className="integration-icon" aria-hidden>
          <TgGlyph />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="integration-title">Telegram</div>
          <div className="integration-meta">
            Forward receipts to the bot. Drafts land in /app/transactions.
          </div>
        </div>
        {!pending && (
          <button
            type="button"
            className="btn primary"
            onClick={start}
            disabled={busy}
          >
            {busy ? "Generating…" : "Connect"}
          </button>
        )}
      </div>

      {err && <div className="auth-error" style={{ marginTop: 12 }}>{err}</div>}

      {pending?.url && pending.code && (
        <div className="pair-block">
          <div className="pair-grid">
            <div className="pair-grid-main">
              <ol className="pair-steps">
                <li>
                  <strong>On this device:</strong> tap{" "}
                  <em>Open Telegram</em> below, then tap <em>Start</em> in the
                  bot chat.
                </li>
                <li>
                  <strong>On your phone:</strong> scan the QR code with your
                  camera or Telegram&apos;s built-in QR scanner.
                </li>
                <li>
                  <strong>If neither works:</strong> open{" "}
                  {pending.botUsername ? (
                    <code>@{pending.botUsername}</code>
                  ) : (
                    "the bot"
                  )}{" "}
                  manually and send your code:
                </li>
              </ol>
              <div className="pair-code-row">
                <code className="pair-code-big" aria-label="Pairing code">
                  {pending.code}
                </code>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (pending.code) navigator.clipboard?.writeText(pending.code);
                  }}
                >
                  Copy
                </button>
              </div>
              <div className="pair-actions">
                <a
                  className="btn primary"
                  href={pending.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Telegram <Icon name="arrowUp" size={11} />
                </a>
              </div>
              <p className="pair-foot muted">Expires in 15 minutes.</p>
            </div>
            {pending.qrDataUrl && (
              <div className="pair-qr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.qrDataUrl}
                  alt="Scan to open Emiday bot in Telegram"
                  width={180}
                  height={180}
                />
                <span>Scan to pair</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function reasonToCopy(reason?: string): string {
  switch (reason) {
    case "bot_not_configured":
      return "Telegram bot isn't configured yet — ask Emiday support.";
    case "no_workspace":
      return "Your workspace isn't ready yet. Finish onboarding first.";
    case "unauthenticated":
      return "Please sign in again.";
    default:
      return "Couldn't generate a pairing code. Try again.";
  }
}

function TgGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.5 15.5 9.3 19c.4 0 .6-.2.8-.4l2-1.9 4.1 3c.7.4 1.3.2 1.5-.7l2.7-12.6c.3-1.1-.4-1.6-1.1-1.3L3.7 10.3c-1.1.4-1.1 1.1-.2 1.4l4.1 1.3 9.5-6c.4-.3.8-.1.5.2L9.5 15.5z" />
    </svg>
  );
}
