"use client";

import { useState } from "react";

export function PairingResultCard({
  code,
  url,
}: {
  code: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — non-fatal */
    }
  }

  return (
    <div className="adm-pair">
      <div className="adm-pair-kicker">New Telegram pair code</div>
      <code className="adm-pair-code">{code}</code>
      <span className="adm-pair-actions">
        <button
          type="button"
          onClick={() => copy(code)}
          className="adm-btn"
          style={{ width: "auto" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="adm-btn primary"
          style={{ width: "auto", textDecoration: "none" }}
        >
          Open in Telegram →
        </a>
      </span>
      <p>
        Expires in 15 minutes. The user can send this code to{" "}
        <code>@EmidayBot</code> from any chat to pair their account.
      </p>
    </div>
  );
}
