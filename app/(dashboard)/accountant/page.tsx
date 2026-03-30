'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import Link from 'next/link';
import { Building2, Plus, Clock, AlertTriangle, CheckCircle, X, Mail } from 'lucide-react';

export default function AccountantPage() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const profile = useWorkspaceStore((s) => s.profile);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const [showInviteClient, setShowInviteClient] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const sendClientInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace!.id, email: clientEmail, role: 'VIEWER' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite client');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountant-clients'] });
      setInviteStatus(data.message);
      setClientEmail('');
      setTimeout(() => { setShowInviteClient(false); setInviteStatus(null); }, 2000);
    },
    onError: (err: any) => setInviteStatus(err.message),
  });

  const { data: clientWorkspaces, isLoading } = useQuery({
    queryKey: ['accountant-clients', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', profile!.id)
        .eq('role', 'ACCOUNTANT');
      return (data || []).map((m: any) => m.workspaces).filter(Boolean);
    },
    enabled: !!profile?.id,
  });

  const clients = clientWorkspaces || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">My Clients ({clients.length})</h1>
        <button onClick={() => setShowInviteClient(true)} className="btn-primary px-4 py-2.5 text-sm">
          <Plus size={14} className="mr-1.5" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Total Clients</p>
          <p className="font-bold tabular-nums text-2xl">{clients.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Deadlines This Week</p>
          <p className="font-bold tabular-nums text-2xl text-warning">0</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Overdue</p>
          <p className="font-bold tabular-nums text-2xl text-danger">0</p>
        </div>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-text-muted">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-1/5 flex items-center justify-center">
            <Building2 size={28} className="text-brand-3" />
          </div>
          <p className="text-sm font-medium mb-1">No clients yet</p>
          <p className="text-xs text-text-muted mb-4">Add your first client to start managing their books.</p>
          <button onClick={() => setShowInviteClient(true)} className="btn-primary px-4 py-2 text-xs">Add Client</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any) => (
            <Link
              key={client.id}
              href={`/accountant/${client.id}`}
              className="metric-card group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">
                  {client.name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{client.name}</p>
                  <p className="text-xs text-text-muted">{client.industry || client.business_type}</p>
                </div>
                <span className="text-lg">
                  {client.jurisdiction === 'NG' ? '🇳🇬' : client.jurisdiction === 'GH' ? '🇬🇭' : '🇿🇦'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-info text-[10px]">{client.plan_tier}</span>
                <span className="badge-success text-[10px]">
                  <CheckCircle size={10} className="mr-0.5" /> Up to Date
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                <Clock size={12} />
                <span>Last updated {new Date(client.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              </div>
              <p className="text-xs text-brand-1 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Open Workspace →
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Invite Client Modal */}
      {showInviteClient && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowInviteClient(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] glass-card p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add Client</h3>
              <button onClick={() => setShowInviteClient(false)} className="p-1 rounded-lg hover:bg-brand-1/5"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
                  placeholder="client@company.com"
                />
              </div>
              {inviteStatus && (
                <p className="text-xs text-brand-1 text-center">{inviteStatus}</p>
              )}
              <button
                onClick={() => sendClientInvite.mutate()}
                disabled={!clientEmail || sendClientInvite.isPending}
                className="btn-primary w-full py-3 text-sm disabled:opacity-60"
              >
                <Mail size={14} className="mr-1.5" />
                {sendClientInvite.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
