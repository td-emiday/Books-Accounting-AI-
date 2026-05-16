// Receipt OCR via OpenAI Vision (gpt-4o-mini). Cheap, fast, JSON-mode
// gives us a typed struct we can drop straight into a transaction row.

export type ReceiptExtract = {
  vendor: string | null;
  amount: number | null;          // total in major units (NGN)
  currency: string;               // ISO code, default NGN
  date: string | null;            // ISO YYYY-MM-DD; null when unreadable
  type: "EXPENSE" | "INCOME";     // receipts almost always EXPENSE
  description: string;            // short human summary
  line_items?: Array<{ name: string; amount?: number }>;
  confidence: number;             // 0..1
};

const SYSTEM = `You extract structured data from a receipt image.
Reply ONLY with a single JSON object matching this TypeScript type:

type R = {
  vendor: string | null;
  amount: number | null;       // total paid, major units, no currency symbol
  currency: string;            // ISO 4217 (NGN, USD, GBP, ...). Default NGN.
  date: string | null;         // YYYY-MM-DD or null
  type: "EXPENSE" | "INCOME";  // EXPENSE for receipts
  description: string;         // <= 80 chars, e.g. "Shoprite groceries"
  line_items?: { name: string; amount?: number }[];
  confidence: number;          // 0..1 — your overall confidence
};

If a field is unreadable, use null. Never guess. The currency for
unbranded receipts in West Africa defaults to "NGN".`;

// gpt-4o-mini vision accepts these MIME types. HEIC is NOT supported,
// so we reject early with a friendly error the bot can surface.
const SUPPORTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export class OcrError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "OcrError";
  }
}

export async function extractReceipt(
  imageBuffer: Buffer,
  contentType: string,
): Promise<ReceiptExtract> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new OcrError(
      "missing_key",
      "Receipt OCR isn't configured yet — OPENAI_API_KEY is missing in this environment.",
    );
  }

  const ct = contentType.split(";")[0].trim().toLowerCase();
  if (!SUPPORTED_MIME.has(ct)) {
    throw new OcrError(
      "unsupported_format",
      `Unsupported image format (${ct}). Send as a regular photo (JPEG/PNG), not a HEIC/PDF document.`,
    );
  }

  const dataUrl = `data:${ct};base64,${imageBuffer.toString("base64")}`;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
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
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the receipt." },
              { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
            ],
          },
        ],
        max_tokens: 600,
        temperature: 0,
      }),
      cache: "no-store",
    });
  } catch (e) {
    throw new OcrError(
      "network",
      `Couldn't reach OpenAI: ${(e as Error).message}`,
    );
  }

  if (!res.ok) {
    const body = await res.text();
    // Surface OpenAI's own error code when we can — auth / rate / format
    // issues all surface here and they're the most common failure mode.
    let detail = body;
    try {
      const j = JSON.parse(body) as { error?: { message?: string; code?: string } };
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
  let parsed: Partial<ReceiptExtract> = {};
  try {
    parsed = JSON.parse(raw) as Partial<ReceiptExtract>;
  } catch {
    throw new OcrError(
      "bad_json",
      "OpenAI returned malformed JSON — try a clearer photo.",
    );
  }

  return {
    vendor: parsed.vendor ?? null,
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    currency: (parsed.currency ?? "NGN").toUpperCase(),
    date: parsed.date ?? null,
    type: parsed.type === "INCOME" ? "INCOME" : "EXPENSE",
    description: (parsed.description ?? "Receipt").slice(0, 80),
    line_items: Array.isArray(parsed.line_items) ? parsed.line_items : undefined,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
  };
}

// ──────────────────────── PDF receipts ──────────────────────────────
//
// PDFs from email receipts (Shoprite, Uber, hotel bookings, software
// subs) are almost always *text-based* — the text is embedded, not an
// image. We pull the text via pdf-parse (pure JS, no native binaries)
// and send it to gpt-4o-mini's text endpoint with the same JSON-mode
// prompt we use for vision.
//
// If pdf-parse returns very little text (typical signal of a scanned
// image-only PDF), we throw `pdf_no_text` and the webhook tells the
// user to send the receipt as a photo instead. We deliberately do
// NOT pull in a PDF-to-image renderer for v1 — it doubles the bundle
// size and Vercel serverless doesn't like `canvas` deps.

const SYSTEM_PDF = `You extract structured data from a receipt that's been
exported as a PDF. The input is the full text dump of the PDF — vendor
name, line items, totals, dates and addresses are all in there,
possibly with formatting noise.

Reply ONLY with a single JSON object matching this TypeScript type:

type R = {
  vendor: string | null;        // merchant name, e.g. "Shoprite Surulere"
  amount: number | null;        // total paid, major units, no symbol
  currency: string;             // ISO 4217. Default "NGN" for West Africa.
  date: string | null;          // YYYY-MM-DD or null
  type: "EXPENSE" | "INCOME";   // expense for purchases, income for payouts
  description: string;          // <= 80 chars, e.g. "Hotel · 2 nights"
  line_items?: { name: string; amount?: number }[];
  confidence: number;           // 0..1
};

If a field is unreadable, use null. Never guess. NGN is the default
currency for receipts without an explicit one.`;

export async function extractReceiptFromPdf(
  pdfBuffer: Buffer,
): Promise<ReceiptExtract> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new OcrError(
      "missing_key",
      "Receipt OCR isn't configured yet — OPENAI_API_KEY is missing in this environment.",
    );
  }

  // Lazy import: pdf-parse pulls in pdfjs-dist at module load which
  // is heavy and would bloat any route that doesn't actually need it.
  const { PDFParse } = await import("pdf-parse");

  let text: string;
  let parser: InstanceType<typeof PDFParse> | null = null;
  try {
    parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    // Cap to the first 5 pages — a receipt is one or two pages; we
    // don't want to slurp a 200-page bank statement through here.
    const result = await parser.getText({ last: 5 });
    text = result.text ?? "";
  } catch (e) {
    throw new OcrError(
      "pdf_parse_failed",
      `Couldn't read that PDF: ${(e as Error).message}`,
    );
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }

  // Scanned / image-only PDFs come back with near-zero text. Bail
  // with a clear code so the bot tells the user to send a photo.
  if (text.replace(/\s+/g, "").length < 40) {
    throw new OcrError(
      "pdf_no_text",
      "This PDF doesn't contain readable text — looks like a scanned image. Send the receipt as a photo instead.",
    );
  }

  // Cap the text we send to the model — a typical receipt is < 2KB
  // and we don't want to pay for a 100KB PDF dump.
  const trimmed = text.slice(0, 8_000);

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
        { role: "system", content: SYSTEM_PDF },
        {
          role: "user",
          content: `RECEIPT PDF TEXT:\n\n${trimmed}`,
        },
      ],
      max_tokens: 600,
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
  let parsed: Partial<ReceiptExtract> = {};
  try {
    parsed = JSON.parse(raw) as Partial<ReceiptExtract>;
  } catch {
    throw new OcrError(
      "bad_json",
      "OpenAI returned malformed JSON — try a clearer PDF.",
    );
  }

  return {
    vendor: parsed.vendor ?? null,
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    currency: (parsed.currency ?? "NGN").toUpperCase(),
    date: parsed.date ?? null,
    type: parsed.type === "INCOME" ? "INCOME" : "EXPENSE",
    description: (parsed.description ?? "Receipt").slice(0, 80),
    line_items: Array.isArray(parsed.line_items) ? parsed.line_items : undefined,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
  };
}
