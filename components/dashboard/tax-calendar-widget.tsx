'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { generateTaxCalendar } from '@/lib/compliance/nigeria';
import { daysUntil, getDeadlineStatus } from '@/lib/utils';
import type { Jurisdiction } from '@/types';

interface TaxCalendarWidgetProps {
  jurisdiction: Jurisdiction;
}

export function TaxCalendarWidget({ jurisdiction }: TaxCalendarWidgetProps) {
  const year = new Date().getFullYear();
  const deadlines = generateTaxCalendar(year, jurisdiction);
  const now = new Date();

  const upcoming = deadlines
    .filter(d => new Date(d.dueDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-brand-1" />
          <h3 className="font-bold text-base text-[#111827]">Tax Calendar</h3>
        </div>
        <Link href="/compliance" className="text-xs text-brand-1 font-semibold hover:underline">
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {upcoming.map((deadline, i) => {
          const days = daysUntil(deadline.dueDate);
          const status = getDeadlineStatus(deadline.dueDate);

          const statusStyles =
            status === 'overdue' ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', accent: '#DC2626' } :
            status === 'urgent' ? { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', accent: '#D97706' } :
            { bg: '#F9FAFB', border: '#E5E7EB', text: '#6B7280', accent: '#7b39fc' };

          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border-l-[3px] transition-colors"
              style={{ background: statusStyles.bg, borderColor: statusStyles.border, borderLeftColor: statusStyles.accent }}
            >
              <div className="text-center min-w-[40px]">
                <p className="text-xs font-medium text-[#6B7280]">
                  {new Date(deadline.dueDate).toLocaleDateString('en', { month: 'short' })}
                </p>
                <p className="text-lg font-bold text-[#111827]">
                  {new Date(deadline.dueDate).getDate()}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">{deadline.label}</p>
                <p className="text-xs text-[#6B7280]">{deadline.period}</p>
              </div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: statusStyles.text }}>
                {days < 0 ? `${Math.abs(days)}d overdue` :
                 days === 0 ? 'Today!' :
                 `${days}d left`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
