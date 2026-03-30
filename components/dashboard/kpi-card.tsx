'use client';

import { Sparkline } from '@/components/charts/sparkline';
import { TrendingUp, TrendingDown, DollarSign, Receipt, BarChart3, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type KPIVariant = 'revenue' | 'expenses' | 'profit' | 'tax' | 'default';

const variantConfig: Record<KPIVariant, { iconBg: string; iconColor: string; accentGradient: string }> = {
  revenue: { iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7b39fc]', accentGradient: 'from-[#7b39fc] to-[#a78bfa]' },
  expenses: { iconBg: 'bg-[#FEF2F2]', iconColor: 'text-[#DC2626]', accentGradient: 'from-[#EF4444] to-[#FCA5A5]' },
  profit: { iconBg: 'bg-[#ECFDF5]', iconColor: 'text-[#059669]', accentGradient: 'from-[#059669] to-[#6EE7B7]' },
  tax: { iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]', accentGradient: 'from-[#D97706] to-[#FCD34D]' },
  default: { iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7b39fc]', accentGradient: 'from-[#7b39fc] to-[#a78bfa]' },
};

const variantIcons: Record<KPIVariant, LucideIcon> = {
  revenue: BarChart3,
  expenses: Receipt,
  profit: DollarSign,
  tax: AlertTriangle,
  default: BarChart3,
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

  return (
    <div className={`metric-card metric-card--${variant} relative overflow-hidden`}>
      {/* Gradient accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accentGradient} rounded-t-2xl`} />

      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <Icon size={18} className={config.iconColor} />
        </div>
        {badge && (
          <span className={`badge-${badgeType} text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5`}>
            {badge}
          </span>
        )}
      </div>

      <p className="text-[11px] md:text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">
        {label}
      </p>

      <p className="font-bold text-xl md:text-2xl text-[#111827] mb-1.5 tabular-nums">
        {value}
      </p>

      <div className="flex items-center gap-2">
        {change && (
          <div className={`flex items-center gap-1 text-[10px] md:text-xs font-medium ${
            changeType === 'positive'
              ? 'text-[#059669]'
              : changeType === 'negative'
              ? 'text-[#DC2626]'
              : 'text-[#6B7280]'
          }`}>
            {changeType === 'positive' && <TrendingUp size={12} />}
            {changeType === 'negative' && <TrendingDown size={12} />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2 md:mt-3">
          <Sparkline data={sparklineData} color={sparklineColor} height={28} />
        </div>
      )}
    </div>
  );
}
