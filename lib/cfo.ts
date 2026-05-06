// "Ask your CFO" — natural-language Q&A over a workspace's books.
//
// We don't ship the user's full ledger to the LLM. Instead, we compute
// a tight JSON snapshot (totals, top categories, recent transactions,
// last 6 months of net) and let gpt-4o-mini answer from that.
// Cost target: ~$0.0004 per question on real-world data.
//
// Rules of engagement (encoded in SYSTEM_PROMPT):
//   - Only answer from the snapshot. No hallucinated numbers.
//   - Use ₦ formatting and short, chat-friendly Markdown.
//   - When the answer isn't in the snapshot, say so and suggest where
//     in the app the user can find it.

import type { SupabaseClient } from "@supabase/supabase-js";

export type CfoAnswer = {
  text: string;
  modelMs: number;
  promptTokens?: number;
  completionTokens?: number;
};

export class CfoError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "CfoError";
  }
}

type Workspace = {
  id: string;
  name: string;
  currency: string;
  industry: string | null;
  business_type: string | null;
  vat_registered: boolean | null;
  fiscal_year_end: string | null;
};

type Txn = {
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  vendor_client: string | null;
  description: string;
  category: string | null;
};

type Snapshot = {
  workspace: Workspace;
  todayIso: string;
  totals: {
    last30: { income: number; expenses: number; net: number; count: number };
    thisMonth: { income: number; expenses: number; net: number; count: number };
    last6Months: { month: string; income: number; expenses: number; net: number }[];
  };
  topExpenseCategories: { category: string; total: number; count: number }[];
  recentTransactions: Txn[];
};

// 60s in-process snapshot cache so back-to-back questions don't
// re-run the SQL every time. Cleared automatically on cold start.
const SNAPSHOT_CACHE = new Map<string, { at: number; snap: Snapshot }>();
const SNAPSHOT_TTL_MS = 60_000;

export async function buildWorkspaceSnapshot(
  client: SupabaseClient,
  workspaceId: string,
): Promise<Snapshot> {
  const cached = SNAPSHOT_CACHE.get(workspaceId);
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached.snap;

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const thirtyAgo = new Date(today.getTime() - 30 * 86400 * 1000)
    .toISOString()
    .slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const [{ data: ws }, { data: txnRows }] = await Promise.all([
    client
      .from("workspaces")
      .select(
        "id, name, currency, industry, business_type, vat_registered, fiscal_year_end",
      )
      .eq("id", workspaceId)
      .maybeSingle(),
    client
      .from("transactions")
      .select(
        "date, amount, type, vendor_client, description, category:categories(name)",
      )
      .eq("workspace_id", workspaceId)
      .gte("date", sixMonthsAgo)
      .order("date", { ascending: false })
      .limit(500),
  ]);

  if (!ws) throw new CfoError("no_workspace", "workspace not found");

  type Row = {
    date: string;
    amount: number | string;
    type: "INCOME" | "EXPENSE";
    vendor_client: string | null;
    description: string;
    category: { name: string } | { name: string }[] | null;
  };
  const rows = (txnRows ?? []) as unknown as Row[];

  const txns: Txn[] = rows.map((r) => ({
    date: r.date,
    amount: typeof r.amount === "string" ? Number(r.amount) : r.amount,
    type: r.type,
    vendor_client: r.vendor_client,
    description: r.description,
    category: Array.isArray(r.category)
      ? r.category[0]?.name ?? null
      : r.category?.name ?? null,
  }));

  const sumWindow = (from: string) => {
    let inc = 0,
      exp = 0,
      n = 0;
    for (const t of txns) {
      if (t.date < from) continue;
      n += 1;
      if (t.type === "INCOME") inc += t.amount;
      else exp += t.amount;
    }
    return { income: inc, expenses: exp, net: inc - exp, count: n };
  };

  // Bucket by YYYY-MM for the last 6 months.
  const byMonth = new Map<string, { income: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, { income: 0, expenses: 0 });
  }
  for (const t of txns) {
    const key = t.date.slice(0, 7);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    if (t.type === "INCOME") bucket.income += t.amount;
    else bucket.expenses += t.amount;
  }
  const last6Months = [...byMonth.entries()].map(([month, v]) => ({
    month,
    income: v.income,
    expenses: v.expenses,
    net: v.income - v.expenses,
  }));

  // Top expense categories last 30 days.
  const catTotals = new Map<string, { total: number; count: number }>();
  for (const t of txns) {
    if (t.type !== "EXPENSE") continue;
    if (t.date < thirtyAgo) continue;
    const key = t.category ?? "Uncategorised";
    const cur = catTotals.get(key) ?? { total: 0, count: 0 };
    cur.total += t.amount;
    cur.count += 1;
    catTotals.set(key, cur);
  }
  const topExpenseCategories = [...catTotals.entries()]
    .map(([category, v]) => ({ category, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const snap: Snapshot = {
    workspace: ws as Workspace,
    todayIso,
    totals: {
      last30: sumWindow(thirtyAgo),
      thisMonth: sumWindow(monthStart),
      last6Months,
    },
    topExpenseCategories,
    recentTransactions: txns.slice(0, 25),
  };

  SNAPSHOT_CACHE.set(workspaceId, { at: Date.now(), snap });
  return snap;
}

const SYSTEM_PROMPT = `You are Emiday, a calm, sharp CFO assistant for Nigerian SMEs.
You answer questions about a single workspace using ONLY the provided
JSON snapshot of their books.

RULES:
- Be concise. 1-3 short paragraphs, or a tight bulleted list. Never lecture.
- Use the workspace's currency (usually NGN) with the proper symbol — e.g.
  ₦12,500 not "NGN 12500".
- Numbers come ONLY from the snapshot. Never invent figures.
- If the question can't be answered from the snapshot (e.g. it asks
  about data older than 6 months, or a transaction we don't have),
  say so plainly and point them to the relevant section of the app
  (Transactions, Reports, Tax).
- Date references should be human ("last 30 days", "this month",
  "May 2026") not ISO strings.
- Format for chat with light Markdown: *bold* for headings, hyphens
  for bullets. No tables, no headings, no code blocks.
- If the snapshot has no transactions, gently suggest uploading a
  bank statement to get started.
- Don't sign off with "Best regards" or "Hope this helps" — just answer.`;

export async function askCFO(
  client: SupabaseClient,
  workspaceId: string,
  question: string,
): Promise<CfoAnswer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new CfoError("missing_key", "OPENAI_API_KEY is not set");

  const q = question.trim().slice(0, 1000);
  if (!q) throw new CfoError("empty_question", "question is empty");

  const snap = await buildWorkspaceSnapshot(client, workspaceId);

  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `WORKSPACE SNAPSHOT (JSON):\n${JSON.stringify(snap, null, 2)}\n\nQUESTION: ${q}`,
        },
      ],
      max_tokens: 450,
      temperature: 0.2,
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
    throw new CfoError(
      `openai_${res.status}`,
      `OpenAI ${res.status}: ${detail.slice(0, 240)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: { message: { content: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text =
    json.choices?.[0]?.message?.content?.trim() ??
    "I couldn't put an answer together. Try rephrasing the question.";

  return {
    text,
    modelMs: Date.now() - t0,
    promptTokens: json.usage?.prompt_tokens,
    completionTokens: json.usage?.completion_tokens,
  };
}
