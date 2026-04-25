'use client';

import { useState } from 'react';
import { useAdminSubscriptions } from '@/hooks/use-admin';
import { StatsCard } from '@/components/admin/stats-card';
import { DataTable } from '@/components/admin/data-table';
import { CreditCard, TrendingUp, DollarSign } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-[#ECFDF5] text-[#059669]',
  TRIAL: 'bg-[#F5F3FF] text-[#5B21B6]',
  PAST_DUE: 'bg-[#FFFBEB] text-[#D97706]',
  CANCELLED: 'bg-[#FEF2F2] text-[#DC2626]',
  EXPIRED: 'bg-[#F3F4F6] text-[#6B7280]',
};

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const perPage = 25;
  const { data, isLoading } = useAdminSubscriptions({ page, perPage });

  const columns = [
    { key: 'workspace', label: 'Workspace', render: (s: any) => <span className="font-medium text-[#111827]">{s.workspaces?.name || 'N/A'}</span> },
    { key: 'plan_tier', label: 'Plan', render: (s: any) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">{s.plan_tier}</span>
    )},
    { key: 'status', label: 'Status', render: (s: any) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[s.status] || STATUS_STYLES.EXPIRED}`}>{s.status}</span>
    )},
    { key: 'amount', label: 'Amount', render: (s: any) => s.amount ? fmt(s.amount) : 'N/A' },
    { key: 'billing_cycle', label: 'Cycle' },
    { key: 'current_period_end', label: 'Renews', render: (s: any) => fmtDate(s.current_period_end) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Subscriptions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard label="Active Subscriptions" value={data?.summary?.active ?? 0} icon={CreditCard} />
        <StatsCard label="MRR" value={fmt(data?.summary?.mrr ?? 0)} icon={TrendingUp} />
        <StatsCard label="ARR" value={fmt(data?.summary?.arr ?? 0)} icon={DollarSign} />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={Math.ceil((data?.count ?? 0) / perPage)}
        onPageChange={setPage}
      />
    </div>
  );
}
