// Period filtering helpers shared by the dashboard.
//
// The dashboard pins "today" to TODAY_ISO so SSR is deterministic; in a real
// app this would be replaced with `new Date()` and a server-rendered hint.

import type { Period } from "@/components/top-bar";
import { TODAY_ISO, type Transaction } from "@/lib/data/transactions";

export const TODAY = parseIso(TODAY_ISO);

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type PeriodWindow = {
  /** Inclusive ISO start. */
  startIso: string;
  /** Inclusive ISO end. */
  endIso: string;
  /** Length in days for delta comparisons. */
  days: number;
  /** Human label e.g. "Apr 2026 · month-to-date". */
  label: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function windowFor(period: Period, today: Date = TODAY): PeriodWindow {
  const end = new Date(today);
  const endIso = toIso(end);
  const y = end.getUTCFullYear();
  const m = end.getUTCMonth();

  if (period === "Today") {
    return { startIso: endIso, endIso, days: 1, label: `${end.getUTCDate()} ${MONTHS[m]} ${y}` };
  }
  if (period === "Week") {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return { startIso: toIso(start), endIso, days: 7, label: "Last 7 days" };
  }
  if (period === "Month") {
    const start = new Date(Date.UTC(y, m, 1));
    return { startIso: toIso(start), endIso, days: end.getUTCDate(), label: `${MONTHS[m]} ${y} · month-to-date` };
  }
  if (period === "Quarter") {
    const qStartMonth = Math.floor(m / 3) * 3;
    const start = new Date(Date.UTC(y, qStartMonth, 1));
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const q = Math.floor(m / 3) + 1;
    return { startIso: toIso(start), endIso, days, label: `Q${q} ${y} · quarter-to-date` };
  }
  // Year
  const start = new Date(Date.UTC(y, 0, 1));
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { startIso: toIso(start), endIso, days, label: `${y} · year-to-date` };
}

/** Window of equal length immediately before `w`, used for vs-prev deltas. */
export function previousWindow(w: PeriodWindow): { startIso: string; endIso: string } {
  const start = parseIso(w.startIso);
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (w.days - 1));
  return { startIso: toIso(prevStart), endIso: toIso(prevEnd) };
}

export function filterByPeriod(
  txns: Transaction[],
  period: Period,
  today: Date = TODAY,
): Transaction[] {
  const w = windowFor(period, today);
  return txns.filter((t) => t.date >= w.startIso && t.date <= w.endIso);
}

/** Sums in/out/net over a single period window. Convenience wrapper. */
export function summarizeForPeriod(
  txns: Transaction[],
  period: Period,
  today: Date = TODAY,
) {
  return summarize(filterByPeriod(txns, period, today));
}

export function filterByRange(
  txns: Transaction[],
  startIso: string,
  endIso: string,
): Transaction[] {
  return txns.filter((t) => t.date >= startIso && t.date <= endIso);
}

export function summarize(txns: Transaction[]): {
  revenue: number;
  expenses: number;
  net: number;
} {
  let revenue = 0;
  let expenses = 0;
  for (const t of txns) {
    if (t.amount > 0) revenue += t.amount;
    else expenses += -t.amount;
  }
  return { revenue, expenses, net: revenue - expenses };
}
