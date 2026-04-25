export type InvoiceStatus = "draft" | "sent" | "overdue" | "paid" | "void";

export type Invoice = {
  id: string;
  client: string;
  initial: string;
  sector: string;
  issued: string;
  due: string;
  daysLeft: number; // negative = overdue
  amount: number;
  status: InvoiceStatus;
};

export const INVOICES: Invoice[] = [
  { id: "INV-2051", client: "Kadara Foods Ltd",      initial: "K", sector: "F&B",       issued: "18 Apr", due: "2 May",  daysLeft: 8,   amount: 4850000, status: "sent" },
  { id: "INV-2050", client: "Flux Labs",              initial: "F", sector: "Software",  issued: "15 Apr", due: "29 Apr", daysLeft: 5,   amount: 1250000, status: "sent" },
  { id: "INV-2049", client: "Sote Logistics",         initial: "S", sector: "Logistics", issued: "10 Apr", due: "24 Apr", daysLeft: 0,   amount: 2600000, status: "overdue" },
  { id: "INV-2048", client: "Harmattan Studio",       initial: "H", sector: "Creative",  issued: "8 Apr",  due: "22 Apr", daysLeft: -2,  amount: 420000,  status: "overdue" },
  { id: "INV-2047", client: "Amaiya Wellness",        initial: "A", sector: "Health",    issued: "1 Apr",  due: "15 Apr", daysLeft: -9,  amount: 630000,  status: "paid" },
  { id: "INV-2046", client: "Orin & Co.",             initial: "O", sector: "Fashion",   issued: "28 Mar", due: "11 Apr", daysLeft: -13, amount: 980000,  status: "paid" },
  { id: "INV-2045", client: "Nkem Textiles",          initial: "N", sector: "Manuf.",    issued: "25 Mar", due: "8 Apr",  daysLeft: -16, amount: 1870000, status: "paid" },
  { id: "INV-2044", client: "Zuma Farms",             initial: "Z", sector: "Agri",      issued: "20 Apr", due: "—",      daysLeft: 0,   amount: 750000,  status: "draft" },
  { id: "INV-2043", client: "Flux Labs",              initial: "F", sector: "Software",  issued: "1 Mar",  due: "15 Mar", daysLeft: -40, amount: 1250000, status: "void" },
];
