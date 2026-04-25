'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminWorkspaces } from '@/hooks/use-admin';
import { DataTable } from '@/components/admin/data-table';

const TIERS = ['', 'STARTER', 'GROWTH', 'BUSINESS', 'PRO', 'FIRM', 'ENTERPRISE'];

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [planTier, setPlanTier] = useState('');
  const perPage = 25;

  const { data, isLoading } = useAdminWorkspaces({ search, page, perPage, planTier: planTier || undefined });

  const columns = [
    { key: 'name', label: 'Name', render: (w: any) => <span className="font-medium text-[#111827]">{w.name}</span> },
    { key: 'owner', label: 'Owner', render: (w: any) => w.profiles?.full_name || w.profiles?.email || 'N/A' },
    { key: 'plan_tier', label: 'Plan', render: (w: any) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">{w.plan_tier}</span>
    )},
    { key: 'member_count', label: 'Members', render: (w: any) => w.member_count ?? 0 },
    { key: 'transaction_count', label: 'Transactions', render: (w: any) => w.transaction_count ?? 0 },
    { key: 'status', label: 'Status', render: (w: any) => w.suspended_at
      ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#DC2626]">Suspended</span>
      : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669]">Active</span>
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Workspaces</h1>

      <div className="flex items-center gap-3">
        <select
          value={planTier}
          onChange={(e) => { setPlanTier(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:ring-2 focus:ring-[#5B21B6] focus:border-transparent outline-none"
        >
          <option value="">All Plans</option>
          {TIERS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search workspaces..."
        page={page}
        totalPages={Math.ceil((data?.count ?? 0) / perPage)}
        onPageChange={setPage}
        onRowClick={(w: any) => router.push(`/admin/workspaces/${w.id}`)}
      />
    </div>
  );
}
