'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, className = '' }: StatsCardProps) {
  const isPositive = trend ? trend.startsWith('+') || !trend.startsWith('-') : null;

  return (
    <div className={`bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
          <Icon size={20} className="text-[#5B21B6]" />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#111827] tracking-tight">{value}</p>
      <p className="text-sm text-[#6B7280] mt-1">{label}</p>
    </div>
  );
}
