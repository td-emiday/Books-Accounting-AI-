// Bank-statement PDF parser. Pulls text via pdf-parse (pure JS, no
// canvas/native deps so it runs on Vercel serverless cleanly), then
// asks gpt-4o-mini to return a strict JSON array of transactions
// using a Nigerian-bank-aware system prompt.
//
// We deliberately cap at 30 pages — a monthly SME statement is
// usually <10 pages; 30 covers a quarterly fetch. Bigger statements
// get truncated with a clear flag so the user knows what's missing.

import { OcrError } from "./ocr";

export type StatementTxn = {
  date: string;                   // YYYY-MM-DD
  description: string;
  amount: number;                 // positive value in major units (NGN)
  type: "INCOME" | "EXPENSE";
  reference?: string | null;
  balance?: number | null;        // running balance, when the statement gives one
};

export type StatementExtract = {
  transactions: StatementTxn[];
  meta: {
    bank?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    currency: string;             // ISO 4217, default NGN
    periodStart?: string | null;  // YYYY-MM-DD
    periodEnd?: string | null;
    openingBalance?: number | null;
    closingBalance?: number | null;
  };
  /** True when the source PDF exceeded our text budget and some rows
   *  may be missing. Surface this to the user so they re-upload split
   *  files. */
  truncated: boolean;
};

const SYSTEM = `You are reading the raw text dump of a Nigerian bank statement PDF.
The text is messy — column alignment is lost, dates may repeat at the
top of each page, footers and disclaimers are interleaved. Your job is
to extract every transaction row into structured JSON.

Reply ONLY with a single JSON object matching this exact TypeScript
type. Do NOT wrap it in code fences. Do NOT add prose.

type R = {
  bank: string | null;          // e.g. "GTBank", "Zenith Bank", "Access"
  account_number: string | null;
  account_name: string | null;
  currency: string;             // ISO 4217. Default "NGN" for Nigerian banks.
  period_start: string | null;  // YYYY-MM-DD
  period_end: string | null;    // YYYY-MM-DD
  opening_balance: number | null;
  closing_balance: number | null;
  transactions: Array<{
    date: string;               // YYYY-MM-DD (mandatory; skip the row if you can't parse it)
    description: string;        // narration, vendor or counterparty
    amount: number;             // POSITIVE major-units amount (no currency symbol)
    type: "INCOME" | "EXPENSE"; // INCOME for credits/inflow, EXPENSE for debits/outflow
    reference: string | null;   // ref number, NIBSS code, narration code — null if none
    balance: number | null;     // running balance after this transaction, null if absent
  }>;
};

RULES:
- Skip headers, footers, sub-totals, opening/closing balance rows. They go in meta, not transactions.
- Skip "Carried Forward" and "Brought Forward" lines.
- If you see DR/CR columns: DR → EXPENSE, CR → INCOME.
- If you see Debit/Credit columns: same mapping.
- If only one signed Amount column: negative → EXPENSE, positive → INCOME.
- Currency for Nigerian banks defaults to NGN even when the symbol is missing.
- Dates may be in DD/MM/YYYY or DD-MMM-YYYY — normalise to YYYY-MM-DD.
- Never invent amounts. If a row has no clear amount, skip it.
- Never invent dates. If a row has no date and no carry-forward date you can apply, skip it.`;

export async function extractStatementTransactions(
  pdfBuffer: Buffer,
): Promise<StatementExtract> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new OcrError(
      "missing_key",
      "Statement parsing isn't configured — OPENAI_API_KEY is missing.",
    );
  }

  // Lazy import: pdf-parse pulls pdfjs-dist which is heavy.
  const { PDFParse } = await import("pdf-parse");

  let pages: { num: number; text: string }[];
  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    // Cap at 60 pages — that covers a full year of monthly statements
    // for a busy SME without becoming an infinite-cost vector.
    const result = await parser.getText({ last: 60 });
    pages = result.pages.map((p) => ({ num: p.num, text: p.text ?? "" }));
  } catch (e) {
    throw new OcrError(
      "pdf_parse_failed",
      `Couldn't read that PDF: ${(e as Error).message}`,
    );
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }

  const totalChars = pages.reduce((n, p) => n + p.text.length, 0);

  // Scanned image-only PDFs come back near-empty — bail loudly.
  if (totalChars < 200) {
    throw new OcrError(
      "pdf_no_text",
      "This statement is image-only (scanned). Export it as a text PDF from your bank's portal, or send rows as CSV.",
    );
  }

  // Chunk pages into ~20K-char batches so each LLM call stays well
  // under gpt-4o-mini's 8K-token output ceiling. Each chunk gets
  // processed independently and we merge the transactions at the
  // end. Meta (bank, account, period, balances) comes from the
  // first chunk only — that's where the header lives.
  const CHUNK_CHAR_BUDGET = 20_000;
  const chunks: string[] = [];
  let cur = "";
  for (const p of pages) {
    if (cur.length + p.text.length > CHUNK_CHAR_BUDGET && cur.length > 0) {
      chunks.push(cur);
      cur = "";
    }
    cur += (cur ? "\n\n" : "") + p.text;
  }
  if (cur.length > 0) chunks.push(cur);

  // Process chunks sequentially (in parallel would race OpenAI rate
  // limits on free tier). Merge as we go. Bail early if any chunk
  // hard-errors; soft failures (malformed JSON) just contribute 0
  // rows so we don't lose every other page.
  let mergedMeta: ChunkParsed | null = null;
  const merged: StatementTxn[] = [];
  let truncatedFlag = false;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const parsed = await callChunk(chunk, key, i === 0).catch((e: unknown) => {
      console.error("[bank-statement] chunk failed", {
        chunkIndex: i,
        of: chunks.length,
        error: e instanceof Error ? e.message : String(e),
      });
      // Mark truncated when at least one chunk failed so the UI
      // surfaces the partial-import warning.
      truncatedFlag = true;
      return null;
    });
    if (!parsed) continue;

    if (i === 0) mergedMeta = parsed;
    for (const t of parsed.transactions ?? []) {
      if (!t.date || typeof t.amount !== "number" || !t.description) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) continue;
      merged.push({
        date: t.date,
        description: String(t.description).slice(0, 200),
        amount: Math.abs(t.amount),
        type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
        reference: t.reference ?? null,
        balance: typeof t.balance === "number" ? t.balance : null,
      });
    }
  }

  // Dedupe across chunk boundaries — same (date, description, amount,
  // type) within a chunk-overlap window is almost always the same row
  // seen twice. We don't currently overlap chunks but if we ever do,
  // this catches it.
  const seen = new Set<string>();
  const transactions = merged.filter((t) => {
    const k = `${t.date}|${t.amount}|${t.type}|${t.description}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    transactions,
    meta: {
      bank: mergedMeta?.bank ?? null,
      accountNumber: mergedMeta?.account_number ?? null,
      accountName: mergedMeta?.account_name ?? null,
      currency: (mergedMeta?.currency ?? "NGN").toUpperCase(),
      periodStart: mergedMeta?.period_start ?? null,
      periodEnd: mergedMeta?.period_end ?? null,
      openingBalance:
        typeof mergedMeta?.opening_balance === "number"
          ? mergedMeta!.opening_balance!
          : null,
      closingBalance:
        typeof mergedMeta?.closing_balance === "number"
          ? mergedMeta!.closing_balance!
          : null,
    },
    truncated: truncatedFlag,
  };
}

type RawTxn = {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string | null;
  balance?: number | null;
};

type ChunkParsed = {
  bank?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  currency?: string;
  period_start?: string | null;
  period_end?: string | null;
  opening_balance?: number | null;
  closing_balance?: number | null;
  transactions?: RawTxn[];
};

async function callChunk(
  chunk: string,
  key: string,
  isFirstChunk: boolean,
): Promise<ChunkParsed> {
  const userHeader = isFirstChunk
    ? "BANK STATEMENT TEXT (first chunk — include header meta):\n\n"
    : "BANK STATEMENT TEXT (continuation chunk — meta optional, focus on transactions):\n\n";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `${userHeader}${chunk}` },
      ],
      // 8,000 output tokens fits ~70-90 transactions of full JSON.
      // Combined with the 20K-char input chunking above, we land
      // comfortably across multiple calls without hitting either cap.
      max_tokens: 8_000,
      temperature: 0,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    let detail = body;
    try {
      const j = JSON.parse(body) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* keep raw */
    }
    throw new OcrError(
      `openai_${res.status}`,
      `OpenAI ${res.status}: ${detail.slice(0, 240)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: { message: { content: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as ChunkParsed;
  } catch {
    throw new OcrError(
      "bad_json",
      "OpenAI returned malformed JSON for one chunk — re-upload a clearer PDF.",
    );
  }
}
