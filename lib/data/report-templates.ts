// Line-item data for every printable report.
//
// One template per shape, each shaped as { sections } where a section is
// a list of rows. The report-document component renders a section as a
// labelled block with a subtotal. This keeps every statement consistent
// in look and feel, regardless of accounting type.
//
// Numbers are illustrative — wired to real workspace aggregates in a
// later pass. For now they're plausible figures for a Lagos-based SME
// running ~₦60-80M/yr in revenue.

export type ReportRow = {
  label: string;
  amount: number;
  /** Optional indent level for nested rows. */
  indent?: 0 | 1 | 2;
  /** Mark as a subtotal/total — renders bold + ruled. */
  emphasis?: "subtotal" | "total" | "negative";
  /** Override formatting for non-currency rows (e.g. a count). */
  raw?: string;
};

export type ReportSection = {
  heading: string;
  /** Optional kicker shown above the heading. */
  kicker?: string;
  rows: ReportRow[];
  /** Optional auto-computed total label; if set we add a synthesized row. */
  totalLabel?: string;
};

export type ReportShape =
  | "pl"
  | "bs"
  | "cf"
  | "vat"
  | "pay"
  | "tb"
  | "daybook"
  | "monthend";

/** A "where you stand" summary line, rendered as a prominent strip
 *  between the title block and the first section. The amount is signed
 *  — positive renders green (in the black), negative renders red (in
 *  the red). Tone tells the renderer how to colour it for cases where
 *  zero or sign isn't the right cue (e.g. headcount). */
export type ReportNet = {
  label: string;
  amount: number;
  /** Optional caption shown below the label (e.g. "Apr 2026"). */
  caption?: string;
  /** Override colour: positive = green, negative = red, neutral = ink. */
  tone?: "positive" | "negative" | "neutral";
};

export type ReportTemplate = {
  shape: ReportShape;
  /** Title shown at the top of the document. */
  title: string;
  /** Subtitle / period descriptor. */
  subtitle: string;
  /** Currency symbol — kept on the template so a future GHS/ZAR workspace can override. */
  currencySymbol: string;
  /** Big "net" strip — the headline number for the period. */
  net?: ReportNet;
  /** Optional table-of-contents (used by the month-end pack). */
  toc?: string[];
  sections: ReportSection[];
  /** Optional extra footnote shown above the legal footer. */
  notes?: string[];
};

// Money helpers ----------------------------------------------------------

/** ₦12,345,678 — used by the renderer. */
export function fmtMoney(n: number, sym = "₦"): string {
  if (n < 0) return "(" + sym + Math.abs(n).toLocaleString("en-NG") + ")";
  return sym + n.toLocaleString("en-NG");
}

const sumRows = (rows: ReportRow[]) =>
  rows.filter((r) => !r.raw && r.emphasis !== "subtotal" && r.emphasis !== "total")
    .reduce((s, r) => s + (r.amount || 0), 0);

// ----------------------------------------------------------------------
// Profit & Loss
// ----------------------------------------------------------------------
const PL: ReportTemplate = {
  shape: "pl",
  title: "Profit & Loss Statement",
  subtitle: "1 April – 30 April 2026",
  currencySymbol: "₦",
  net: {
    label: "Profit before tax",
    amount: 19_308_600,
    caption: "Apr 2026 · in the green",
  },
  sections: [
    {
      kicker: "Revenue",
      heading: "Income",
      rows: [
        { label: "Sales — retail",                 amount: 28_412_000 },
        { label: "Sales — wholesale",              amount: 18_640_500 },
        { label: "Online (Paystack)",              amount:  7_124_300 },
        { label: "Service revenue",                amount:  2_840_000 },
        { label: "Other operating income",         amount:    482_000 },
      ],
      totalLabel: "Total revenue",
    },
    {
      kicker: "Cost of sales",
      heading: "Direct costs",
      rows: [
        { label: "Cost of goods sold",             amount: -22_180_400 },
        { label: "Inbound logistics",              amount:  -1_842_000 },
        { label: "Packaging & supplies",           amount:    -640_000 },
      ],
      totalLabel: "Gross profit",
    },
    {
      kicker: "Operating expenses",
      heading: "Operating expenses",
      rows: [
        { label: "Salaries & wages",               amount: -8_420_000 },
        { label: "Pension contributions",          amount:   -842_000 },
        { label: "Rent & utilities",               amount: -1_950_000 },
        { label: "Software & SaaS",                amount:   -612_400 },
        { label: "Diesel & generator",             amount:   -380_000 },
        { label: "Travel & entertainment",         amount:   -284_500 },
        { label: "Professional fees",              amount:   -420_000 },
        { label: "Bank charges",                   amount:   -118_900 },
        { label: "Marketing",                      amount:   -640_000 },
      ],
      totalLabel: "Operating profit",
    },
    {
      heading: "Tax & finance",
      rows: [
        { label: "Interest expense",               amount:   -180_000 },
        { label: "Withholding tax credits",        amount:    320_000 },
      ],
      totalLabel: "Profit before tax",
    },
  ],
  notes: [
    "Figures shown are management accounts. Statutory accounts are filed annually with FIRS and CAC.",
  ],
};

// ----------------------------------------------------------------------
// Balance Sheet
// ----------------------------------------------------------------------
const BS: ReportTemplate = {
  shape: "bs",
  title: "Balance Sheet",
  subtitle: "Snapshot — 30 April 2026",
  currencySymbol: "₦",
  net: {
    label: "Net worth (equity)",
    amount: 49_040_500,
    caption: "As of 30 Apr 2026",
  },
  sections: [
    {
      kicker: "Assets",
      heading: "Current assets",
      rows: [
        { label: "Cash — GTBank Business **2041",   amount: 12_840_500 },
        { label: "Cash — Zenith Collections **8812", amount:  4_120_900 },
        { label: "Cash — Stanbic USD **9001",        amount:  2_980_000 },
        { label: "Accounts receivable",              amount:  9_420_000 },
        { label: "Inventory",                        amount: 18_640_000 },
        { label: "Prepaid expenses",                 amount:  1_240_000 },
      ],
      totalLabel: "Total current assets",
    },
    {
      heading: "Non-current assets",
      rows: [
        { label: "Property, plant & equipment",      amount: 28_400_000 },
        { label: "Less: accumulated depreciation",   amount: -6_840_000 },
        { label: "Intangible assets",                amount:  1_800_000 },
      ],
      totalLabel: "Total non-current assets",
    },
    {
      kicker: "Liabilities",
      heading: "Current liabilities",
      rows: [
        { label: "Accounts payable",                 amount:  6_420_000 },
        { label: "VAT payable (FIRS)",               amount:  3_241_500 },
        { label: "PAYE payable (LIRS)",              amount:    980_000 },
        { label: "Pension payable",                  amount:    842_000 },
        { label: "Short-term borrowings",            amount:  4_000_000 },
      ],
      totalLabel: "Total current liabilities",
    },
    {
      heading: "Non-current liabilities",
      rows: [
        { label: "Long-term loan — GTBank",          amount: 12_000_000 },
      ],
      totalLabel: "Total liabilities",
    },
    {
      kicker: "Equity",
      heading: "Owner's equity",
      rows: [
        { label: "Share capital",                    amount: 10_000_000 },
        { label: "Retained earnings",                amount: 35_900_000 },
        { label: "Profit for the period",            amount:  3_140_500 },
      ],
      totalLabel: "Total equity",
    },
  ],
};

// ----------------------------------------------------------------------
// Cashflow
// ----------------------------------------------------------------------
const CF: ReportTemplate = {
  shape: "cf",
  title: "Cashflow Statement",
  subtitle: "Q1 2026 · indirect method",
  currencySymbol: "₦",
  net: {
    label: "Net change in cash",
    amount: 3_180_000,
    caption: "Q1 2026 · cash position improved",
  },
  sections: [
    {
      kicker: "Operating activities",
      heading: "Operating cashflow",
      rows: [
        { label: "Profit before tax",                amount:  9_240_000 },
        { label: "Depreciation & amortisation",      amount:  1_840_000 },
        { label: "Increase in receivables",          amount: -2_120_000 },
        { label: "Increase in inventory",            amount: -3_400_000 },
        { label: "Increase in payables",             amount:  1_640_000 },
      ],
      totalLabel: "Net cash from operations",
    },
    {
      kicker: "Investing activities",
      heading: "Investing cashflow",
      rows: [
        { label: "Purchase of equipment",            amount: -4_800_000 },
        { label: "Sale of fixed assets",             amount:    420_000 },
      ],
      totalLabel: "Net cash from investing",
    },
    {
      kicker: "Financing activities",
      heading: "Financing cashflow",
      rows: [
        { label: "Loan drawdown",                    amount:  4_000_000 },
        { label: "Loan repayment",                   amount: -1_240_000 },
        { label: "Owner's drawings",                 amount: -2_400_000 },
      ],
      totalLabel: "Net cash from financing",
    },
    {
      heading: "Cash position",
      rows: [
        { label: "Cash at start of quarter",         amount: 16_780_000 },
        { label: "Net change in cash",               amount:  3_180_000 },
      ],
      totalLabel: "Cash at end of quarter",
    },
  ],
};

// ----------------------------------------------------------------------
// VAT Return
// ----------------------------------------------------------------------
const VAT: ReportTemplate = {
  shape: "vat",
  title: "VAT Return",
  subtitle: "March 2026 · FIRS Form 002",
  currencySymbol: "₦",
  net: {
    label: "Net VAT payable to FIRS",
    amount: -1_843_500,
    caption: "Due 21 Apr 2026 · in the red",
  },
  sections: [
    {
      kicker: "Output VAT",
      heading: "VAT charged on sales",
      rows: [
        { label: "Standard-rated sales (7.5%)",      amount: 43_220_000 },
        { label: "Zero-rated sales",                 amount:  1_840_000 },
        { label: "Exempt sales",                     amount:    420_000 },
        { label: "Output VAT collected",             amount:  3_241_500, emphasis: "subtotal" },
      ],
    },
    {
      kicker: "Input VAT",
      heading: "VAT paid on purchases",
      rows: [
        { label: "Standard-rated purchases",         amount: 18_640_000 },
        { label: "Input VAT paid",                   amount:  1_398_000, emphasis: "subtotal" },
      ],
    },
    {
      heading: "Net VAT due",
      rows: [
        { label: "Output VAT",                       amount:  3_241_500 },
        { label: "Less: input VAT",                  amount: -1_398_000 },
      ],
      totalLabel: "Net VAT payable to FIRS",
    },
  ],
  notes: [
    "Filing deadline: 21 April 2026.",
    "Pay via FIRS TaxPro-Max using TIN 1488-2011-8402.",
  ],
};

// ----------------------------------------------------------------------
// Payroll Summary
// ----------------------------------------------------------------------
const PAY: ReportTemplate = {
  shape: "pay",
  title: "Payroll Summary",
  subtitle: "April 2026 · 42 employees",
  currencySymbol: "₦",
  net: {
    label: "Total payroll cost",
    amount: -13_324_800,
    caption: "Apr 2026 · gross + employer remittances",
  },
  sections: [
    {
      kicker: "Gross to net",
      heading: "Earnings & deductions",
      rows: [
        { label: "Gross salaries",                   amount:  9_840_000 },
        { label: "Allowances (transport, housing)",  amount:  1_240_000 },
        { label: "Less: PAYE tax",                   amount:   -980_000 },
        { label: "Less: pension (employee 8%)",      amount:   -842_000 },
        { label: "Less: NHF (2.5%)",                 amount:   -246_000 },
      ],
      totalLabel: "Net pay to staff",
    },
    {
      kicker: "Employer remittances",
      heading: "Statutory remittances",
      rows: [
        { label: "PAYE — Lagos IRS",                 amount:    980_000 },
        { label: "Pension (employer 10%)",           amount:  1_054_000 },
        { label: "NSITF (1%)",                       amount:    105_400 },
        { label: "ITF (1%)",                         amount:    105_400 },
      ],
      totalLabel: "Total statutory remittances",
    },
    {
      heading: "Headcount",
      rows: [
        { label: "Permanent",   raw: "31",  amount: 0 },
        { label: "Contract",    raw: "8",   amount: 0 },
        { label: "Part-time",   raw: "3",   amount: 0 },
        { label: "Total",       raw: "42",  amount: 0, emphasis: "subtotal" },
      ],
    },
  ],
};

// ----------------------------------------------------------------------
// Trial Balance
// ----------------------------------------------------------------------
const TB: ReportTemplate = {
  shape: "tb",
  title: "Trial Balance",
  subtitle: "Period end · 31 March 2026",
  currencySymbol: "₦",
  net: {
    label: "Difference (debit − credit)",
    amount: 0,
    caption: "Books in balance",
    tone: "neutral",
  },
  sections: [
    {
      heading: "Assets",
      rows: [
        { label: "1010 · Cash — GTBank Business",    amount: 12_840_500 },
        { label: "1011 · Cash — Zenith Collections", amount:  4_120_900 },
        { label: "1012 · Cash — Stanbic USD",        amount:  2_980_000 },
        { label: "1200 · Accounts receivable",       amount:  9_420_000 },
        { label: "1300 · Inventory",                 amount: 18_640_000 },
        { label: "1500 · PP&E (net)",                amount: 21_560_000 },
        { label: "1600 · Intangible assets",         amount:  1_800_000 },
      ],
      totalLabel: "Total debit",
    },
    {
      heading: "Liabilities & equity",
      rows: [
        { label: "2010 · Accounts payable",          amount:  6_420_000 },
        { label: "2100 · VAT payable",               amount:  3_241_500 },
        { label: "2110 · PAYE payable",              amount:    980_000 },
        { label: "2120 · Pension payable",           amount:    842_000 },
        { label: "2200 · Short-term borrowings",     amount:  4_000_000 },
        { label: "2500 · Long-term loan",            amount: 12_000_000 },
        { label: "3000 · Share capital",             amount: 10_000_000 },
        { label: "3500 · Retained earnings",         amount: 35_900_000 },
        { label: "3900 · Profit for the period",     amount:  3_140_500 },
      ],
      totalLabel: "Total credit",
    },
  ],
  notes: [
    "Trial balance ties: debits and credits both ₦71,361,400.",
  ],
};

// ----------------------------------------------------------------------
// Daybook (transactions export)
// ----------------------------------------------------------------------
const DAYBOOK: ReportTemplate = {
  shape: "daybook",
  title: "Daybook Export",
  subtitle: "April 2026 · all transactions, in date order",
  currencySymbol: "₦",
  net: {
    // Receipts 17,825,700 − payments 17,603,300
    label: "Net cash movement",
    amount: 222_400,
    caption: "Apr 2026 · receipts vs payments",
  },
  sections: [
    {
      kicker: "Money in",
      heading: "Receipts",
      rows: [
        { label: "01 Apr · Paystack settlement · PS-184",    amount:    482_300 },
        { label: "03 Apr · Wholesale order · WS-2041",       amount:  1_840_000 },
        { label: "05 Apr · Retail sales · POS-week-14",      amount:  2_120_900 },
        { label: "08 Apr · Service contract · INV-2052",     amount:    820_000 },
        { label: "12 Apr · Wholesale order · WS-2042",       amount:  3_240_000 },
        { label: "15 Apr · Paystack settlement · PS-188",    amount:    640_500 },
        { label: "18 Apr · Retail sales · POS-week-15",      amount:  2_840_000 },
        { label: "22 Apr · Wholesale order · WS-2043",       amount:  4_120_000 },
        { label: "25 Apr · Service contract · INV-2055",     amount:  1_240_000 },
        { label: "28 Apr · Paystack settlement · PS-194",    amount:    482_000 },
      ],
      totalLabel: "Total receipts",
    },
    {
      kicker: "Money out",
      heading: "Payments",
      rows: [
        { label: "02 Apr · Shoprite POS · COGS",             amount:   -640_000 },
        { label: "04 Apr · Salary run · PAYE batch",         amount: -8_420_000 },
        { label: "04 Apr · Pension remittance",              amount:   -842_000 },
        { label: "06 Apr · Diesel & generator",              amount:   -380_000 },
        { label: "08 Apr · Software & SaaS · monthly",       amount:   -612_400 },
        { label: "10 Apr · Inbound logistics",               amount:   -480_000 },
        { label: "14 Apr · Rent · Q2 advance",               amount: -1_950_000 },
        { label: "16 Apr · COGS — wholesale restock",        amount: -3_400_000 },
        { label: "20 Apr · Marketing — Meta ads",            amount:   -340_000 },
        { label: "23 Apr · Professional fees · audit",       amount:   -420_000 },
        { label: "27 Apr · Bank charges",                    amount:   -118_900 },
      ],
      totalLabel: "Total payments",
    },
  ],
};

// ----------------------------------------------------------------------
// Month-end pack — bundle of P&L + BS + CF + VAT
// ----------------------------------------------------------------------
const MONTHEND: ReportTemplate = {
  shape: "monthend",
  title: "Month-End Close Pack",
  subtitle: "April 2026 · for review & filing",
  currencySymbol: "₦",
  net: {
    label: "Profit before tax",
    amount: 19_308_600,
    caption: "Apr 2026 · in the green",
  },
  toc: [
    "Profit & Loss statement",
    "Balance Sheet snapshot",
    "Cashflow summary",
    "VAT return draft",
    "Outstanding items",
  ],
  sections: [
    {
      kicker: "Section 1",
      heading: "Profit & Loss — April 2026",
      rows: [
        { label: "Total revenue",                    amount: 57_498_800, emphasis: "subtotal" },
        { label: "Less: cost of sales",              amount: -24_662_400 },
        { label: "Gross profit",                     amount: 32_836_400, emphasis: "subtotal" },
        { label: "Less: operating expenses",         amount: -13_667_800 },
        { label: "Operating profit",                 amount: 19_168_600, emphasis: "subtotal" },
        { label: "Net interest & WHT",               amount:    140_000 },
      ],
      totalLabel: "Profit before tax",
    },
    {
      kicker: "Section 2",
      heading: "Balance Sheet — 30 April 2026",
      rows: [
        { label: "Total assets",                     amount: 73_602_400, emphasis: "subtotal" },
        { label: "Total liabilities",                amount: 27_483_500 },
        { label: "Total equity",                     amount: 49_040_500 },
      ],
      notes: undefined,
      totalLabel: "Liabilities + equity",
    } as ReportSection,
    {
      kicker: "Section 3",
      heading: "Cashflow summary — April 2026",
      rows: [
        { label: "Net cash from operations",         amount:  7_200_000 },
        { label: "Net cash from investing",          amount: -4_380_000 },
        { label: "Net cash from financing",          amount:    360_000 },
      ],
      totalLabel: "Net change in cash",
    },
    {
      kicker: "Section 4",
      heading: "VAT return draft — March 2026",
      rows: [
        { label: "Output VAT collected",             amount:  3_241_500 },
        { label: "Less: input VAT recoverable",      amount: -1_398_000 },
      ],
      totalLabel: "Net VAT payable to FIRS",
    },
    {
      kicker: "Section 5",
      heading: "Outstanding items",
      rows: [
        { label: "Receivables > 30 days overdue",    amount:  1_840_000 },
        { label: "Unreconciled bank lines",          raw: "12 items",  amount: 0 },
        { label: "Receipts pending review",          raw: "5 items",   amount: 0 },
      ],
    },
  ],
  notes: [
    "Sign off on this pack before filing. Each section links back to its full report inside Emiday.",
  ],
};

// ----------------------------------------------------------------------
// Lookup
// ----------------------------------------------------------------------
const TEMPLATES: Record<ReportShape, ReportTemplate> = {
  pl: PL,
  bs: BS,
  cf: CF,
  vat: VAT,
  pay: PAY,
  tb: TB,
  daybook: DAYBOOK,
  monthend: MONTHEND,
};

export function getReportTemplate(shape: string): ReportTemplate | null {
  if (shape in TEMPLATES) return TEMPLATES[shape as ReportShape];
  return null;
}

/** Re-exported helper so renderers don't need to inline it. */
export { sumRows };
