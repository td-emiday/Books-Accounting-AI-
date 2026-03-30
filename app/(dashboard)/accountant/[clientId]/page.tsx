'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, MessageSquare, StickyNote } from 'lucide-react';

export default function ClientWorkspacePage() {
  const { clientId } = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: workspace } = useQuery({
    queryKey: ['workspace', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', clientId)
        .single();
      return data;
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace({
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.owner_id,
        businessType: workspace.business_type,
        jurisdiction: workspace.jurisdiction,
        industry: workspace.industry,
        vatRegistered: workspace.vat_registered,
        vatNumber: workspace.vat_number,
        tin: workspace.tin,
        rcNumber: workspace.rc_number,
        currency: workspace.currency,
        planTier: workspace.plan_tier,
        billingCycle: workspace.billing_cycle,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      });
    }
  }, [workspace]);

  if (!workspace) return <div className="p-12 text-center text-sm text-text-muted">Loading workspace...</div>;

  return (
    <div className="space-y-6">
      {/* Client Banner */}
      <div className="bg-brand-gradient rounded-2xl p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Link href="/accountant" className="hover:opacity-80 transition-opacity">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-bold text-base">Viewing: {workspace.name}</p>
            <p className="text-xs text-white/70">
              {workspace.jurisdiction === 'NG' ? '🇳🇬' : workspace.jurisdiction === 'GH' ? '🇬🇭' : '🇿🇦'}{' '}
              {workspace.jurisdiction} · {workspace.plan_tier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-xs font-medium hover:bg-white/30 transition-all"
          >
            <FileText size={12} /> Generate Report
          </button>
          <button
            onClick={() => showToast('Notes feature coming soon!')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-xs font-medium hover:bg-white/30 transition-all"
          >
            <StickyNote size={12} /> Add Note
          </button>
          <button
            onClick={() => showToast('Client invite feature coming soon!')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-xs font-medium hover:bg-white/30 transition-all"
          >
            <MessageSquare size={12} /> Invite Client
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard" className="metric-card text-center py-6">
          <p className="text-sm font-medium">Dashboard</p>
        </Link>
        <Link href="/transactions" className="metric-card text-center py-6">
          <p className="text-sm font-medium">Transactions</p>
        </Link>
        <Link href="/compliance" className="metric-card text-center py-6">
          <p className="text-sm font-medium">Compliance</p>
        </Link>
        <Link href="/reports" className="metric-card text-center py-6">
          <p className="text-sm font-medium">Reports</p>
        </Link>
      </div>

      <p className="text-sm text-text-muted text-center">
        You are viewing this workspace as an accountant. All dashboard, transaction, compliance, and report pages will show this client&apos;s data.
      </p>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-1 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
