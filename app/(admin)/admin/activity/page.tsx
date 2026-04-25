'use client';

import { useState } from 'react';
import { useAdminActivity } from '@/hooks/use-admin';
import { DataTable } from '@/components/admin/data-table';

const fmtDate = (d: string) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ACTION_STYLES: Record<string, string> = {
  CHANGE_PLAN: 'bg-[#F5F3FF] text-[#5B21B6]',
  SUSPEND_WORKSPACE: 'bg-[#FEF2F2] text-[#DC2626]',
  UNSUSPEND_WORKSPACE: 'bg-[#ECFDF5] text-[#059669]',
  IMPERSONATE_USER: 'bg-[#FFFBEB] text-[#D97706]',
  UPDATE_SETTINGS: 'bg-[#F3F4F6] text-[#374151]',
  UPDATE_USER: 'bg-[#F3F4F6] text-[#374151]',
};

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const perPage = 25;
  const { data, isLoading } = useAdminActivity({ page, perPage, action: action || undefined });

  const columns = [
    { key: 'admin', label: 'Admin', render: (l: any) => <span className="font-medium text-[#111827]">{l.profiles?.full_name || l.profiles?.email || 'System'}</span> },
    { key: 'action', label: 'Action', render: (l: any) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[l.action] || 'bg-[#F3F4F6] text-[#6B7280]'}`}>
        {l.action}
      </span>
    )},
    { key: 'target_type', label: 'Target', render: (l: any) => `${l.target_type}${l.target_id ? ` (${l.target_id.slice(0, 8)}...)` : ''}` },
    { key: 'metadata', label: 'Details', render: (l: any) => l.metadata ? <span className="text-xs text-[#6B7280] max-w-[200px] truncate block">{JSON.stringify(l.metadata)}</span> : '-' },
    { key: 'created_at', label: 'Time', render: (l: any) => fmtDate(l.created_at) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Activity Log</h1>

      <select
        value={action}
        onChange={(e) => { setAction(e.target.value); setPage(1); }}
        className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:ring-2 focus:ring-[#5B21B6] outline-none"
      >
        <option value="">All Actions</option>
        {Object.keys(ACTION_STYLES).map(a => <option key={a} value={a}>{a}</option>)}
      </select>

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
