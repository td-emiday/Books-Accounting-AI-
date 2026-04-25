export type ClientStatus = "ok" | "warn" | "late";

export type Client = {
  id: number;
  name: string;
  sector: string;
  owner: string;
  reconciled: number;
  toReview: number;
  nextDue: string;
  revenue: number;
  status: ClientStatus;
};

export const CLIENTS: Client[] = [
  { id: 1, name: "Kadara Foods Ltd", sector: "F&B · Lagos", owner: "Adaeze O.", reconciled: 98, toReview: 2, nextDue: "VAT · 21 Apr", revenue: 48220500, status: "ok" },
  { id: 2, name: "Flux Labs", sector: "Software · Abuja", owner: "Chuka I.", reconciled: 100, toReview: 0, nextDue: "PAYE · 30 Apr", revenue: 12450000, status: "ok" },
  { id: 3, name: "Orin & Co.", sector: "Fashion retail · Lagos", owner: "Tolu A.", reconciled: 82, toReview: 14, nextDue: "VAT · 21 Apr", revenue: 9820000, status: "warn" },
  { id: 4, name: "Sote Logistics", sector: "Logistics · PH", owner: "Ibrahim M.", reconciled: 94, toReview: 4, nextDue: "WHT · 25 Apr", revenue: 26100000, status: "ok" },
  { id: 5, name: "Nkem Textiles", sector: "Manufacturing · Aba", owner: "Chioma N.", reconciled: 76, toReview: 22, nextDue: "CIT · 30 Jun", revenue: 18640000, status: "warn" },
  { id: 6, name: "Amaiya Wellness", sector: "Health · Lagos", owner: "Gbenga B.", reconciled: 100, toReview: 0, nextDue: "Pension · 30 Apr", revenue: 6280000, status: "ok" },
  { id: 7, name: "Harmattan Studio", sector: "Creative · Lagos", owner: "Ayo K.", reconciled: 91, toReview: 3, nextDue: "VAT · 21 Apr", revenue: 4140000, status: "ok" },
  { id: 8, name: "Zuma Farms", sector: "Agri · Kaduna", owner: "Hauwa S.", reconciled: 64, toReview: 38, nextDue: "PAYE · overdue", revenue: 15720000, status: "late" },
];

// Combined-revenue delta vs prior month, surfaced on the "AUM this month" KPI.
export const CLIENTS_AUM_DELTA_PCT = 8.2;
