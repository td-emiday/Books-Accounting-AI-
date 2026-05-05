// Live invoices loader. Maps DB rows to the UI's Invoice shape.

import { createClient } from "@/lib/supabase/server";
import {
  INVOICES as MOCK_INVOICES,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/data/invoices";

type Row = {
  id: string;
  number: string;
  issue_date: string;
  due_date: string | null;
  amount: number | string;
  status: string;
  client: { name: string; sector: string | null } | { name: string; sector: string | null }[] | null;
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtShort(iso: string | null): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const TODAY_ISO = "2026-04-25"; // matches mock-data anchor

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return MOCK_INVOICES;

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, issue_date, due_date, amount, status, client:clients(name, sector)",
    )
    .order("issue_date", { ascending: false });

  // Authenticated + empty → real empty workspace. Mock only for unauthed (/demo).
  if (error) return [];
  if (!data || data.length === 0) return [];

  return (data as unknown as Row[]).map((r) => {
    const client = Array.isArray(r.client) ? r.client[0] : r.client;
    const amt = typeof r.amount === "string" ? Number(r.amount) : r.amount;
    return {
      id: r.number,
      client: client?.name ?? "—",
      initial: (client?.name ?? "?").charAt(0).toUpperCase(),
      sector: client?.sector ?? "—",
      issued: fmtShort(r.issue_date),
      due: fmtShort(r.due_date),
      daysLeft: r.due_date ? daysBetween(TODAY_ISO, r.due_date) : 0,
      amount: amt,
      status: r.status as InvoiceStatus,
    };
  });
}
