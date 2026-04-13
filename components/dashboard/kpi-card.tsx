'use client';

import { Sparkline } from '@/components/charts/sparkline';
import { TrendingUp, TrendingDown, DollarSign, Receipt, BarChart3, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type KPIVariant = 'revenue' | 'expenses' | 'profit' | 'tax' | 'default';

const variantConfig: Record<KPIVariant, {
  iconBg: string;
  iconColor: string;
  accentColor: string;
  sparklineColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  revenue:  { iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]', accentColor: '#4F46E5', sparklineColor: '#4F46E5', gradientFrom: '#4F46E5', gradientTo: '#818CF8' },
  expenses: { iconBg: 'bg-[#FEF2F2]', iconColor: 'text-[#EF4444]', accentColor: '#EF4444', sparklineColor: '#EF4444', gradientFrom: '#EF4444', gradientTo: '#F87171' },
  profit:   { iconBg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]', accentColor: '#059669', sparklineColor: '#059669', gradientFrom: '#059669', gradientTo: '#34D399' },
  tax:      { iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]', accentColor: '#D97706', sparklineColor: '#D97706', gradientFrom: '#D97706', gradientTo: '#FBBF24' },
  default:  { iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]', accentColor: '#4F46E5', sparklineColor: '#4F46E5', gradientFrom: '#4F46E5', gradientTo: '#818CF8' },
};

const variantIcons: Record<KPIVariant, LucideIcon> = {
  revenue:  BarChart3,
  expenses: Receipt,
  profit:   DollarSign,
  tax:      AlertTriangle,
  default:  BarChart3,
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
  sparklineData,
  sparklineColor,
  variant = 'default',
}: KPICardProps) {
  const config = variantConfig[variant];
  const Icon = variantIcons[variant];
  const resolvedSparkColor = sparklineColor ?? config.sparklineColor;

  return (
    <div className={`metric-card metric-card--${variant} group relative overflow-hidden`}>
      {/* Gradient top accent bar */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
        }}
      />

      {/* Top row: icon + label */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
          <Icon size={19} className={config.iconColor} />
        </div>
        <p className="text-sm font-medium text-[#64748B]">
          {label}
        </p>
      </div>

      {/* Big number */}
      <p className="font-bold text-3xl md:text-[32px] leading-none text-[#0F172A] tabular-nums mb-3 tracking-tight">
        {value}
      </p>

      {/* Trend + Badge */}
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {change && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            changeType === 'positive'
              ? 'text-[#059669]'
              : changeType === 'negative'
              ? 'text-[#EF4444]'
              : 'text-[#94A3B8]'
          }`}>
            {changeType === 'positive' && <TrendingUp size={13} />}
            {changeType === 'negative' && <TrendingDown size={13} />}
            <span>{change}</span>
          </div>
        )}
        {badge && (
          <span className={`badge-${badgeType} text-[10px] px-2 py-0.5 ml-auto`}>
            {badge}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 -mx-1">
          <Sparkline data={sparklineData} color={resolvedSparkColor} height={36} />
        </div>
      )}
    </div>
  );
}
