'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

const TIERS = ['STARTER', 'GROWTH', 'BUSINESS', 'PRO', 'FIRM', 'ENTERPRISE'];
const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminWorkspaceDetailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const queryClient = useQueryClient();
  const [newPlan, setNewPlan] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: ws, isLoading } = useQuery({
    queryKey: ['admin', 'workspace', workspaceId],
    queryFn: () => fetch(`/api/admin/workspaces/${workspaceId}`).then(r => r.json()),
    staleTime: 30_000,
  });

  const updateWorkspace = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/admin/workspaces/${workspaceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workspace', workspaceId] }),
  });

  const handleChangePlan = async () => {
    if (!newPlan) return;
    setSaving(true);
    await updateWorkspace.mutateAsync({ plan_tier: newPlan });
    setNewPlan('');
    setSaving(false);
  };

  const handleToggleSuspend = async () => {
    setSaving(true);
    if (ws?.workspace?.suspended_at) {
      await updateWorkspace.mutateAsync({ suspended_at: null, suspended_reason: null });
    } else {
      await updateWorkspace.mutateAsync({ suspended_at: new Date().toISOString(), suspended_reason: suspendReason || 'Suspended by admin' });
    }
    setSuspendReason('');
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/workspaces" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827]"><ArrowLeft size={16} /> Back</Link>
        <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB] animate-pulse" />
      </div>
    );
  }

  const workspace = ws?.workspace;
  const isSuspended = !!workspace?.suspended_at;

  return (
    <div className="space-y-6">
      <Link href="/admin/workspaces" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827]"><ArrowLeft size={16} /> Back to Workspaces</Link>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{workspace?.name}</h2>
            <p className="text-[#6B7280] text-sm mt-1">Owner: {workspace?.profiles?.full_name || workspace?.profiles?.email || 'N/A'}</p>
            <div className="flex gap-2 mt-3">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">{workspace?.plan_tier}</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151]">{workspace?.jurisdiction}</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151]">{workspace?.business_type?.replace('_', ' ')}</span>
              {isSuspended && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#DC2626]">Suspended</span>}
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF]">Created {workspace?.created_at ? fmtDate(workspace.created_at) : 'N/A'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Change Plan */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-3">Change Plan</h3>
          <div className="flex gap-2">
            <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] bg-white outline-none focus:ring-2 focus:ring-[#5B21B6]">
              <option value="">Select plan...</option>
              {TIERS.filter(t => t !== workspace?.plan_tier).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleChangePlan} disabled={!newPlan || saving} className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>

        {/* Suspend / Unsuspend */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-3">{isSuspended ? 'Unsuspend Workspace' : 'Suspend Workspace'}</h3>
          {!isSuspended && (
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] mb-3 outline-none focus:ring-2 focus:ring-[#5B21B6] resize-none"
              rows={2}
            />
          )}
          {isSuspended && <p className="text-sm text-[#6B7280] mb-3">Reason: {workspace?.suspended_reason || 'N/A'}</p>}
          <button onClick={handleToggleSuspend} disabled={saving} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isSuspended ? 'bg-[#059669] text-white hover:bg-[#047857]' : 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'}`}>
            {saving ? 'Processing...' : isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Members ({ws?.members?.length ?? 0})</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left">
              <th className="pb-3 font-medium text-[#6B7280]">Name</th>
              <th className="pb-3 font-medium text-[#6B7280]">Email</th>
              <th className="pb-3 font-medium text-[#6B7280]">Role</th>
            </tr>
          </thead>
          <tbody>
            {(ws?.members ?? []).map((m: any) => (
              <tr key={m.id} className="border-b border-[#F3F4F6]">
                <td className="py-3 text-[#111827] font-medium">{m.profiles?.full_name || 'N/A'}</td>
                <td className="py-3 text-[#6B7280]">{m.profiles?.email || 'N/A'}</td>
                <td className="py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#5B21B6]">{m.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Recent Transactions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left">
              <th className="pb-3 font-medium text-[#6B7280]">Date</th>
              <th className="pb-3 font-medium text-[#6B7280]">Description</th>
              <th className="pb-3 font-medium text-[#6B7280]">Type</th>
              <th className="pb-3 font-medium text-[#6B7280] text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(ws?.recentTransactions ?? []).map((tx: any) => (
              <tr key={tx.id} className="border-b border-[#F3F4F6]">
                <td className="py-3 text-[#6B7280]">{fmtDate(tx.date)}</td>
                <td className="py-3 text-[#111827]">{tx.description}</td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tx.type === 'INCOME' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-3 text-right font-medium text-[#111827]">{fmt(tx.amount)}</td>
              </tr>
            ))}
            {(!ws?.recentTransactions || ws.recentTransactions.length === 0) && (
              <tr><td colSpan={4} className="py-6 text-center text-[#9CA3AF]">No transactions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
