'use client';

import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { KPICard } from '@/components/dashboard/kpi-card';
import { CashFlowChart } from '@/components/charts/cash-flow-chart';
import { TaxCalendarWidget } from '@/components/dashboard/tax-calendar-widget';
import { ComplianceScore } from '@/components/dashboard/compliance-score';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import { Plus, Upload, Bot, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const { data: txResult } = useTransactions({ perPage: 1000 });
  const transactions = txResult?.data || [];

  // Calculate KPIs
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

  const revenue = thisMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netProfit = revenue - expenses;
  const lastRevenue = lastMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const lastExpenses = lastMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const revenueDiff = revenue - lastRevenue;
  const expenseDiff = expenses - lastExpenses;

  const vatLiability = thisMonth
    .filter(t => t.type === 'INCOME' && t.vatApplicable)
    .reduce((s, t) => s + t.amount * 0.075, 0);

  // Monthly cash flow data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i);
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const inc = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const exp = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      income: inc,
      expense: exp,
      net: inc - exp,
    };
  });

  // 7-day sparkline data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return transactions
      .filter(t => new Date(t.date).toDateString() === d.toDateString() && t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);
  });
  const last7exp = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return transactions
      .filter(t => new Date(t.date).toDateString() === d.toDateString() && t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);
  });

  const profile = useWorkspaceStore((s) => s.profile);
  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">
            {now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(revenue, currency)}
          change={`${revenueDiff >= 0 ? '+' : ''}${formatCompactCurrency(Math.abs(revenueDiff), currency)} vs last month`}
          changeType={revenueDiff >= 0 ? 'positive' : 'negative'}
          sparklineData={last7}
          sparklineColor="#7b39fc"
          variant="revenue"
        />
        <KPICard
          label="Total Expenses"
          value={formatCurrency(expenses, currency)}
          change={`${expenseDiff >= 0 ? '+' : ''}${formatCompactCurrency(Math.abs(expenseDiff), currency)} vs last month`}
          changeType={expenseDiff <= 0 ? 'positive' : 'negative'}
          sparklineData={last7exp}
          sparklineColor="#EF4444"
          variant="expenses"
        />
        <KPICard
          label="Net Profit"
          value={formatCurrency(netProfit, currency)}
          change={netProfit > 0 ? `Margin: ${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%` : 'Loss'}
          changeType={netProfit >= 0 ? 'positive' : 'negative'}
          badge={netProfit >= 0 ? 'Profitable' : 'Loss'}
          badgeType={netProfit >= 0 ? 'success' : 'danger'}
          variant="profit"
        />
        <KPICard
          label="Tax Liability"
          value={formatCurrency(vatLiability, currency)}
          change="VAT due this period"
          badge="FIRS"
          badgeType="warning"
          variant="tax"
        />
      </div>

      {/* Quick Actions — mobile only, horizontal scroll */}
      <div className="flex md:hidden gap-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
        <Link href="/transactions" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] flex-shrink-0">
          <Plus size={14} className="text-brand-1" />
          <span className="text-[11px] font-semibold text-[#374151] whitespace-nowrap">Add Expense</span>
        </Link>
        <Link href="/transactions/import" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] flex-shrink-0">
          <Upload size={14} className="text-brand-1" />
          <span className="text-[11px] font-semibold text-[#374151] whitespace-nowrap">Import</span>
        </Link>
        <Link href="/ai-chat" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] flex-shrink-0">
          <Bot size={14} className="text-brand-1" />
          <span className="text-[11px] font-semibold text-[#374151] whitespace-nowrap">Ask AI</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
        {/* Left column - 60% */}
        <div className="lg:col-span-3 space-y-5 md:space-y-6">
          <div className="glass-card p-5 md:p-6">
            <RecentTransactions transactions={transactions} currency={currency} />
          </div>
          <div className="glass-card p-5 md:p-6">
            <CashFlowChart data={monthlyData} currency={currency} />
          </div>
        </div>

        {/* Right column - 40% */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <div className="glass-card p-5 md:p-6">
            <TaxCalendarWidget jurisdiction={workspace?.jurisdiction || 'NG'} />
          </div>
          <div className="glass-card p-5 md:p-6">
            <ComplianceScore
              score={transactions.length > 0 ? 87 : 0}
              vatStatus={transactions.some(t => t.vatApplicable) ? 'ok' : 'missing'}
              whtStatus="ok"
              payeStatus="warning"
            />
          </div>
          {/* Quick Actions — desktop only */}
          <div className="hidden md:block glass-card p-5">
            <h3 className="font-bold text-sm text-[#111827] mb-2.5">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/transactions"
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-all text-center"
              >
                <Plus size={16} className="text-brand-1" />
                <span className="text-[10px] font-semibold text-[#374151]">Add Expense</span>
              </Link>
              <Link
                href="/transactions/import"
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-all text-center"
              >
                <Upload size={16} className="text-brand-1" />
                <span className="text-[10px] font-semibold text-[#374151]">Import</span>
              </Link>
              <Link
                href="/ai-chat"
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-all text-center"
              >
                <Bot size={16} className="text-brand-1" />
                <span className="text-[10px] font-semibold text-[#374151]">Ask AI</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
