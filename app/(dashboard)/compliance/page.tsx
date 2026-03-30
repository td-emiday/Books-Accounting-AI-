'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { generateTaxCalendar, calculateVAT, calculateWHT, NIGERIA_VAT_RATE } from '@/lib/compliance/nigeria';
import { formatCurrency, daysUntil, getDeadlineStatus } from '@/lib/utils';
import { Calendar, FileText, Users, Building2, ChevronRight } from 'lucide-react';

export default function CompliancePage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const [view, setView] = useState<'calendar' | 'list'>('list');

  const { data: txResult } = useTransactions({ perPage: 500 });
  const transactions = txResult?.data || [];

  const now = new Date();
  const year = now.getFullYear();
  const deadlines = generateTaxCalendar(year, workspace?.jurisdiction || 'NG');

  // Current month VAT
  const monthStart = new Date(year, now.getMonth(), 1);
  const monthEnd = new Date(year, now.getMonth() + 1, 0);
  const mappedTx = transactions.map((t: any) => ({
    ...t,
    vatApplicable: t.vat_applicable ?? t.vatApplicable,
    whtApplicable: t.wht_applicable ?? t.whtApplicable,
    whtRate: t.wht_rate ?? t.whtRate,
  }));
  const vatReturn = calculateVAT(mappedTx, monthStart, monthEnd);

  // WHT this quarter
  const qStart = new Date(year, Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd = new Date(year, Math.floor(now.getMonth() / 3) * 3 + 3, 0);
  const whtSummary = calculateWHT(mappedTx, qStart, qEnd);

  // Upcoming deadlines
  const upcoming = deadlines.filter(d => new Date(d.dueDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)).slice(0, 12);

  const complianceCards = [
    {
      title: 'VAT Status',
      status: vatReturn.netPayable > 0 ? 'Return Due' : 'Up to Date',
      statusType: vatReturn.netPayable > 0 ? 'warning' : 'success',
      value: formatCurrency(vatReturn.netPayable, currency),
      sub: `Net payable this month`,
      href: '/compliance/vat',
      icon: FileText,
    },
    {
      title: 'WHT Status',
      status: whtSummary.totalWHTDeducted > 0 ? 'Active' : 'No deductions',
      statusType: 'success' as const,
      value: formatCurrency(whtSummary.totalWHTDeducted, currency),
      sub: `Total deducted this quarter`,
      href: '/compliance/wht',
      icon: Building2,
    },
    {
      title: 'PAYE Status',
      status: 'Setup Required',
      statusType: 'warning' as const,
      value: '—',
      sub: 'Add employees to calculate',
      href: '/compliance/paye',
      icon: Users,
    },
    {
      title: 'Annual Return (CAC)',
      status: 'Pending',
      statusType: 'info' as const,
      value: '—',
      sub: 'Due within 42 days of AGM',
      href: '/compliance',
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Compliance Centre</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="metric-card group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-1/5 flex items-center justify-center">
                  <Icon size={18} className="text-brand-1" />
                </div>
                <span className={`badge-${card.statusType}`}>{card.status}</span>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">{card.title}</p>
              <p className="font-inter font-bold text-xl">{card.value}</p>
              <p className="text-xs text-text-muted mt-1">{card.sub}</p>
              <div className="flex items-center gap-1 text-xs text-brand-1 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ChevronRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tax Calendar */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-inter font-bold text-base">Tax Calendar — {year}</h2>
          <div className="flex gap-1 p-1 bg-brand-1/5 rounded-lg">
            <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-xs font-medium ${view === 'list' ? 'bg-white shadow-sm text-brand-1' : 'text-text-muted'}`}>List</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1 rounded-md text-xs font-medium ${view === 'calendar' ? 'bg-white shadow-sm text-brand-1' : 'text-text-muted'}`}>Calendar</button>
          </div>
        </div>

        <div className="space-y-2">
          {upcoming.map((deadline, i) => {
            const days = daysUntil(deadline.dueDate);
            const status = getDeadlineStatus(deadline.dueDate);
            return (
              <div
                key={i}
                className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl border transition-all hover:shadow-sm ${
                  status === 'overdue' ? 'border-l-[3px] border-l-danger border-danger/20 bg-danger/5' :
                  status === 'urgent' ? 'border-l-[3px] border-l-warning border-warning/20 bg-warning/5' :
                  'border-[rgba(108,63,232,0.08)] border-l-[3px] border-l-brand-3'
                }`}
              >
                <div className="text-center min-w-[48px]">
                  <p className="text-[10px] text-text-muted uppercase">{new Date(deadline.dueDate).toLocaleDateString('en', { month: 'short' })}</p>
                  <p className="text-lg font-bold">{new Date(deadline.dueDate).getDate()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{deadline.label}</p>
                  <p className="text-xs text-text-muted">{deadline.period} · {deadline.authority}</p>
                </div>
                <span className={`badge-${deadline.type === 'VAT' ? 'info' : deadline.type === 'PAYE' ? 'warning' : 'success'}`}>
                  {deadline.type}
                </span>
                <span className={`text-xs font-medium ${
                  status === 'overdue' ? 'text-danger' : status === 'urgent' ? 'text-warning' : 'text-text-muted'
                }`}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
