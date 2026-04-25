export type ReportShape = "pl" | "bs" | "cf" | "vat" | "pay" | "tb";
export type ReportStatus = "ready" | "draft";

export type Report = {
  title: string;
  date: string;
  status: ReportStatus;
  shape: ReportShape;
};

export const REPORTS: Report[] = [
  { title: "Profit & Loss", date: "Auto-generated · Apr 1–18", status: "ready", shape: "pl" },
  { title: "Balance Sheet", date: "Snapshot · 18 Apr 2026", status: "ready", shape: "bs" },
  { title: "Cashflow Statement", date: "Q1 2026 · final", status: "ready", shape: "cf" },
  { title: "VAT Return", date: "Draft · March 2026", status: "draft", shape: "vat" },
  { title: "Payroll Summary", date: "Apr 2026 · 42 employees", status: "ready", shape: "pay" },
  { title: "Trial Balance", date: "Period-end · 31 Mar", status: "ready", shape: "tb" },
];
