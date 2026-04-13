'use client';

import Link from 'next/link';
import { generateTaxCalendar } from '@/lib/compliance/nigeria';
import { daysUntil, getDeadlineStatus } from '@/lib/utils';
import type { Jurisdiction } from '@/types';

interface TaxCalendarWidgetProps {
  jurisdiction: Jurisdiction;
}

const typeDotColor: Record<string, string> = {
  VAT: 'bg-[#4F46E5]',
  WHT: 'bg-[#059669]',
  PAYE: 'bg-[#D97706]',
  CIT: 'bg-[#EF4444]',
  ANNUAL: 'bg-[#64748B]',
};

export function TaxCalendarWidget({ jurisdiction }: TaxCalendarWidgetProps) {
  const year = new Date().getFullYear();
  const deadlines = generateTaxCalendar(year, jurisdiction);
  const now = new Date();

  const upcoming = deadlines
    .filter(
      (d) => new Date(d.dueDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    )
    .slice(0, 5);

  return (
    <div>
      <div className="space-y-1.5">
        {upcoming.map((deadline, i) => {
          const days = daysUntil(deadline.dueDate);
          const status = getDeadlineStatus(deadline.dueDate);

          const daysColor =
            status === 'overdue'
              ? 'text-[#DC2626]'
              : status === 'urgent'
              ? 'text-[#D97706]'
              : 'text-[#94A3B8]';

          const dueDate = new Date(deadline.dueDate);

          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
            >
              {/* Date pill */}
              <div className="bg-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-center min-w-[48px] flex-shrink-0">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase leading-tight">
                  {dueDate.toLocaleDateString('en', { month: 'short' })}
                </p>
                <p className="text-base font-bold text-[#0F172A] leading-tight">
                  {dueDate.getDate()}
                </p>
              </div>

              {/* Label with dot */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      typeDotColor[deadline.type] || 'bg-[#64748B]'
                    }`}
                  />
                  <p className="text-sm font-medium text-[#111827] truncate">{deadline.label}</p>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5 ml-3.5">{deadline.period}</p>
              </div>

              {/* Days left */}
              <span className={`text-xs font-bold whitespace-nowrap ${daysColor}`}>
                {days < 0
                  ? `${Math.abs(days)}d overdue`
                  : days === 0
                  ? 'Today!'
                  : `${days}d left`}
              </span>
            </div>
          );
        })}
      </div>

      {/* View compliance link */}
      <Link
        href="/compliance"
        className="block text-center py-3 mt-2 text-sm font-medium text-[#4F46E5] hover:bg-[#F8FAFC] rounded-xl transition-colors"
      >
        View compliance &rarr;
      </Link>
    </div>
  );
}
