'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

type KPIVariant = 'revenue' | 'expenses' | 'profit' | 'tax' | 'default';

const variantConfig: Record<KPIVariant, {
  stripe: string;
  hoverShadow: string;
  pillBg: string;
  pillText: string;
}> = {
  revenue:  { stripe: '#4F46E5', hoverShadow: '0 8px 24px -4px rgba(79,70,229,0.15)', pillBg: 'bg-indigo-50', pillText: 'text-indigo-700' },
  expenses: { stripe: '#EF4444', hoverShadow: '0 8px 24px -4px rgba(239,68,68,0.15)', pillBg: 'bg-red-50', pillText: 'text-red-700' },
  profit:   { stripe: '#059669', hoverShadow: '0 8px 24px -4px rgba(5,150,105,0.15)', pillBg: 'bg-emerald-50', pillText: 'text-emerald-700' },
  tax:      { stripe: '#D97706', hoverShadow: '0 8px 24px -4px rgba(217,119,6,0.15)', pillBg: 'bg-amber-50', pillText: 'text-amber-700' },
  default:  { stripe: '#4F46E5', hoverShadow: '0 8px 24px -4px rgba(79,70,229,0.15)', pillBg: 'bg-indigo-50', pillText: 'text-indigo-700' },
};

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
  sparklineData?: number[];
  sparklineColor?: string;
  variant?: KPIVariant;
}

export function KPICard({
  label,
  value,
  change,
  changeType = 'neutral',
  badge,
  badgeType = 'info',
  variant = 'default',
}: KPICardProps) {
  const config = variantConfig[variant];

  return (
    <div
      className="metric-card group relative overflow-hidden pl-5"
      style={{ '--stripe-color': config.stripe, '--hover-shadow': config.hoverShadow } as React.CSSProperties}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: config.stripe }}
      />

      {/* Micro label */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8] mb-3">
        {label}
      </p>

      {/* Dominant number */}
      <p className="font-bold text-[28px] md:text-[32px] leading-none text-[#0F172A] dark:text-white tabular-nums tracking-tight mb-3">
        {value}
      </p>

      {/* Change pill + Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {change && (
          <div className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            changeType === 'positive'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : changeType === 'negative'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              : `${config.pillBg} ${config.pillText} dark:bg-slate-800 dark:text-slate-400`
          }`}>
            {changeType === 'positive' && <TrendingUp size={11} />}
            {changeType === 'negative' && <TrendingDown size={11} />}
            <span>{change}</span>
          </div>
        )}
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            badgeType === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : badgeType === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
            : badgeType === 'danger' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
