'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { KPICard } from '@/components/dashboard/kpi-card';
import { CashFlowChart } from '@/components/charts/cash-flow-chart';
import { TaxCalendarWidget } from '@/components/dashboard/tax-calendar-widget';
import { ComplianceScore } from '@/components/dashboard/compliance-score';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import { Plus, Upload, Bot } from 'lucide-react';
import Link from 'next/link';
import { Hero195 } from '@/components/ui/hero-195';

export default function DashboardPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const { data: txResult } = useTransactions({ perPage: 1000 });
  const transactions = txResult?.data || [];

  const now = new Date();

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const revenue     = thisMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses    = thisMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netProfit   = revenue - expenses;
  const lastRevenue = lastMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const lastExpenses = lastMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const vatLiability = thisMonth.filter(t => t.type === 'INCOME' && t.vatApplicable).reduce((s, t) => s + t.amount * 0.075, 0);

  const revenueDiff  = revenue  - lastRevenue;
  const expenseDiff  = expenses - lastExpenses;
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return transactions.filter(t => new Date(t.date).toDateString() === d.toDateString() && t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  });
  const last7exp = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return transactions.filter(t => new Date(t.date).toDateString() === d.toDateString() && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  });

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i);
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const inc = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const exp = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return { month: d.toLocaleDateString('en', { month: 'short' }), income: inc, expense: exp, net: inc - exp };
  });

  const profile   = useWorkspaceStore((s) => s.profile);
  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const hour      = now.getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const monthName = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">

      {/* Hero Section */}
      <Hero195
        greeting={greeting}
        firstName={firstName}
        dateString={now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        netProfit={netProfit}
        profitMargin={profitMargin}
        transactionCount={transactions.length}
        currency={currency}
        revenue={{ label: 'Revenue', value: formatCurrency(revenue, currency), compactValue: formatCompactCurrency(revenue, currency) }}
        expenses={{ label: 'Expenses', value: formatCurrency(expenses, currency), compactValue: formatCompactCurrency(expenses, currency) }}
        vatLiability={{ label: 'VAT Due', value: formatCurrency(vatLiability, currency), compactValue: formatCompactCurrency(vatLiability, currency) }}
        formatCurrency={formatCurrency}
        formatCompactCurrency={formatCompactCurrency}
      />

      {/* KPI Cards */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A] whitespace-nowrap">Monthly Overview</h2>
          <hr className="flex-1 border-[#E2E8F0]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(revenue, currency)}
            change={`${revenueDiff >= 0 ? '+' : ''}${formatCompactCurrency(Math.abs(revenueDiff), currency)} vs last month`}
            changeType={revenueDiff >= 0 ? 'positive' : 'negative'}
            sparklineData={last7}
            variant="revenue"
          />
          <KPICard
            label="Total Expenses"
            value={formatCurrency(expenses, currency)}
            change={`${expenseDiff >= 0 ? '+' : ''}${formatCompactCurrency(Math.abs(expenseDiff), currency)} vs last month`}
            changeType={expenseDiff <= 0 ? 'positive' : 'negative'}
            sparklineData={last7exp}
            variant="expenses"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(netProfit, currency)}
            change={netProfit >= 0 ? `${profitMargin}% margin` : 'Operating loss'}
            changeType={netProfit >= 0 ? 'positive' : 'negative'}
            badge={netProfit >= 0 ? 'Profitable' : 'Loss'}
            badgeType={netProfit >= 0 ? 'success' : 'danger'}
            variant="profit"
          />
          <KPICard
            label="VAT Liability"
            value={formatCurrency(vatLiability, currency)}
            change="Due this period"
            changeType="neutral"
            badge="FIRS"
            badgeType="warning"
            variant="tax"
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">

        {/* Left: Chart + Recent Transactions */}
        <div className="lg:col-span-3 space-y-5 md:space-y-6">
          <div className="glass-card p-5 md:p-6 relative overflow-hidden">
            {/* Gradient accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8]" />
            <div className="mb-1">
              <h2 className="font-semibold text-[#0F172A] text-base">6-Month Cash Flow</h2>
            </div>
            <CashFlowChart data={monthlyData} currency={currency} />
          </div>

          <div className="glass-card p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8]" />
            <div className="mb-4">
              <h2 className="font-semibold text-[#0F172A] text-base">Recent Transactions</h2>
            </div>
            <RecentTransactions transactions={transactions} currency={currency} />
          </div>
        </div>

        {/* Right: Tax + Compliance + Quick actions */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <div className="glass-card p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D97706] to-[#FBBF24]" />
            <div className="mb-4">
              <h2 className="font-semibold text-[#0F172A] text-base">Tax Calendar</h2>
            </div>
            <TaxCalendarWidget jurisdiction={workspace?.jurisdiction || 'NG'} />
          </div>

          <div className="glass-card p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#059669] to-[#34D399]" />
            <div className="mb-4">
              <h2 className="font-semibold text-[#0F172A] text-base">Compliance Score</h2>
            </div>
            <ComplianceScore
              score={transactions.length > 0 ? 87 : 0}
              vatStatus={transactions.some(t => t.vatApplicable) ? 'ok' : 'missing'}
              whtStatus="ok"
              payeStatus="warning"
            />
          </div>

          {/* Quick actions - compact horizontal buttons */}
          <div className="hidden md:block glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4F46E5] to-[#818CF8]" />
            <h2 className="font-semibold text-[#0F172A] text-sm mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/transactions"
                className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Plus size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-[#475569] group-hover:text-[#0F172A]">Add Transaction</span>
              </Link>
              <Link
                href="/transactions/import"
                className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Upload size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-[#475569] group-hover:text-[#0F172A]">Import</span>
              </Link>
              <Link
                href="/ai-chat"
                className="flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Bot size={15} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-[#475569] group-hover:text-[#0F172A]">Ask AI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
