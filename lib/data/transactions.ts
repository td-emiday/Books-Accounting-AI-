// Transaction seed for the dashboard.
//
// Generates ~1 year of deterministic mock activity ending on TODAY_ISO so that
// period toggles (Today / Week / Month / Quarter / Year) actually have data
// to filter against. Determinism matters for Server-Side Rendering — the
// same list must come out on server and client.

export type Category = {
  id: string;
  name: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: "revenue",  name: "Sales revenue",          color: "#1f6b3a" },
  { id: "cogs",     name: "Cost of goods sold",     color: "#8a5a18" },
  { id: "payroll",  name: "Payroll",                color: "#2e2c8a" },
  { id: "rent",     name: "Rent & utilities",       color: "#8f2a1f" },
  { id: "software", name: "Software & SaaS",        color: "#495a8a" },
  { id: "travel",   name: "Travel & entertainment", color: "#6b5a1f" },
  { id: "prof",     name: "Professional fees",      color: "#2a5a5a" },
  { id: "tax",      name: "Tax payments",           color: "#555555" },
  { id: "transfer", name: "Inter-account transfer", color: "#999999" },
];

export type Transaction = {
  id: number;
  merchant: string;
  initial: string;
  ref: string;
  /** ISO YYYY-MM-DD (UTC). Use fmtDate() for "18 Apr" display. */
  date: string;
  /** Naira. Negative = debit, positive = credit. */
  amount: number;
  suggest: string;
  conf: number;
  applied: string | null;
};

/** Treated as "today" everywhere — pinned so SSR is deterministic. */
export const TODAY_ISO = "2026-04-25";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function fmtDate(iso: string): string {
  // iso: "2026-04-18"
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Tiny LCG for deterministic mock data.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MERCHANTS = [
  // Revenue side
  { name: "Paystack Settlement",  initial: "P", suggest: "revenue",  ref: "Daily payout",       min: 200_000,   max: 1_500_000, sign: 1, weight: 8 },
  { name: "GTBank Inflow",        initial: "G", suggest: "revenue",  ref: "INV",                 min: 800_000,   max: 3_500_000, sign: 1, weight: 5 },
  { name: "Flutterwave Payout",   initial: "F", suggest: "revenue",  ref: "FLW",                 min: 350_000,   max: 1_800_000, sign: 1, weight: 4 },
  { name: "Stripe — Intl",        initial: "S", suggest: "revenue",  ref: "USD",                 min: 600_000,   max: 2_400_000, sign: 1, weight: 2 },
  // Cost of goods
  { name: "Shoprite Plaza",       initial: "S", suggest: "cogs",     ref: "POS",                 min: 40_000,    max: 280_000,   sign: -1, weight: 5 },
  { name: "Konga Wholesale",      initial: "K", suggest: "cogs",     ref: "INV",                 min: 120_000,   max: 720_000,   sign: -1, weight: 3 },
  { name: "Mile 12 Market",       initial: "M", suggest: "cogs",     ref: "Cash",                min: 18_000,    max: 95_000,    sign: -1, weight: 3 },
  // Software
  { name: "Figma Inc",            initial: "F", suggest: "software", ref: "Card · USD",          min: 24_000,    max: 240_000,   sign: -1, weight: 1 },
  { name: "AWS",                  initial: "A", suggest: "software", ref: "USD",                 min: 80_000,    max: 620_000,   sign: -1, weight: 2 },
  { name: "Slack",                initial: "S", suggest: "software", ref: "Card · USD",          min: 32_000,    max: 110_000,   sign: -1, weight: 1 },
  { name: "Notion",               initial: "N", suggest: "software", ref: "Card · USD",          min: 6_000,     max: 28_000,    sign: -1, weight: 1 },
  { name: "Google Workspace",     initial: "G", suggest: "software", ref: "Subscription",        min: 18_000,    max: 92_000,    sign: -1, weight: 1 },
  // Travel & ent
  { name: "Filling Station Total",initial: "T", suggest: "travel",   ref: "POS",                 min: 8_000,     max: 45_000,    sign: -1, weight: 4 },
  { name: "Uber Lagos",           initial: "U", suggest: "travel",   ref: "Trip",                min: 2_500,     max: 18_000,    sign: -1, weight: 5 },
  { name: "Bolt Food",            initial: "B", suggest: "travel",   ref: "Order",               min: 4_500,     max: 22_000,    sign: -1, weight: 3 },
  { name: "Arik Air",             initial: "A", suggest: "travel",   ref: "LOS-ABV · 2 pax",     min: 120_000,   max: 380_000,   sign: -1, weight: 1 },
  { name: "Terra Kulture",        initial: "T", suggest: "travel",   ref: "Card",                min: 12_000,    max: 38_000,    sign: -1, weight: 1 },
  // Utilities
  { name: "Ikeja Electric",       initial: "I", suggest: "rent",     ref: "Meter 0442-XL",       min: 60_000,    max: 180_000,   sign: -1, weight: 1 },
  { name: "MTN Business",         initial: "M", suggest: "rent",     ref: "Bill",                min: 28_000,    max: 92_000,    sign: -1, weight: 1 },
  // Professional
  { name: "Abdul & Co. Legal",    initial: "A", suggest: "prof",     ref: "Inv",                 min: 200_000,   max: 750_000,   sign: -1, weight: 1 },
  { name: "PwC Advisory",         initial: "P", suggest: "prof",     ref: "Inv",                 min: 1_200_000, max: 2_400_000, sign: -1, weight: 1 },
];

const TOTAL_WEIGHT = MERCHANTS.reduce((s, m) => s + m.weight, 0);
function pickMerchant(rand: () => number) {
  const r = rand() * TOTAL_WEIGHT;
  let acc = 0;
  for (const m of MERCHANTS) {
    acc += m.weight;
    if (r < acc) return m;
  }
  return MERCHANTS[0];
}

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function isoFor(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

function generateTransactions(): Transaction[] {
  const rand = lcg(42);
  const out: Transaction[] = [];
  let id = 1;

  // 12 months: May 2025 → Apr 2026, last month capped at "today" (25 Apr).
  const months: Array<{ y: number; m: number; cap: number }> = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = 4 + i; // 4 = May
    const y = monthIndex < 12 ? 2025 : 2026;
    const m = (monthIndex % 12) + 1;
    const cap = i === 11 ? 25 : daysInMonth(y, m);
    months.push({ y, m, cap });
  }

  for (const { y, m, cap } of months) {
    // Quarterly rent on the 1st (Feb / May / Aug / Nov).
    if ((m === 5 || m === 8 || m === 11 || m === 2) && cap >= 1) {
      out.push({
        id: id++,
        merchant: "Building Lease — Ikoyi",
        initial: "B",
        suggest: "rent",
        ref: `Q rent · ICB-${y}${pad(m)}`,
        date: isoFor(y, m, 1),
        amount: -1_800_000,
        conf: 99,
        applied: "rent",
      });
    }

    // Monthly payroll (15th).
    if (cap >= 15) {
      const amount = -(4_500_000 + Math.floor(rand() * 900_000));
      out.push({
        id: id++,
        merchant: "Zenith — Payroll",
        initial: "Z",
        suggest: "payroll",
        ref: `BULK-${4000 + (m + y * 12)}`,
        date: isoFor(y, m, 15),
        amount,
        conf: 98,
        applied: "payroll",
      });
    }

    // VAT remittance (21st).
    if (cap >= 21) {
      const amount = -(2_100_000 + Math.floor(rand() * 1_000_000));
      out.push({
        id: id++,
        merchant: "FIRS — VAT remittance",
        initial: "F",
        suggest: "tax",
        ref: `VAT-${y}${pad(m)}`,
        date: isoFor(y, m, 21),
        amount,
        conf: 100,
        applied: "tax",
      });
    }

    // PAYE remittance (28th).
    if (cap >= 28) {
      const amount = -(900_000 + Math.floor(rand() * 350_000));
      out.push({
        id: id++,
        merchant: "Lagos IRS — PAYE",
        initial: "L",
        suggest: "tax",
        ref: `PAYE-${y}${pad(m)}`,
        date: isoFor(y, m, 28),
        amount,
        conf: 100,
        applied: "tax",
      });
    }

    // Daily merchant activity (2-4 per day).
    for (let day = 1; day <= cap; day++) {
      const count = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < count; k++) {
        const merchant = pickMerchant(rand);
        const span = merchant.max - merchant.min;
        const amount = merchant.sign * (merchant.min + Math.floor(rand() * (span + 1)));
        const conf = 75 + Math.floor(rand() * 25);
        // ~12% need review.
        const reviewable = rand() > 0.88;
        out.push({
          id: id++,
          merchant: merchant.name,
          initial: merchant.initial,
          suggest: merchant.suggest,
          ref: `${merchant.ref} · ${id.toString(36).toUpperCase()}`,
          date: isoFor(y, m, day),
          amount,
          conf,
          applied: reviewable ? null : merchant.suggest,
        });
      }
    }
  }

  // Newest first.
  out.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
  );
  return out;
}

export const TRANSACTIONS: Transaction[] = generateTransactions();
