// Headline KPIs + cashflow + compliance data shown in the Overview Bento.
// Values are MTD snapshots — in production these come from a ledger query.

export type KpiTrend = "up" | "down";

export type Kpi = {
  label: string;
  amount: number;        // full ₦ value
  trend: KpiTrend;
  change: string;        // "12.4%"
  changeLabel: string;   // "vs last month" | "Payroll +₦2.1M · Inventory +₦780k"
  sparkline: number[];
};

export const REVENUE_KPI: Kpi = {
  label: "Revenue · MTD",
  amount: 48_220_500,
  trend: "up",
  change: "12.4%",
  changeLabel: "vs last month",
  sparkline: [12, 18, 14, 22, 19, 26, 24, 31, 29, 35, 33, 42],
};

export const EXPENSES_KPI: Kpi = {
  label: "Expenses · MTD",
  amount: 19_644_120,
  trend: "down",
  change: "4.1%",
  changeLabel: "Payroll +₦2.1M · Inventory +₦780k",
  sparkline: [18, 15, 22, 19, 24, 21, 26, 23, 28, 25, 29, 27],
};

export type TaxLiabilityRow = {
  name: string;
  note: string; // "(7.5%)" | "Q2 est." | "Apr"
  amount: number;
  tone: "ink" | "ink-2" | "line";
};

export type TaxLiability = {
  total: number;
  dueDate: string;
  daysToDue: number;
  rows: TaxLiabilityRow[];
};

export const TAX_LIABILITY: TaxLiability = {
  total: 6_412_900,
  dueDate: "21 Apr",
  daysToDue: 6,
  rows: [
    { name: "VAT", note: "(7.5%)", amount: 3_241_500, tone: "ink" },
    { name: "CIT", note: "Q2 est.", amount: 2_120_400, tone: "ink-2" },
    { name: "PAYE", note: "Apr", amount: 1_051_000, tone: "line" },
  ],
};

export type AuthorityState = "ok" | "warn";

export type Authority = {
  name: string;
  sub: string;
  state: AuthorityState;
  meta: string;
};

export const AUTHORITIES: Authority[] = [
  { name: "FIRS",      sub: "VAT · CIT · WHT",            state: "ok",   meta: "4 of 4 filed" },
  { name: "Lagos IRS", sub: "PAYE · LASG levies",          state: "warn", meta: "March PAYE draft — review" },
  { name: "PenCom",    sub: "Pension remittance",          state: "ok",   meta: "Auto-debit armed" },
  { name: "NSITF",     sub: "Employee compensation",       state: "ok",   meta: "Q1 settled" },
];

export type ComplianceStats = {
  scorePct: number;       // 92
  streakMonths: number;   // 14
  streakLabel: string;    // "month streak · no penalties"
};

export const COMPLIANCE: ComplianceStats = {
  scorePct: 92,
  streakMonths: 14,
  streakLabel: "month streak · no penalties",
};

export type CashflowPoint = { month: string; in: number; out: number };

export const CASHFLOW_12M: CashflowPoint[] = [
  { month: "May", in: 28, out: 22 },
  { month: "Jun", in: 32, out: 25 },
  { month: "Jul", in: 29, out: 21 },
  { month: "Aug", in: 35, out: 28 },
  { month: "Sep", in: 31, out: 26 },
  { month: "Oct", in: 38, out: 30 },
  { month: "Nov", in: 42, out: 32 },
  { month: "Dec", in: 45, out: 36 },
  { month: "Jan", in: 40, out: 33 },
  { month: "Feb", in: 44, out: 34 },
  { month: "Mar", in: 47, out: 36 },
  { month: "Apr", in: 48, out: 20 },
];
