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

export async function extractReceipt(
  imageBuffer: Buffer,
  contentType: string,
): Promise<ReceiptExtract> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const dataUrl = `data:${contentType};base64,${imageBuffer.toString("base64")}`;

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

  if (!res.ok) {
    throw new Error(`OpenAI vision failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<ReceiptExtract>;

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
