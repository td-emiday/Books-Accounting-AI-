'use client';

import { useAdminStats } from '@/hooks/use-admin';
import { StatsCard } from '@/components/admin/stats-card';
import { Users, Building2, CreditCard, TrendingUp, DollarSign, UserPlus, TrendingDown } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const PLAN_COLORS: Record<string, string> = {
  STARTER: '#5B21B6', GROWTH: '#059669', BUSINESS: '#D97706',
  PRO: '#DC2626', FIRM: '#2563EB', ENTERPRISE: '#111827',
};

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#111827]">Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E5E7EB] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatsCard label="Total Workspaces" value={stats?.totalWorkspaces ?? 0} icon={Building2} />
        <StatsCard label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} icon={CreditCard} />
        <StatsCard label="MRR" value={fmt(stats?.mrr ?? 0)} icon={TrendingUp} />
        <StatsCard label="ARR" value={fmt(stats?.arr ?? 0)} icon={DollarSign} />
        <StatsCard label="Signups This Week" value={stats?.signupsThisWeek ?? 0} icon={UserPlus} />
        <StatsCard label="Churn Rate" value={`${(stats?.churnRate ?? 0).toFixed(1)}%`} icon={TrendingDown} />
      </div>

      {/* Plan Distribution */}
      {stats?.planDistribution && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Plan Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <span
                key={plan}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: PLAN_COLORS[plan] || '#6B7280' }}
              >
                {plan} <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{count as number}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Signups */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left">
                <th className="pb-3 font-medium text-[#6B7280]">Name</th>
                <th className="pb-3 font-medium text-[#6B7280]">Email</th>
                <th className="pb-3 font-medium text-[#6B7280]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentSignups ?? []).map((user: any) => (
                <tr key={user.id} className="border-b border-[#F3F4F6] hover:bg-[#F5F3FF]">
                  <td className="py-3 text-[#111827] font-medium">{user.full_name || 'N/A'}</td>
                  <td className="py-3 text-[#6B7280]">{user.email}</td>
                  <td className="py-3 text-[#6B7280]">{fmtDate(user.created_at)}</td>
                </tr>
              ))}
              {(!stats?.recentSignups || stats.recentSignups.length === 0) && (
                <tr><td colSpan={3} className="py-8 text-center text-[#9CA3AF]">No signups yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
