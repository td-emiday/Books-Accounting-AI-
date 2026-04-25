'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminUsers } from '@/hooks/use-admin';
import { DataTable } from '@/components/admin/data-table';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 25;

  const { data, isLoading } = useAdminUsers({ search, page, perPage });

  const columns = [
    { key: 'full_name', label: 'Name', render: (u: any) => <span className="font-medium text-[#111827]">{u.full_name || 'N/A'}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (u: any) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">
        {u.role}
      </span>
    )},
    { key: 'workspace_count', label: 'Workspaces', render: (u: any) => u.workspace_count ?? 0 },
    { key: 'created_at', label: 'Joined', render: (u: any) => fmtDate(u.created_at) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Users</h1>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or email..."
        page={page}
        totalPages={Math.ceil((data?.count ?? 0) / perPage)}
        onPageChange={setPage}
        onRowClick={(u: any) => router.push(`/admin/users/${u.id}`)}
      />
    </div>
  );
}
