// Generate a realistic 8-month GTBank-style statement PDF for a
// fictional Nigerian SME ("Kadara Foods Ltd"). Output is plain-text
// PDFKit (not rasterised) so pdf-parse extracts every row cleanly,
// which is exactly the input shape /api/upload/statement expects.
//
//   npx tsx scripts/generate-sample-statement.ts
//
// Writes to public/samples/kadara-foods-gtbank-statement.pdf
//
// Override with env: BUSINESS_NAME, MONTHS, ACCOUNT_NUMBER, OUTPUT_PATH.
// Same RNG seed each run so the file is deterministic for demos.

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const BUSINESS_NAME = process.env.BUSINESS_NAME ?? "KADARA FOODS LIMITED";
const ACCOUNT_NUMBER = process.env.ACCOUNT_NUMBER ?? "0123456789";
const MONTHS = Number(process.env.MONTHS ?? "8");
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ??
  path.join("public", "samples", "kadara-foods-gtbank-statement.pdf");

// Deterministic RNG so each run produces the same statement. Mulberry32.
function makeRng(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260516);

// ───────────────────── Domain model ─────────────────────

type Txn = {
  date: Date;
  valueDate: Date;
  ref: string;
  description: string;
  debit: number;    // outflow, > 0 when applicable
  credit: number;   // inflow,  > 0 when applicable
};

function fmt(n: number): string {
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: Date): string {
  // GTBank prints "DD-MMM-YY" — use that. Common alternative is
  // DD/MM/YYYY; both round-trip cleanly through the LLM extractor.
  const months = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = months[d.getMonth()];
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}-${mm}-${yy}`;
}

function ref(prefix: string): string {
  const n = Math.floor(rng() * 1_000_000_000);
  return `${prefix}/${String(n).padStart(9, "0")}`;
}

function chance(p: number): boolean {
  return rng() < p;
}

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)];
}

function jitter(base: number, pct = 0.25): number {
  const j = 1 + (rng() * 2 - 1) * pct;
  return Math.round(base * j);
}

// ───────────────────── Vendor universe ─────────────────────
// All names are realistic for a Nigerian food/catering SME in Lagos.

const PAYSTACK_CUSTOMERS = [
  "PAYSTACK/TRF/CHIBUEZE OKONKWO",
  "PAYSTACK/TRF/FOLAKE ADESANYA",
  "PAYSTACK/TRF/HOTEL PRESIDENTIAL VI",
  "PAYSTACK/TRF/EKO HOTELS CATERING",
  "PAYSTACK/TRF/MTN NIGERIA EVENTS",
  "PAYSTACK/TRF/ACCESS BANK EVENT",
  "PAYSTACK/TRF/CHINELO ANYANWU",
  "PAYSTACK/TRF/TUNDE BELLO",
  "PAYSTACK/TRF/ZARINA EVENTS",
  "PAYSTACK/TRF/IBUKUN OYINLOLA",
];

const FLUTTERWAVE_CUSTOMERS = [
  "FLUTTERWAVE/PAY/UBER EATS PAYOUT",
  "FLUTTERWAVE/PAY/CHOWDECK PAYOUT",
  "FLUTTERWAVE/PAY/JUMIA FOOD",
  "FLUTTERWAVE/PAY/GLOVO LAGOS",
  "FLUTTERWAVE/PAY/HEELLO ORDER",
];

const SUPPLIERS = [
  { name: "SAHAD STORES IKEJA", min: 22_000, max: 180_000 },
  { name: "EBEANO SUPERMARKET LEKKI", min: 35_000, max: 240_000 },
  { name: "SPAR ILUPEJU", min: 18_000, max: 120_000 },
  { name: "SHOPRITE SURULERE", min: 25_000, max: 150_000 },
  { name: "MILE 12 FOODSTUFF MKT", min: 80_000, max: 420_000 },
  { name: "OLOWORA POULTRY FARMS", min: 60_000, max: 220_000 },
  { name: "OYINGBO FISH MARKET", min: 40_000, max: 180_000 },
  { name: "OBJ FARMS BUTCHERY", min: 90_000, max: 380_000 },
];

const STAFF = [
  "ADAEZE O", "TUNDE A", "FATIMA Y", "EMEKA C", "BLESSING N",
  "KENNY B", "AMARA U", "SEUN A", "PRECIOUS E", "MUSA D",
  "GBENGA F", "OLUWASEGUN T", "MARYAM J", "ESTHER N",
];

const SOFTWARE = [
  { name: "GOOGLE/WORKSPACE",  base: 18_500 },
  { name: "MICROSOFT/M365",    base: 22_000 },
  { name: "SLACK TECHNOLOGIES", base: 14_300 },
  { name: "NOTION LABS",        base: 9_800 },
  { name: "QUICKBOOKS NG",      base: 16_200 },
  { name: "ZOOM VIDEO COMMS",   base: 12_100 },
];

const FUEL_STATIONS = [
  "TOTAL ENERGIES VI",
  "OANDO LEKKI EPE",
  "MOBIL OPEBI",
  "NNPC RETAIL IKOYI",
  "ARDOVA AJAH",
];

const POS_PURCHASES = [
  { name: "GOKADA RIDE LEKKI",        base: 3_800 },
  { name: "MAX.NG DELIVERY",           base: 4_200 },
  { name: "FOODCO RESTAURANT IKEJA",   base: 18_500 },
  { name: "TERRA KULTURE TICKETS",     base: 24_000 },
  { name: "KIKI'S FOODS VI",           base: 12_000 },
];

// ───────────────────── Transaction generators ─────────────────────

function genMonthly(year: number, month: number, opening: number): Txn[] {
  const rows: Txn[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 1. RENT — 1st of each month
  rows.push({
    date: new Date(year, month, 1, 9, 0),
    valueDate: new Date(year, month, 1, 9, 0),
    ref: ref("NIP/TRF"),
    description: "TRF/RENT-LEKKI PHASE 1/CRESCENT PROPERTIES LTD",
    debit: 450_000,
    credit: 0,
  });

  // 2. PAYROLL — between 25th and 28th, split per staff member
  const payDay = 25 + Math.floor(rng() * 3);
  for (const name of STAFF) {
    const salary = jitter(120_000, 0.4);
    rows.push({
      date: new Date(year, month, Math.min(payDay, daysInMonth), 12, 0),
      valueDate: new Date(year, month, Math.min(payDay, daysInMonth), 12, 0),
      ref: ref("PAYROLL"),
      description: `SALARY/${name}/${monthName(month)} ${year}`,
      debit: salary,
      credit: 0,
    });
  }

  // 3. INTERNET — Spectranet, 5th
  rows.push({
    date: new Date(year, month, 5),
    valueDate: new Date(year, month, 5),
    ref: ref("WEB"),
    description: "SPECTRANET LIMITED/INTERNET SUB",
    debit: 35_500,
    credit: 0,
  });

  // 4. DIESEL — twice a month (Lagos generator life)
  for (const day of [8, 22]) {
    rows.push({
      date: new Date(year, month, Math.min(day, daysInMonth)),
      valueDate: new Date(year, month, Math.min(day, daysInMonth)),
      ref: ref("POS"),
      description: pick(["AP DIESEL DELIVERY LEKKI", "DIESEL/IBETO PETROL"]),
      debit: jitter(180_000, 0.3),
      credit: 0,
    });
  }

  // 5. SOFTWARE subs — 3-5 per month
  const subs = [...SOFTWARE].sort(() => rng() - 0.5).slice(0, 3 + Math.floor(rng() * 3));
  for (const s of subs) {
    rows.push({
      date: new Date(year, month, 3 + Math.floor(rng() * 25)),
      valueDate: new Date(year, month, 3 + Math.floor(rng() * 25)),
      ref: ref("CARD"),
      description: `WEB SUB/${s.name}`,
      debit: jitter(s.base, 0.1),
      credit: 0,
    });
  }

  // 6. SUPPLIERS — 12-22 per month
  const supplierCount = 12 + Math.floor(rng() * 11);
  for (let i = 0; i < supplierCount; i++) {
    const s = pick(SUPPLIERS);
    const day = 1 + Math.floor(rng() * daysInMonth);
    const amt = Math.round(s.min + rng() * (s.max - s.min));
    rows.push({
      date: new Date(year, month, day),
      valueDate: new Date(year, month, day),
      ref: ref("POS"),
      description: `POS PURCH/${s.name}`,
      debit: amt,
      credit: 0,
    });
  }

  // 7. FUEL — 4-6 per month
  for (let i = 0; i < 4 + Math.floor(rng() * 3); i++) {
    const day = 1 + Math.floor(rng() * daysInMonth);
    rows.push({
      date: new Date(year, month, day),
      valueDate: new Date(year, month, day),
      ref: ref("POS"),
      description: `POS FUEL/${pick(FUEL_STATIONS)}`,
      debit: jitter(28_000, 0.4),
      credit: 0,
    });
  }

  // 8. RIDE/MISC — 3-6 per month
  for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) {
    const m = pick(POS_PURCHASES);
    const day = 1 + Math.floor(rng() * daysInMonth);
    rows.push({
      date: new Date(year, month, day),
      valueDate: new Date(year, month, day),
      ref: ref("POS"),
      description: `POS PURCH/${m.name}`,
      debit: jitter(m.base, 0.4),
      credit: 0,
    });
  }

  // 9. BANK CHARGES — VAT + COT type
  rows.push({
    date: new Date(year, month, daysInMonth - 1),
    valueDate: new Date(year, month, daysInMonth - 1),
    ref: ref("CHG"),
    description: "MAINT FEE + VAT",
    debit: 1_350,
    credit: 0,
  });
  rows.push({
    date: new Date(year, month, daysInMonth - 1),
    valueDate: new Date(year, month, daysInMonth - 1),
    ref: ref("CHG"),
    description: "STAMP DUTY",
    debit: 50,
    credit: 0,
  });

  // 10. TAX REMITTANCE — 20th (VAT) and 10th (PAYE)
  rows.push({
    date: new Date(year, month, 20),
    valueDate: new Date(year, month, 20),
    ref: ref("FIRS"),
    description: `FIRS-VAT REMITTANCE/${monthName((month + 11) % 12)} ${year}`,
    debit: jitter(180_000, 0.4),
    credit: 0,
  });
  rows.push({
    date: new Date(year, month, 10),
    valueDate: new Date(year, month, 10),
    ref: ref("LIRS"),
    description: `LIRS PAYE/${monthName((month + 11) % 12)} ${year}`,
    debit: jitter(95_000, 0.3),
    credit: 0,
  });

  // 11. PAYSTACK INFLOWS — most days, sometimes multiple
  for (let day = 1; day <= daysInMonth; day++) {
    // ~70% of days have a settlement
    if (chance(0.7)) {
      const n = 1 + Math.floor(rng() * 3); // 1-3 settlements
      for (let i = 0; i < n; i++) {
        const inflow = jitter(60_000, 0.7);
        rows.push({
          date: new Date(year, month, day),
          valueDate: new Date(year, month, day),
          ref: ref("PSK"),
          description: pick(PAYSTACK_CUSTOMERS),
          debit: 0,
          credit: Math.max(8_000, inflow),
        });
      }
    }
  }

  // 12. FLUTTERWAVE INFLOWS — ~3 per week
  for (let i = 0; i < 12 + Math.floor(rng() * 4); i++) {
    const day = 1 + Math.floor(rng() * daysInMonth);
    rows.push({
      date: new Date(year, month, day),
      valueDate: new Date(year, month, day),
      ref: ref("FLW"),
      description: pick(FLUTTERWAVE_CUSTOMERS),
      debit: 0,
      credit: jitter(45_000, 0.6),
    });
  }

  // 13. LARGE CUSTOMER PAYMENT — 1-2 per month
  for (let i = 0; i < 1 + Math.floor(rng() * 2); i++) {
    const day = 1 + Math.floor(rng() * daysInMonth);
    rows.push({
      date: new Date(year, month, day, 10, 0),
      valueDate: new Date(year, month, day, 10, 0),
      ref: ref("NIP/IN"),
      description: pick([
        "NIP/IN/MTN NIGERIA/EVENT CATERING INV-238",
        "NIP/IN/DANGOTE FOUNDATION/CATERING JUNE",
        "NIP/IN/STERLING BANK/STAFF LUNCH",
        "NIP/IN/INTERSWITCH NIG/EOY PARTY",
        "NIP/IN/ZENITH ASSET MGT/QUARTERLY LUNCHEON",
      ]),
      debit: 0,
      credit: jitter(850_000, 0.4),
    });
  }

  // Sort the month chronologically (and by ascending intra-day to
  // keep payroll-after-purchases ordering realistic).
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  return rows;
}

function monthName(m: number): string {
  return ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][m];
}

// ───────────────────── Build the document ─────────────────────

function build(): { txns: Txn[]; opening: number; closing: number; period: { start: Date; end: Date } } {
  const today = new Date(2026, 4, 16); // 16 May 2026
  // First day of (today - MONTHS) months ago.
  const startMonth = today.getMonth() - (MONTHS - 1);
  const start = new Date(today.getFullYear(), startMonth, 1);
  const opening = 1_250_000;

  let bal = opening;
  const txns: Txn[] = [];

  for (let i = 0; i < MONTHS; i++) {
    const d = new Date(today.getFullYear(), startMonth + i, 1);
    const monthRows = genMonthly(d.getFullYear(), d.getMonth(), bal);
    for (const r of monthRows) {
      bal = bal - r.debit + r.credit;
    }
    txns.push(...monthRows);
  }

  const end = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
  return { txns, opening, closing: bal, period: { start, end } };
}

function render(out: string, payload: ReturnType<typeof build>) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 36, bottom: 36, left: 28, right: 28 },
    info: {
      Title: `Statement — ${BUSINESS_NAME}`,
      Author: "Guaranty Trust Bank",
      Subject: "Account statement",
    },
  });
  doc.pipe(fs.createWriteStream(out));

  // ── Header
  doc.fillColor("#a3621d").font("Helvetica-Bold").fontSize(20).text("GTBank", { continued: false });
  doc.fillColor("#5a5a66").font("Helvetica").fontSize(9).text("Guaranty Trust Bank plc · Plot 635, Akin Adesola Street, Victoria Island, Lagos");
  doc.moveDown(0.6);

  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(14).text("Statement of Account");
  doc.moveDown(0.4);

  // Customer block
  const startY = doc.y;
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(10).text(BUSINESS_NAME);
  doc.font("Helvetica").fontSize(9).fillColor("#5a5a66");
  doc.text("23 Adeola Odeku Street");
  doc.text("Victoria Island, Lagos");
  doc.text("Nigeria");

  // Right column: account info
  const rightX = 360;
  doc.fillColor("#5a5a66").font("Helvetica").fontSize(8).text("ACCOUNT NUMBER", rightX, startY);
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(10).text(ACCOUNT_NUMBER, rightX, startY + 11);
  doc.fillColor("#5a5a66").font("Helvetica").fontSize(8).text("CURRENCY", rightX, startY + 28);
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(10).text("NGN — Naira", rightX, startY + 39);
  doc.fillColor("#5a5a66").font("Helvetica").fontSize(8).text("PERIOD", rightX, startY + 56);
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(10).text(
    `${fmtDate(payload.period.start)} to ${fmtDate(payload.period.end)}`,
    rightX,
    startY + 67,
  );

  doc.moveDown(2);

  // ── Summary box
  const totals = payload.txns.reduce(
    (acc, t) => ({
      dr: acc.dr + t.debit,
      cr: acc.cr + t.credit,
      n: acc.n + 1,
    }),
    { dr: 0, cr: 0, n: 0 },
  );

  const sumY = doc.y;
  doc.rect(28, sumY, 540, 50).fillColor("#fafaf6").fill();
  doc.fillColor("#5a5a66").font("Helvetica").fontSize(8);
  doc.text("OPENING BALANCE",  40, sumY + 8);
  doc.text("TOTAL CREDITS",   175, sumY + 8);
  doc.text("TOTAL DEBITS",    310, sumY + 8);
  doc.text("CLOSING BALANCE", 445, sumY + 8);
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(13);
  doc.text(`NGN ${fmt(payload.opening)}`,  40, sumY + 22);
  doc.text(`NGN ${fmt(totals.cr)}`,        175, sumY + 22);
  doc.text(`NGN ${fmt(totals.dr)}`,        310, sumY + 22);
  doc.text(`NGN ${fmt(payload.closing)}`,  445, sumY + 22);

  doc.y = sumY + 60;
  doc.moveDown(0.8);

  // ── Transaction table
  const cols = {
    transDate: 30,
    valueDate: 92,
    reference: 152,
    description: 248,
    debit: 410,
    credit: 470,
    balance: 530,
  } as const;

  const headerY = doc.y;
  doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(8.5);
  doc.text("Trans Date",  cols.transDate,   headerY);
  doc.text("Value Date",  cols.valueDate,   headerY);
  doc.text("Reference",   cols.reference,   headerY);
  doc.text("Description", cols.description, headerY);
  doc.text("Debit",       cols.debit,       headerY, { width: 56, align: "right" });
  doc.text("Credit",      cols.credit,      headerY, { width: 56, align: "right" });
  doc.text("Balance",     cols.balance,     headerY, { width: 56, align: "right" });
  doc.moveTo(28, headerY + 14).lineTo(596, headerY + 14).strokeColor("#0d0d10").lineWidth(0.8).stroke();
  doc.y = headerY + 18;

  doc.fillColor("#0d0d10").font("Helvetica").fontSize(7.5);

  let bal = payload.opening;
  for (const t of payload.txns) {
    bal = bal - t.debit + t.credit;

    // New page check
    if (doc.y > 770) {
      doc.addPage();
      // Reprint header row on each page
      const ny = doc.y;
      doc.fillColor("#0d0d10").font("Helvetica-Bold").fontSize(8.5);
      doc.text("Trans Date",  cols.transDate,   ny);
      doc.text("Value Date",  cols.valueDate,   ny);
      doc.text("Reference",   cols.reference,   ny);
      doc.text("Description", cols.description, ny);
      doc.text("Debit",       cols.debit,       ny, { width: 56, align: "right" });
      doc.text("Credit",      cols.credit,      ny, { width: 56, align: "right" });
      doc.text("Balance",     cols.balance,     ny, { width: 56, align: "right" });
      doc.moveTo(28, ny + 14).lineTo(596, ny + 14).strokeColor("#0d0d10").lineWidth(0.8).stroke();
      doc.y = ny + 18;
      doc.font("Helvetica").fontSize(7.5).fillColor("#0d0d10");
    }

    const rowY = doc.y;
    doc.text(fmtDate(t.date),       cols.transDate,   rowY, { width: 58 });
    doc.text(fmtDate(t.valueDate),  cols.valueDate,   rowY, { width: 58 });
    doc.text(t.ref,                 cols.reference,   rowY, { width: 92 });
    doc.text(t.description,         cols.description, rowY, { width: 160 });
    doc.text(t.debit  ? fmt(t.debit)  : "",  cols.debit,   rowY, { width: 56, align: "right" });
    doc.text(t.credit ? fmt(t.credit) : "",  cols.credit,  rowY, { width: 56, align: "right" });
    doc.text(fmt(bal),                       cols.balance, rowY, { width: 56, align: "right" });

    // Compute the row height as the tallest column rendered. PDFKit
    // moves doc.y for the last column only, so we explicitly bump by
    // the description height which is usually the tallest.
    const descH = doc.heightOfString(t.description, { width: 160 });
    doc.y = rowY + Math.max(10, descH) + 2;
  }

  // Footer
  doc.moveDown(1);
  doc.fillColor("#5a5a66").font("Helvetica-Oblique").fontSize(7.5);
  doc.text(
    "This is a computer-generated statement and does not require a signature. " +
    "Please report discrepancies within 14 days to gtconnect@gtbank.com.",
    28,
    undefined,
    { width: 540 },
  );

  doc.end();
}

function main() {
  const payload = build();
  render(OUTPUT_PATH, payload);
  console.log(
    `✔ Wrote ${OUTPUT_PATH} — ${payload.txns.length} transactions ` +
    `(${fmtDate(payload.period.start)} → ${fmtDate(payload.period.end)})`,
  );
}

main();
