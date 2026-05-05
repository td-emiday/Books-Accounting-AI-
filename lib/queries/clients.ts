// Live clients loader. Falls back to the mock dataset for empty workspaces.
//
// Operational metrics (revenue, AR, next-due, status) are computed from
// the invoices table so the Clients page stays in sync with the rest
// of the dashboard.

import { createClient } from "@/lib/supabase/server";
import { CLIENTS as MOCK_CLIENTS, type Client, type ClientStatus } from "@/lib/data/clients";

type ClientRow = {
  id: string;
  name: string;
  sector: string | null;
  location: string | null;
};

type InvoiceRow = {
  client_id: string | null;
  amount: number | string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDue(iso: string | null): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return MOCK_CLIENTS;

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, sector, location")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  // Authenticated user with zero rows → genuinely empty workspace, return [].
  // Mock data is only used when there's no user (e.g. /demo).
  if (error) return [];
  if (!data || data.length === 0) return [];

  // Pull all invoices in one round-trip; group in memory.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("client_id, amount, status, due_date, paid_at");

  const byClient = new Map<string, InvoiceRow[]>();
  for (const inv of (invoices ?? []) as InvoiceRow[]) {
    if (!inv.client_id) continue;
    const arr = byClient.get(inv.client_id) ?? [];
    arr.push(inv);
    byClient.set(inv.client_id, arr);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (data as ClientRow[]).map((r, i) => {
    const invs = byClient.get(r.id) ?? [];
    const total = invs.length;
    const paidCount = invs.filter((x) => x.status === "paid").length;
    const overdueCount = invs.filter((x) => x.status === "overdue").length;
    const reconciled = total === 0 ? 100 : Math.round((paidCount / total) * 100);
    const toReview = invs.filter((x) =>
      x.status === "draft" || x.status === "sent",
    ).length;
    const revenue = invs
      .filter((x) => x.status === "paid")
      .reduce((s, x) => s + Number(x.amount || 0), 0);

    // Soonest unpaid due date.
    const upcoming = invs
      .filter((x) => x.due_date && (x.status === "sent" || x.status === "overdue"))
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0];

    let status: ClientStatus = "ok";
    if (overdueCount > 0) status = "late";
    else if (upcoming?.due_date && upcoming.due_date < today) status = "warn";

    const nextDue = upcoming?.due_date
      ? `Invoice · ${fmtDue(upcoming.due_date)}`
      : "—";

    return {
      id: i + 1,
      name: r.name,
      sector: [r.sector, r.location].filter(Boolean).join(" · ") || "—",
      owner: "—",
      reconciled,
      toReview,
      nextDue,
      revenue,
      status,
    };
  });
}
