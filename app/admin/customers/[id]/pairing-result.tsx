"use client";

// Tiny client component to render the freshly-generated Telegram
// pairing code with a copy button. Lives in its own file so the
// page can stay an RSC.

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
    <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        New Telegram pairing code
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="rounded bg-white px-3 py-1.5 font-mono text-lg font-bold tracking-[0.15em] text-neutral-900 ring-1 ring-indigo-200">
          {code}
        </code>
        <button
          type="button"
          onClick={() => copy(code)}
          className="rounded border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
        >
          {copied ? "Copied" : "Copy code"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800"
        >
          Open in Telegram →
        </a>
      </div>
      <p className="mt-2 text-xs text-indigo-900/80">
        Expires in 15 minutes. The user can send this 8-character code to{" "}
        <code>@EmidayBot</code> from any chat to pair their account.
      </p>
    </div>
  );
}
