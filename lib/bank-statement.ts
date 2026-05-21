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

  let text: string;
  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const result = await parser.getText({ last: 30 });
    text = result.text ?? "";
  } catch (e) {
    throw new OcrError(
      "pdf_parse_failed",
      `Couldn't read that PDF: ${(e as Error).message}`,
    );
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }

  // Scanned image-only PDFs come back near-empty — bail loudly.
  if (text.replace(/\s+/g, "").length < 200) {
    throw new OcrError(
      "pdf_no_text",
      "This statement is image-only (scanned). Export it as a text PDF from your bank's portal, or send rows as CSV.",
    );
  }

  // Cap the prompt at ~28K chars to keep us well under gpt-4o-mini's
  // 128K context — and to keep cost predictable. Most monthly SME
  // statements are <20K chars; quarterly ones hit ~40K.
  const MAX = 28_000;
  const truncated = text.length > MAX;
  const trimmed = truncated ? text.slice(0, MAX) : text;

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
        { role: "user", content: `BANK STATEMENT TEXT:\n\n${trimmed}` },
      ],
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

  type RawTxn = {
    date?: string;
    description?: string;
    amount?: number;
    type?: string;
    reference?: string | null;
    balance?: number | null;
  };
  type Parsed = {
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

  let parsed: Parsed;
  try {
    parsed = JSON.parse(raw) as Parsed;
  } catch {
    throw new OcrError(
      "bad_json",
      "OpenAI returned malformed JSON — try a clearer PDF.",
    );
  }

  const transactions: StatementTxn[] = [];
  for (const t of parsed.transactions ?? []) {
    if (!t.date || typeof t.amount !== "number" || !t.description) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) continue;
    transactions.push({
      date: t.date,
      description: String(t.description).slice(0, 200),
      amount: Math.abs(t.amount),
      type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
      reference: t.reference ?? null,
      balance: typeof t.balance === "number" ? t.balance : null,
    });
  }

  return {
    transactions,
    meta: {
      bank: parsed.bank ?? null,
      accountNumber: parsed.account_number ?? null,
      accountName: parsed.account_name ?? null,
      currency: (parsed.currency ?? "NGN").toUpperCase(),
      periodStart: parsed.period_start ?? null,
      periodEnd: parsed.period_end ?? null,
      openingBalance:
        typeof parsed.opening_balance === "number"
          ? parsed.opening_balance
          : null,
      closingBalance:
        typeof parsed.closing_balance === "number"
          ? parsed.closing_balance
          : null,
    },
    truncated,
  };
}
