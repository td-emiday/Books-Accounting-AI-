'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { generateTaxCalendar, calculateVAT, calculateWHT, NIGERIA_VAT_RATE } from '@/lib/compliance/nigeria';
import { formatCurrency, daysUntil, getDeadlineStatus } from '@/lib/utils';
import { Calendar, FileText, Users, Building2, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

const cardGradients = [
  'from-[#4F46E5] to-[#818CF8]', // VAT - indigo
  'from-[#059669] to-[#34D399]', // WHT - green
  'from-[#D97706] to-[#FBBF24]', // PAYE - amber
  'from-[#475569] to-[#94A3B8]', // Annual - slate
];

export default function CompliancePage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const { data: txResult } = useTransactions({ perPage: 500 });
  const transactions = txResult?.data || [];

  const now = new Date();
  const year = now.getFullYear();
  const deadlines = generateTaxCalendar(year, workspace?.jurisdiction || 'NG');

  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const monthStart = new Date(year, now.getMonth(), 1);
  const monthEnd = new Date(year, now.getMonth() + 1, 0);
  const mappedTx = transactions.map((t: any) => ({
    ...t,
    vatApplicable: t.vat_applicable ?? t.vatApplicable,
    whtApplicable: t.wht_applicable ?? t.whtApplicable,
    whtRate: t.wht_rate ?? t.whtRate,
  }));
  const vatReturn = calculateVAT(mappedTx, monthStart, monthEnd);

  const qStart = new Date(year, Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd = new Date(year, Math.floor(now.getMonth() / 3) * 3 + 3, 0);
  const whtSummary = calculateWHT(mappedTx, qStart, qEnd);

  const upcoming = deadlines.filter(d => new Date(d.dueDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)).slice(0, 12);

  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calMonthName = new Date(calYear, calMonth).toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const calDeadlines = deadlines.filter(d => {
    const dd = new Date(d.dueDate);
    return dd.getMonth() === calMonth && dd.getFullYear() === calYear;
  });

  const getDeadlinesForDay = (day: number) =>
    calDeadlines.filter(d => new Date(d.dueDate).getDate() === day);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedDeadlines = selectedDay ? getDeadlinesForDay(selectedDay) : [];

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

  const typeColor: Record<string, string> = {
    VAT: 'bg-[#4F46E5]',
    WHT: 'bg-[#059669]',
    PAYE: 'bg-[#D97706]',
    CIT: 'bg-[#EF4444]',
    ANNUAL: 'bg-[#64748B]',
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-1">Tax & Filing</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">Compliance Centre</h1>
      </div>

      {/* Status Cards with gradient top bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="metric-card group overflow-hidden relative">
              {/* Gradient top bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cardGradients[idx]}`} />

              <div className="flex items-center justify-between mb-4 pt-1">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon size={18} className="text-[#4F46E5]" />
                </div>
                <span className={`badge-${card.statusType}`}>{card.status}</span>
              </div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-semibold mb-1">{card.title}</p>
              <p className="font-bold text-xl text-[#0F172A] tabular-nums">{card.value}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{card.sub}</p>
              <div className="flex items-center gap-1 text-xs text-[#4F46E5] font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ChevronRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tax Calendar */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base text-[#0F172A]">Tax Calendar — {year}</h2>
          <div className="flex gap-1 p-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-white shadow-sm text-[#4F46E5] border border-[#E2E8F0]' : 'text-[#64748B]'}`}>List</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-[#4F46E5] border border-[#E2E8F0]' : 'text-[#64748B]'}`}>Calendar</button>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all">
                <ChevronLeft size={18} className="text-[#64748B]" />
              </button>
              <h3 className="font-semibold text-sm text-[#0F172A]">{calMonthName}</h3>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all">
                <ChevronRight size={18} className="text-[#64748B]" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-[#94A3B8] uppercase py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calFirstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-lg bg-[#FAFBFC]" />
              ))}

              {Array.from({ length: calDaysInMonth }, (_, i) => {
                const day = i + 1;
                const dayDeadlines = getDeadlinesForDay(day);
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-20 sm:h-24 rounded-lg border text-left p-1.5 transition-all duration-200 relative flex flex-col ${
                      isSelected ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-sm ring-1 ring-[#4F46E5]/20' :
                      dayDeadlines.length > 0 ? 'border-[#E2E8F0] hover:border-[#4F46E5]/30 hover:bg-[#EEF2FF]/30' :
                      'border-transparent hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className={`text-xs font-medium ${
                        isToday ? 'text-[#4F46E5] font-bold' : 'text-[#475569]'
                      }`}>{day}</span>
                      {/* Today indicator: small filled dot below number */}
                      {isToday && (
                        <span className="w-1 h-1 rounded-full bg-[#4F46E5] mt-0.5 mx-auto" />
                      )}
                    </div>

                    {dayDeadlines.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1.5">
                        {dayDeadlines.slice(0, 3).map((dl, j) => (
                          <div
                            key={j}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${typeColor[dl.type] || 'bg-[#64748B]'}`}
                            title={`${dl.type}: ${dl.label}`}
                          />
                        ))}
                      </div>
                    )}

                    {dayDeadlines.length > 0 && (
                      <p className="hidden sm:block text-[9px] text-[#64748B] mt-0.5 truncate leading-tight">
                        {dayDeadlines[0].type}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay && selectedDeadlines.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                <p className="text-sm font-semibold text-[#0F172A] mb-3">
                  {new Date(calYear, calMonth, selectedDay).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <div className="space-y-2">
                  {selectedDeadlines.map((dl, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${typeColor[dl.type] || 'bg-[#64748B]'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0F172A]">{dl.label}</p>
                        <p className="text-xs text-[#64748B]">{dl.period} &middot; {dl.authority}</p>
                      </div>
                      <span className={`badge-${dl.type === 'VAT' ? 'info' : dl.type === 'PAYE' ? 'warning' : 'success'}`}>
                        {dl.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-[#E2E8F0]">
              {Object.entries(typeColor).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-[11px] text-[#64748B] font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-2">
            {upcoming.map((deadline, i) => {
              const days = daysUntil(deadline.dueDate);
              const status = getDeadlineStatus(deadline.dueDate);
              const statusDotColor =
                status === 'overdue' ? 'bg-[#EF4444]' :
                status === 'urgent' ? 'bg-[#F59E0B]' :
                'bg-[#818CF8]';

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-white border border-[#E2E8F0] hover:shadow-sm hover:border-[#CBD5E1] transition-all"
                >
                  {/* Colored dot indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotColor}`} />

                  <div className="text-center min-w-[48px]">
                    <p className="text-[10px] text-[#94A3B8] uppercase font-medium">{new Date(deadline.dueDate).toLocaleDateString('en', { month: 'short' })}</p>
                    <p className="text-lg font-bold text-[#0F172A]">{new Date(deadline.dueDate).getDate()}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0F172A]">{deadline.label}</p>
                    <p className="text-xs text-[#94A3B8]">{deadline.period} &middot; {deadline.authority}</p>
                  </div>
                  <span className={`badge-${deadline.type === 'VAT' ? 'info' : deadline.type === 'PAYE' ? 'warning' : 'success'}`}>
                    {deadline.type}
                  </span>
                  <span className={`text-xs font-semibold tabular-nums ${
                    status === 'overdue' ? 'text-[#EF4444]' : status === 'urgent' ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                  }`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      {upcoming.length === 0 && (
        <div className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-[#D97706]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#0F172A] mb-2">No upcoming deadlines</h3>
              <p className="text-sm text-[#64748B] mb-3">Here are some compliance tips:</p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  Keep receipts for all business expenses — digital copies are accepted by FIRS.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  File your annual returns on time to avoid penalties.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  Register for VAT when your annual turnover exceeds ₦25 million.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-[#475569]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />
                  Separate personal and business accounts for cleaner bookkeeping.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
