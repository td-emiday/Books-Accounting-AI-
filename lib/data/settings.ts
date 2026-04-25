// Seed data for every Settings tab.
// Profile data reuses lib/data/workspace.ts (single source of truth).

export type ConnectedBank = {
  name: string;
  acct: string;
  status: "active" | "reauth";
  synced: string;
  txns: number;
  color: string;
};

export const CONNECTED_BANKS: ConnectedBank[] = [
  { name: "GTBank Business",     acct: "**2041 · Current",       status: "active", synced: "4 min ago",  txns: 412, color: "#ea8128" },
  { name: "Zenith Collections",  acct: "**8812 · Paystack",      status: "active", synced: "12 min ago", txns: 189, color: "#1c2c66" },
  { name: "Access Payroll",      acct: "**4417 · Disbursement",  status: "active", synced: "2 hrs ago",  txns: 44,  color: "#f28e1c" },
  { name: "Stanbic USD",         acct: "**9001 · USD",           status: "reauth", synced: "3 days ago", txns: 12,  color: "#0033a0" },
];

export type TaxProfile = {
  tin: string;
  vatReg: string;
  vatStatusNote: string; // "Registered · obliged to charge 7.5%"
  taxOffice: string;
  stateAuthority: string;
};

export const TAX_PROFILE: TaxProfile = {
  tin: "1488-2011-8402",
  vatReg: "VAT-20110832",
  vatStatusNote: "Registered · obliged to charge 7.5%",
  taxOffice: "FIRS · Victoria Island MTO",
  stateAuthority: "Lagos Internal Revenue Service (LIRS)",
};

export type TeamMember = {
  name: string;
  email: string;
  role: "Owner" | "Finance lead" | "Bookkeeper" | "External accountant";
  avatarColor: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Adaeze Okafor",          email: "adaeze@kadarafoods.ng",   role: "Owner",               avatarColor: "#d8d2c4" },
  { name: "Ibrahim Yusuf",          email: "ibrahim@kadarafoods.ng",  role: "Finance lead",        avatarColor: "#c4d8d2" },
  { name: "Chioma Eze",             email: "chioma@kadarafoods.ng",   role: "Bookkeeper",          avatarColor: "#d2c4d8" },
  { name: "Tunde Bakare (ext.)",    email: "tunde@bakareandco.ng",    role: "External accountant", avatarColor: "#d8c4c4" },
];

export type Integration = {
  name: string;
  desc: string;
  connected: boolean;
};

export const INTEGRATIONS: Integration[] = [
  { name: "Paystack",     desc: "Ingest settlements & refunds",    connected: true  },
  { name: "Flutterwave",  desc: "Cards, transfers, payouts",       connected: false },
  { name: "SeerBit",      desc: "POS terminal reconciliation",     connected: false },
  { name: "QuickBooks",   desc: "One-way export of journals",      connected: true  },
  { name: "Google Drive", desc: "Sync receipts & documents",       connected: true  },
  { name: "Slack",        desc: "Daily digest & alerts",           connected: false },
];

export type PlanInfo = {
  tier: string;           // "Business"
  monthly: number;        // 62000
  renewDate: string;
  billingAccount: string; // "GTBank **2041"
};

export const PLAN: PlanInfo = {
  tier: "Business",
  monthly: 62_000,
  renewDate: "16 May 2026",
  billingAccount: "GTBank **2041",
};

export type UsageStats = {
  txnsProcessed: number;
  txnsIncluded: number;
  accountsConnected: number;
  accountsIncluded: number;
  filingsPaid: number;
};

export const USAGE: UsageStats = {
  txnsProcessed: 1_248,
  txnsIncluded: 2_000,
  accountsConnected: 4,
  accountsIncluded: 5,
  filingsPaid: 3,
};

export type BillingInvoice = {
  period: string;
  number: string;
  amount: number;
  status: "paid";
};

export const BILLING_INVOICES: BillingInvoice[] = [
  { period: "Apr 2026", number: "INV-0042", amount: 62_000, status: "paid" },
  { period: "Mar 2026", number: "INV-0041", amount: 62_000, status: "paid" },
  { period: "Feb 2026", number: "INV-0040", amount: 62_000, status: "paid" },
];

export type DeviceSession = {
  device: string;
  location: string;
  when: string;
  current: boolean;
};

export const DEVICE_SESSIONS: DeviceSession[] = [
  { device: "MacBook Pro · Chrome",     location: "Lagos, NG",   when: "Active now",    current: true  },
  { device: "iPhone 15 · Emiday app",   location: "Lagos, NG",   when: "2 hours ago",   current: false },
  { device: "iPad · Safari",            location: "Abuja, NG",   when: "Yesterday",     current: false },
];
