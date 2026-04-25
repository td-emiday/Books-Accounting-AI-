export type DocumentCategory = "receipt" | "tax" | "contract" | "report" | "payroll" | "other";
export type DocumentSource = "upload" | "whatsapp" | "email" | "generated";

export type Document = {
  id: number;
  name: string;
  category: DocumentCategory;
  date: string;
  size: string;
  source: DocumentSource;
  client?: string;
};

export const DOCUMENTS: Document[] = [
  { id: 1,  name: "VAT Return – March 2026.pdf",           category: "tax",      date: "18 Apr", size: "142 KB", source: "generated" },
  { id: 2,  name: "April Payroll Summary.xlsx",             category: "payroll",  date: "16 Apr", size: "88 KB",  source: "generated" },
  { id: 3,  name: "Shoprite Receipt – 18 Apr.jpg",          category: "receipt",  date: "18 Apr", size: "1.1 MB", source: "whatsapp",  client: "Kadara Foods Ltd" },
  { id: 4,  name: "Terra Kulture Lunch – 17 Apr.jpg",       category: "receipt",  date: "17 Apr", size: "840 KB", source: "whatsapp" },
  { id: 5,  name: "Ikeja Electric Meter 0442-XL.pdf",       category: "receipt",  date: "13 Apr", size: "56 KB",  source: "email" },
  { id: 6,  name: "Abdul & Co. Invoice 1142.pdf",           category: "contract", date: "11 Apr", size: "210 KB", source: "email" },
  { id: 7,  name: "Arik Air LOS-ABV 2 pax.pdf",             category: "receipt",  date: "12 Apr", size: "320 KB", source: "email" },
  { id: 8,  name: "Q1 2026 Cashflow Statement.pdf",         category: "report",   date: "1 Apr",  size: "204 KB", source: "generated" },
  { id: 9,  name: "Figma Annual Receipt – Apr 2026.pdf",    category: "receipt",  date: "14 Apr", size: "78 KB",  source: "email" },
  { id: 10, name: "Kadara Foods – Office Lease Renewal.pdf",category: "contract", date: "3 Apr",  size: "1.8 MB", source: "upload",    client: "Kadara Foods Ltd" },
  { id: 11, name: "PAYE Certificate – Q1 2026.pdf",         category: "tax",      date: "31 Mar", size: "92 KB",  source: "generated" },
  { id: 12, name: "Balance Sheet – 18 Apr 2026.pdf",        category: "report",   date: "18 Apr", size: "188 KB", source: "generated" },
];
