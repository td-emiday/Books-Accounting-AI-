export type TaxItem = {
  id: string;
  d: string;
  m: string;
  name: string;
  desc: string;
  due: string;
  dueKind: "warn" | "neutral" | "up";
  amount: number;
  authority: string;
  account: string;
  ref: string;
  primary?: string;
  payable?: boolean;
  draft?: boolean;
  scheduled?: boolean;
};

export const TAX_ITEMS: TaxItem[] = [
  {
    id: "vat",
    d: "21",
    m: "Apr",
    name: "VAT Return · March 2026",
    desc: "Form VAT-002 · FIRS · sales ₦42.1M · input credit ₦1.8M",
    due: "Due in 6 days",
    dueKind: "warn",
    amount: 3241500,
    authority: "FIRS",
    account: "0110032213 · CBN TSA",
    ref: "VAT-002/03-26",
    primary: "Review & file",
    payable: true,
    draft: true,
  },
  {
    id: "paye",
    d: "30",
    m: "Apr",
    name: "PAYE Remittance · April",
    desc: "Lagos IRS · 42 employees · payroll ₦4.82M",
    due: "Due in 15 days",
    dueKind: "neutral",
    amount: 1051000,
    authority: "Lagos IRS",
    account: "1015600121 · Zenith Bank",
    ref: "PAYE/APR-26",
    primary: "Prepare",
    payable: true,
  },
  {
    id: "pen",
    d: "30",
    m: "Apr",
    name: "Pension (PenCom)",
    desc: "Stanbic IBTC Pensions · 18% combined · 42 employees",
    due: "Auto-debit armed",
    dueKind: "up",
    amount: 864200,
    authority: "Stanbic IBTC",
    account: "Auto-debit · GTBank **2041",
    ref: "PEN/APR-26",
    scheduled: true,
  },
  {
    id: "cit",
    d: "30",
    m: "Jun",
    name: "Companies Income Tax · Q2 estimate",
    desc: "FIRS · estimated chargeable profit ₦21.2M @ 20%",
    due: "Due in 72 days",
    dueKind: "neutral",
    amount: 2120400,
    authority: "FIRS",
    account: "0110032213 · CBN TSA",
    ref: "CIT/Q2-26",
    payable: true,
  },
];

export type PaymentSource = {
  id: string;
  name: string;
  sub: string;
  bal: number | null;
};

export const PAYMENT_SOURCES: PaymentSource[] = [
  { id: "gtbank", name: "GTBank Business", sub: "**2041 · Operating", bal: 28420000 },
  { id: "zenith", name: "Zenith Collections", sub: "**8812 · Paystack settlements", bal: 12208000 },
  { id: "card", name: "Corporate Card", sub: "Mastercard **1144", bal: null },
];
