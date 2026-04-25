'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, User } from 'lucide-react';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [impersonating, setImpersonating] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => fetch(`/api/admin/users/${userId}`).then(r => r.json()),
    staleTime: 30_000,
  });

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, { method: 'POST' });
      const data = await res.json();
      if (data.link) window.open(data.link, '_blank');
      else alert(data.error || 'Failed to generate impersonation link');
    } catch { alert('Failed to impersonate'); }
    finally { setImpersonating(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827]">
          <ArrowLeft size={16} /> Back to Users
        </Link>
        <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827]">
        <ArrowLeft size={16} /> Back to Users
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] flex items-center justify-center text-white text-xl font-bold">
            {user?.full_name?.charAt(0) || <User size={24} />}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#111827]">{user?.full_name || 'N/A'}</h2>
            <p className="text-[#6B7280]">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">{user?.role}</span>
              {user?.is_superadmin && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#DC2626] text-white">Superadmin</span>}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">Joined {user?.created_at ? fmtDate(user.created_at) : 'N/A'}</p>
          </div>
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-50 transition-colors"
          >
            <ExternalLink size={14} />
            {impersonating ? 'Generating...' : 'Impersonate'}
          </button>
        </div>
      </div>

      {/* Workspaces */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Workspaces</h3>
        {user?.workspaces?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left">
                <th className="pb-3 font-medium text-[#6B7280]">Name</th>
                <th className="pb-3 font-medium text-[#6B7280]">Role</th>
                <th className="pb-3 font-medium text-[#6B7280]">Plan</th>
              </tr>
            </thead>
            <tbody>
              {user.workspaces.map((ws: any) => (
                <tr key={ws.workspace_id} className="border-b border-[#F3F4F6] hover:bg-[#F5F3FF]">
                  <td className="py-3 text-[#111827] font-medium">
                    <Link href={`/admin/workspaces/${ws.workspace_id}`} className="hover:text-[#5B21B6]">
                      {ws.workspaces?.name || ws.workspace_id}
                    </Link>
                  </td>
                  <td className="py-3 text-[#6B7280]">{ws.role}</td>
                  <td className="py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">
                      {ws.workspaces?.plan_tier || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[#9CA3AF] text-sm">No workspaces</p>
        )}
      </div>
    </div>
  );
}
