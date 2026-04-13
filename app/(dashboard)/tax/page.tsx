'use client';

import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { KPICard } from '@/components/dashboard/kpi-card';
import { formatCurrency } from '@/lib/utils';
import { calculateVAT, calculateWHT } from '@/lib/compliance/nigeria';
import {
  Receipt, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  ExternalLink, Info, ChevronDown, Building2, FileText, CreditCard
} from 'lucide-react';

const PERIODS = [
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
] as const;

type Period = typeof PERIODS[number]['value'];

function getPeriodDates(period: Period): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    return {
      start: new Date(now.getFullYear(), q * 3, 1),
      end: new Date(now.getFullYear(), q * 3 + 3, 0),
    };
  }
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31),
  };
}

function getCITRate(annualRevenue: number): { rate: number; label: string } {
  if (annualRevenue <= 25_000_000) return { rate: 0, label: '0% (Small company ≤₦25M)' };
  if (annualRevenue <= 100_000_000) return { rate: 0.20, label: '20% (Medium company ≤₦100M)' };
  return { rate: 0.30, label: '30% (Large company)' };
}

// Nigeria How-to-Pay guide
const NG_PAYMENT_STEPS = [
  {
    step: 1,
    title: 'Get your TIN',
    desc: 'Ensure your Tax Identification Number (TIN) is registered with FIRS. You can register online at the FIRS e-Tax portal.',
    icon: FileText,
  },
  {
    step: 2,
    title: 'File your returns on FIRS e-Tax',
    desc: 'Log into the FIRS e-Tax portal (etax.firs.gov.ng), select your tax type (VAT, CIT, WHT), enter your figures for the period, and submit your return.',
    icon: Building2,
  },
  {
    step: 3,
    title: 'Generate a payment reference',
    desc: 'After filing, the portal generates a unique Payment Reference Number (PRN). This reference is required to complete your payment.',
    icon: Receipt,
  },
  {
    step: 4,
    title: 'Pay via Remita or your bank',
    desc: 'Use your PRN to pay via Remita (remita.net), internet banking, USSD (*347*103# for most banks), or over the counter at any bank.',
    icon: CreditCard,
  },
];

const GH_PAYMENT_STEPS = [
  { step: 1, title: 'Register with GRA', desc: 'Register with the Ghana Revenue Authority (GRA) and obtain your Tax Identification Number (TIN).', icon: FileText },
  { step: 2, title: 'File on GRA iTax', desc: 'Log into the GRA iTax platform and file your VAT, CIT, or PAYE returns.', icon: Building2 },
  { step: 3, title: 'Pay via GRA platform', desc: 'Pay directly through the GRA platform via mobile money, bank transfer, or at a designated bank.', icon: CreditCard },
];

const ZA_PAYMENT_STEPS = [
  { step: 1, title: 'Register with SARS', desc: 'Register as a taxpayer with SARS (South African Revenue Service) and obtain your tax number.', icon: FileText },
  { step: 2, title: 'File on SARS eFiling', desc: 'Use SARS eFiling (efiling.sars.gov.za) to file your VAT201, ITR14, or EMP201 returns.', icon: Building2 },
  { step: 3, title: 'Pay via eFiling or EFT', desc: 'Pay through SARS eFiling payment gateway, EFT to SARS bank account, or at a SARS branch.', icon: CreditCard },
];

const PAYMENT_LINKS: Record<string, { label: string; url: string; secondary?: { label: string; url: string } }[]> = {
  NG: [
    { label: 'Pay on FIRS e-Tax Portal', url: 'https://etax.firs.gov.ng', secondary: { label: 'Pay via Remita', url: 'https://remita.net' } },
  ],
  GH: [
    { label: 'Pay on GRA iTax', url: 'https://taxpayerportal.gra.gov.gh' },
  ],
  ZA: [
    { label: 'Pay on SARS eFiling', url: 'https://efiling.sars.gov.za' },
  ],
};

export default function TaxPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const jurisdiction = (workspace?.jurisdiction || 'NG') as 'NG' | 'GH' | 'ZA';
  const [period, setPeriod] = useState<Period>('month');
  const { data: txResult } = useTransactions({ perPage: 1000 });
  const transactions = txResult?.data || [];

  const { start, end } = getPeriodDates(period);

  // Filter transactions to period
  const periodTx = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  }), [transactions, start, end]);

  // Revenue, expenses, profit
  const revenue = periodTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses = periodTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netProfit = revenue - expenses;

  // VAT (only on VAT-applicable transactions)
  const vatResult = useMemo(() => calculateVAT(transactions, start, end), [transactions, start, end]);

  // WHT
  const whtResult = useMemo(() => calculateWHT(transactions, start, end), [transactions, start, end]);

  // CIT estimate (annualise net profit for rate determination)
  const annualRevenue = period === 'month' ? revenue * 12 : period === 'quarter' ? revenue * 4 : revenue;
  const { rate: citRate, label: citLabel } = getCITRate(annualRevenue);
  const citEstimate = Math.max(0, netProfit * citRate);

  // Total estimated tax
  const totalTax = vatResult.netPayable + whtResult.totalWHTDeducted + citEstimate;
  const cashAfterTax = netProfit - totalTax;

  const paymentSteps = jurisdiction === 'GH' ? GH_PAYMENT_STEPS : jurisdiction === 'ZA' ? ZA_PAYMENT_STEPS : NG_PAYMENT_STEPS;
  const paymentLinks = PAYMENT_LINKS[jurisdiction] || PAYMENT_LINKS.NG;

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Tax Estimator</h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-inter">
            Estimated tax liabilities based on your recorded transactions.
          </p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E5E7EB] p-1 shadow-sm">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-[#5B21B6] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">No transactions yet</p>
            <p className="text-xs text-amber-700 mt-0.5">Import bank statements or add transactions to see your estimated tax liabilities.</p>
          </div>
        </div>
      )}

      {/* Profit Summary KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Profit Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(revenue, currency)}
            change={`${period === 'month' ? 'This month' : period === 'quarter' ? 'This quarter' : 'This year'}`}
            changeType="neutral"
            badge="Income"
            badgeType="success"
            variant="revenue"
          />
          <KPICard
            label="Total Expenses"
            value={formatCurrency(expenses, currency)}
            change="Operating costs"
            changeType="neutral"
            badge="Costs"
            badgeType="info"
            variant="expenses"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(netProfit, currency)}
            change={netProfit > 0 ? `${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}% margin` : 'Net loss'}
            changeType={netProfit >= 0 ? 'positive' : 'negative'}
            variant="profit"
          />
          <KPICard
            label="Est. Cash After Tax"
            value={formatCurrency(Math.max(0, cashAfterTax), currency)}
            change={totalTax > 0 ? `After ~${formatCurrency(totalTax, currency)} taxes` : 'No tax liability'}
            changeType={cashAfterTax >= 0 ? 'positive' : 'negative'}
            badge="Estimate"
            badgeType="warning"
            variant="tax"
          />
        </div>
      </div>

      {/* Ready to Pay — moved above breakdown */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#111827] mb-0.5">Ready to pay?</p>
            <p className="text-xs text-[#6B7280]">Your estimated total tax liability is <strong className="text-[#5B21B6]">{formatCurrency(totalTax, currency)}</strong>. Pay directly via the official portal.</p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {paymentLinks.map((link, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5B21B6] hover:bg-[#4C1D95] transition-all"
                >
                  {link.label}
                  <ExternalLink size={14} />
                </a>
                {link.secondary && (
                  <a
                    href={link.secondary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#5B21B6] bg-[#F5F3FF] border border-[#DDD6FE] hover:bg-[#EDE9FE] transition-all"
                  >
                    {link.secondary.label}
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Estimated Tax Liabilities</h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Tax Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">Basis</th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Amount</th>
                <th className="text-center px-5 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* VAT row */}
              <tr className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#111827]">VAT</p>
                  <p className="text-xs text-[#6B7280]">Value Added Tax @ 7.5%</p>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <p className="text-xs text-[#374151]">Output: {formatCurrency(vatResult.outputTax, currency)}</p>
                  <p className="text-xs text-[#374151]">Input: {formatCurrency(vatResult.inputTax, currency)}</p>
                </td>
                <td className="px-5 py-4 text-right font-bold text-[#111827]">
                  {formatCurrency(vatResult.netPayable, currency)}
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  {vatResult.netPayable > 0 ? (
                    <span className="badge-warning text-[10px]">Due 21st</span>
                  ) : (
                    <span className="badge-success text-[10px]">No liability</span>
                  )}
                </td>
              </tr>

              {/* WHT row */}
              <tr className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#111827]">WHT</p>
                  <p className="text-xs text-[#6B7280]">Withholding Tax (deducted at source)</p>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <p className="text-xs text-[#374151]">{whtResult.transactions.length} WHT transactions</p>
                  <p className="text-xs text-[#374151]">5%–10% on services</p>
                </td>
                <td className="px-5 py-4 text-right font-bold text-[#111827]">
                  {formatCurrency(whtResult.totalWHTDeducted, currency)}
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  {whtResult.totalWHTDeducted > 0 ? (
                    <span className="badge-info text-[10px]">Quarterly</span>
                  ) : (
                    <span className="badge-success text-[10px]">No liability</span>
                  )}
                </td>
              </tr>

              {/* CIT row */}
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#111827]">CIT</p>
                  <p className="text-xs text-[#6B7280]">Company Income Tax — {citLabel}</p>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <p className="text-xs text-[#374151]">On: {formatCurrency(Math.max(0, netProfit), currency)} net profit</p>
                  <p className="text-xs text-[#374151]">Rate: {(citRate * 100).toFixed(0)}%</p>
                </td>
                <td className="px-5 py-4 text-right font-bold text-[#111827]">
                  {formatCurrency(citEstimate, currency)}
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  {citEstimate > 0 ? (
                    <span className="badge-warning text-[10px]">Annual</span>
                  ) : (
                    <span className="badge-success text-[10px]">Exempt</span>
                  )}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#F5F3FF] border-t-2 border-[#DDD6FE]">
                <td colSpan={2} className="px-5 py-4 font-bold text-[#111827]">Total Estimated Tax</td>
                <td className="px-5 py-4 text-right font-bold text-xl text-[#5B21B6]">{formatCurrency(totalTax, currency)}</td>
                <td className="px-5 py-4 hidden md:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-[#9CA3AF]">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>These are estimates based on your recorded transactions. Actual tax liabilities may vary. Consult a qualified accountant before filing. VAT/WHT figures only include transactions marked as VAT/WHT applicable.</span>
        </div>
      </div>

      {/* VAT breakdown detail */}
      {vatResult.transactions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">VAT-Applicable Transactions</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Description</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Amount</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">VAT (7.5%)</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {vatResult.transactions.map((tx, i) => (
                    <tr key={tx.id || i} className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB]">
                      <td className="px-4 py-2.5 text-xs text-[#6B7280] whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-2.5 text-sm text-[#111827] font-medium truncate max-w-[200px]">{tx.description}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-[#111827]">{formatCurrency(tx.amount, currency)}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#5B21B6]">{formatCurrency(tx.amount * 0.075, currency)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {tx.type === 'INCOME'
                          ? <span className="badge-success text-[9px]">Output</span>
                          : <span className="badge-info text-[9px]">Input</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* How to Pay */}
      <div>
        <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
          How to Pay Your Taxes
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]">
            {jurisdiction === 'GH' ? 'Ghana GRA' : jurisdiction === 'ZA' ? 'South Africa SARS' : 'Nigeria FIRS'}
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {paymentSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#5B21B6]" />
                  </div>
                  <span className="text-xs font-bold text-[#5B21B6] uppercase tracking-wide">Step {s.step}</span>
                </div>
                <p className="font-semibold text-[#111827] text-sm mb-1">{s.title}</p>
                <p className="text-xs text-[#6B7280] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {jurisdiction === 'NG' && (
          <div className="mt-4 glass-card p-5">
            <h3 className="font-semibold text-[#111827] mb-3 text-sm">Key Deadlines (Nigeria)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">VAT Returns</p>
                  <p className="text-xs text-[#6B7280]">Due by the 21st of the following month</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">PAYE Remittance</p>
                  <p className="text-xs text-[#6B7280]">Due by the 10th of the following month</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#111827]">CIT & WHT Returns</p>
                  <p className="text-xs text-[#6B7280]">CIT annual; WHT quarterly (21st)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
