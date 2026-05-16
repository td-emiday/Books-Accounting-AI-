"use client";

import { useState, useTransition } from "react";
import { markPostedManually } from "../actions";

interface Props {
  draftId: string;
  channel: string;
  copy: string;
  threadParts: Array<{ order: number; text: string }> | null;
  hashtags: string[] | null;
  visualUrl: string | null;
}

export function ManualPostPanel({ draftId, channel, copy, threadParts, hashtags, visualUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [postUrl, setPostUrl] = useState("");

  const fullText = buildFullText(copy, threadParts, hashtags);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function onMarkPosted() {
    startTransition(async () => {
      await markPostedManually(draftId, { platformPostUrl: postUrl.trim() || undefined });
    });
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-800">
          Manual post · {channel}
        </span>
        <p className="text-sm text-neutral-600">Copy the text below, post it on {channel}, then mark it posted.</p>
      </div>

      <pre className="mb-3 max-h-72 overflow-auto rounded-lg bg-neutral-50 p-3 font-mono text-sm whitespace-pre-wrap">
        {fullText}
      </pre>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {copied ? "Copied" : "Copy text"}
        </button>
        {visualUrl && (
          <a
            href={visualUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-50"
          >
            Download image
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Post URL (optional)
          </label>
          <input
            type="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder={channel === "x" ? "https://twitter.com/..." : "https://www.linkedin.com/..."}
            className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onMarkPosted}
          disabled={pending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Mark as posted"}
        </button>
      </div>
    </div>
  );
}

function buildFullText(
  copy: string,
  threadParts: Array<{ order: number; text: string }> | null,
  hashtags: string[] | null,
): string {
  const tags = (hashtags ?? []).join(" ");
  if (threadParts && threadParts.length > 0) {
    const sorted = [...threadParts].sort((a, b) => a.order - b.order);
    const lines = [copy, ...sorted.map((p) => `\n---\n${p.text}`)];
    return tags ? `${lines.join("\n")}\n\n${tags}` : lines.join("\n");
  }
  return tags ? `${copy}\n\n${tags}` : copy;
}
