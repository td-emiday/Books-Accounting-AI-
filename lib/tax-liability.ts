// Real tax-liability calculator. Derives the next-due-quarter VAT
// position from actual workspace transactions instead of the mock
// numbers we used to ship in lib/data/overview.ts.
//
// What we compute today (v1):
//   • VAT — 7.5% Nigerian rate. Output VAT (on income) minus Input
//     VAT (on expense). We treat transaction amounts as VAT-inclusive
//     (the standard for Nigerian SMEs invoicing in NGN), so the VAT
//     portion of an amount is `amount * 7.5 / 107.5`.
//
// What we deliberately don't compute yet:
//   • PAYE — needs payroll data we don't yet capture (per-employee
//     salaries + state of residence). When payroll lands, plug it in.
//   • Pension — same: needs payroll roster + RSA registry.
//   • CIT — annual; needs P&L for the fiscal year and small-company
//     classification (₦25M / ₦100M thresholds). Plug in once the
//     workspace has a full year of clean data.
//   • Withholding tax — needs vendor classification.
//
// The card on /app surfaces VAT only when other taxes are zero. When
// payroll lands they slot in alongside without changing the contract.

import type { Transaction } from "@/lib/data/transactions";
import type { TaxLiability } from "@/lib/data/overview";

const NG_VAT_RATE = 0.075;

/** Portion of a VAT-inclusive amount that is VAT. */
function vatPortionOf(amountInclusive: number): number {
  return (amountInclusive * NG_VAT_RATE) / (1 + NG_VAT_RATE);
}

/**
 * Compute the tax liability accruing for the *current calendar quarter*
 * up to and including `today`. Returns the same `TaxLiability` shape the
 * Bento card already renders so it slots in with no UI change.
 *
 * `today` is passed (not read from `new Date()`) so /demo and tests can
 * pin to a fixed wall-clock.
 */
export function computeTaxLiability(
  transactions: Transaction[],
  today: Date,
): TaxLiability {
  // Quarter window: 1st of Jan/Apr/Jul/Oct → today.
  const q = Math.floor(today.getUTCMonth() / 3); // 0..3
  const qStart = new Date(Date.UTC(today.getUTCFullYear(), q * 3, 1));
  const qStartIso = qStart.toISOString().slice(0, 10);
  const todayIso = today.toISOString().slice(0, 10);

  // Quarter VAT due-date — the 21st of the month *after* the quarter
  // closes (Nigerian filing calendar). For Q2 (Apr-Jun) that's 21-Jul.
  const dueMonthIdx = q * 3 + 3; // 0-indexed month of due date
  const dueDate = new Date(Date.UTC(today.getUTCFullYear(), dueMonthIdx, 21));
  const dueDateLabel = dueDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
  const daysToDue = Math.max(
    0,
    Math.round((dueDate.getTime() - today.getTime()) / 86_400_000),
  );

  // Sum VAT on income (output) vs expense (input) within the quarter.
  // Negative `amount` in our transactions schema = expense.
  let outputVat = 0; // we owe to FIRS
  let inputVat = 0;  // we can claim back

  for (const t of transactions) {
    if (t.date < qStartIso || t.date > todayIso) continue;
    const abs = Math.abs(t.amount);
    if (t.amount > 0) outputVat += vatPortionOf(abs);
    else inputVat += vatPortionOf(abs);
  }

  const vatNet = Math.max(0, Math.round(outputVat - inputVat));

  const rows: TaxLiability["rows"] = [
    { name: "VAT", note: "(7.5%)", amount: vatNet, tone: "ink" },
    // Placeholders for the other taxes — they sit at zero until we
    // have the data sources to compute them. Kept in the row list so
    // the card still teaches users the full tax surface they'll owe
    // once payroll + year-end run.
    { name: "PAYE", note: "needs payroll", amount: 0, tone: "ink-2" },
    { name: "CIT", note: "Q2 est.", amount: 0, tone: "line" },
  ];

  return {
    total: rows.reduce((n, r) => n + r.amount, 0),
    dueDate: dueDateLabel,
    daysToDue,
    rows,
  };
}
