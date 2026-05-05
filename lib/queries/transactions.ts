// Server-side loader for the active workspace's transactions, shaped to
// match lib/data/transactions.Transaction so existing UI consumers don't
// need to change. Falls back to the mock dataset when the workspace is
// empty (pre-seed) so the dashboard never blanks out.

import { createClient } from "@/lib/supabase/server";
import {
  TRANSACTIONS as MOCK_TRANSACTIONS,
  type Transaction,
} from "@/lib/data/transactions";

type Row = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  date: string;
  description: string;
  vendor_client: string | null;
  reference: string | null;
  category_confirmed: boolean | null;
  reconciled: boolean | null;
  category: { name: string } | { name: string }[] | null;
};

const NAME_TO_SLUG: Record<string, string> = {
  "Service Revenue": "revenue",
  "Product Sales": "revenue",
  "Client Invoice Payment": "revenue",
  "Stock / Inventory": "cogs",
  "Staff Salary": "payroll",
  "Office Rent": "rent",
  "Software & Subscriptions": "software",
  "Travel & Transport": "travel",
  "Professional Services": "prof",
  "Tax Payment": "tax",
};

function categoryNameToSlug(row: Row): string {
  const cat = Array.isArray(row.category) ? row.category[0] : row.category;
  if (!cat?.name) return row.type === "INCOME" ? "revenue" : "cogs";
  return NAME_TO_SLUG[cat.name] ?? (row.type === "INCOME" ? "revenue" : "cogs");
}

export type TransactionsResult = {
  transactions: Transaction[];
  /** "mock" when we fell back to seeded data (new/empty workspace),
   *  "live" when these are the user's real rows. The dashboard layout
   *  uses this to anchor period windows to the mock dataset's date so
   *  KPIs aren't blank for a fresh workspace. */
  source: "mock" | "live";
};

export async function getTransactions(): Promise<TransactionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { transactions: MOCK_TRANSACTIONS, source: "mock" };

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, date, description, vendor_client, reference, category_confirmed, reconciled, category:categories(name)",
    )
    .order("date", { ascending: false })
    .limit(500);

  // Authenticated user with no transactions yet → genuinely empty workspace.
  // Return [] as live so the dashboard renders empty states (not mock data).
  // Mock fallback is reserved for the unauthenticated /demo path above.
  if (error) return { transactions: [], source: "live" };
  if (!data || data.length === 0) {
    return { transactions: [], source: "live" };
  }

  // Map DB rows -> UI Transaction shape. Numeric id is required by UI;
  // hash the UUID into a stable positive int so React keys stay unique.
  const transactions = (data as unknown as Row[]).map((r, i) => {
    const amt = typeof r.amount === "string" ? Number(r.amount) : r.amount;
    const slug = categoryNameToSlug(r);
    return {
      id: i + 1,
      merchant: r.description || r.vendor_client || "Transaction",
      initial: (r.description || r.vendor_client || "?").charAt(0).toUpperCase(),
      ref: r.reference ?? "",
      date: r.date,
      amount: r.type === "INCOME" ? Math.abs(amt) : -Math.abs(amt),
      suggest: slug,
      conf: 95,
      applied: r.category_confirmed ? slug : null,
    };
  });
  return { transactions, source: "live" };
}
