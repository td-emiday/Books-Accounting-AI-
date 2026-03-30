import type { Transaction, TaxDeadline, VATReturn, WHTSummary, PAYEResult } from '@/types';

export const NIGERIA_VAT_RATE = 0.075; // 7.5%

export const WHT_RATES: Record<string, number> = {
  'Professional Services': 0.10,
  'Technical Services': 0.10,
  'Legal Fees': 0.10,
  'Accounting Fees': 0.10,
  'Consulting Fees': 0.10,
  'Management Fees': 0.10,
  'Rent': 0.10,
  'Office Rent': 0.10,
  'Commission': 0.10,
  'Dividends': 0.10,
  'Interest': 0.10,
  'Construction': 0.05,
  'Supply of Goods': 0.05,
};

export function calculateVAT(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): VATReturn {
  const inPeriod = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });

  const outputTax = inPeriod
    .filter(t => t.type === 'INCOME' && t.vatApplicable)
    .reduce((sum, t) => sum + (t.amount * NIGERIA_VAT_RATE), 0);

  const inputTax = inPeriod
    .filter(t => t.type === 'EXPENSE' && t.vatApplicable)
    .reduce((sum, t) => sum + (t.amount * NIGERIA_VAT_RATE), 0);

  return {
    outputTax: Math.round(outputTax * 100) / 100,
    inputTax: Math.round(inputTax * 100) / 100,
    netPayable: Math.round(Math.max(0, outputTax - inputTax) * 100) / 100,
    period: { startDate, endDate },
    transactions: inPeriod.filter(t => t.vatApplicable),
  };
}

export function calculateWHT(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): WHTSummary {
  const WHT_THRESHOLD = 10000;

  const whtTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return (
      t.type === 'EXPENSE' &&
      t.whtApplicable &&
      t.amount >= WHT_THRESHOLD &&
      d >= startDate &&
      d <= endDate
    );
  });

  return {
    transactions: whtTransactions.map(t => ({
      ...t,
      whtAmount: Math.round(t.amount * (t.whtRate ?? 0.10) * 100) / 100,
    })),
    totalWHTDeducted: Math.round(
      whtTransactions.reduce(
        (sum, t) => sum + (t.amount * (t.whtRate ?? 0.10)),
        0
      ) * 100
    ) / 100,
    period: { startDate, endDate },
  };
}

export const NIGERIA_PAYE_BANDS = [
  { limit: 300_000, rate: 0.07 },
  { limit: 300_000, rate: 0.11 },
  { limit: 500_000, rate: 0.15 },
  { limit: 500_000, rate: 0.19 },
  { limit: 1_600_000, rate: 0.21 },
  { limit: Infinity, rate: 0.24 },
];

export function calculatePAYE(grossMonthlySalary: number): PAYEResult {
  const grossAnnual = grossMonthlySalary * 12;

  const pension = grossAnnual * 0.08;
  const nhis = grossAnnual * 0.05;
  const nhf = grossAnnual * 0.025;
  const cra = Math.max(200_000, grossAnnual * 0.20) + 200_000;

  const taxableIncome = Math.max(0, grossAnnual - pension - nhis - nhf - cra);

  let annualPAYE = 0;
  let remaining = taxableIncome;

  for (const band of NIGERIA_PAYE_BANDS) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    annualPAYE += taxable * band.rate;
    remaining -= taxable;
  }

  return {
    grossAnnual,
    grossMonthly: grossMonthlySalary,
    annualPAYE: Math.round(annualPAYE * 100) / 100,
    monthlyPAYE: Math.round((annualPAYE / 12) * 100) / 100,
    effectiveRate: taxableIncome > 0 ? Math.round((annualPAYE / taxableIncome) * 10000) / 10000 : 0,
    deductions: {
      pension: Math.round(pension * 100) / 100,
      nhis: Math.round(nhis * 100) / 100,
      nhf: Math.round(nhf * 100) / 100,
      cra: Math.round(cra * 100) / 100,
    },
  };
}

export function generateTaxCalendar(
  year: number,
  jurisdiction: 'NG' | 'GH' | 'ZA'
): TaxDeadline[] {
  if (jurisdiction === 'NG') {
    const deadlines: TaxDeadline[] = [];

    for (let month = 0; month < 12; month++) {
      // VAT monthly - due 21st of following month
      deadlines.push({
        type: 'VAT',
        label: 'FIRS VAT Return',
        dueDate: new Date(year, month + 1, 21),
        period: `${new Date(year, month).toLocaleString('en', { month: 'long' })} ${year}`,
        authority: 'FIRS',
        jurisdiction: 'NG',
      });

      // PAYE monthly - due 10th of following month
      deadlines.push({
        type: 'PAYE',
        label: 'LIRS/SIRS PAYE Remittance',
        dueDate: new Date(year, month + 1, 10),
        period: `${new Date(year, month).toLocaleString('en', { month: 'long' })} ${year}`,
        authority: 'LIRS',
        jurisdiction: 'NG',
      });
    }

    // WHT quarterly
    [0, 3, 6, 9].forEach(month => {
      deadlines.push({
        type: 'WHT',
        label: 'FIRS WHT Return (Quarterly)',
        dueDate: new Date(year, month + 1, 21),
        period: `Q${Math.floor(month / 3) + 1} ${year}`,
        authority: 'FIRS',
        jurisdiction: 'NG',
      });
    });

    return deadlines.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  // Ghana and South Africa: scaffold only (Phase 2)
  return [];
}
