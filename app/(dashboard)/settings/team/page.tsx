'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Plus, X, Mail, UserPlus } from 'lucide-react';

export default function TeamPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ACCOUNTANT' | 'VIEWER'>('VIEWER');

  const { data: members, isLoading } = useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workspace_members')
        .select('*, profiles(full_name, email, avatar_url)')
        .eq('workspace_id', workspace!.id);
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace-members'] }),
  });

  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const sendInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace!.id, email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      setInviteStatus(data.message);
      setInviteEmail('');
      setTimeout(() => { setShowInvite(false); setInviteStatus(null); }, 2000);
    },
    onError: (err: any) => setInviteStatus(err.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Team</h1>

      <div className="flex gap-2 border-b border-[rgba(108,63,232,0.08)] pb-3">
        <a href="/settings" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">General</a>
        <a href="/settings/billing" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Billing</a>
        <span className="px-3 py-1.5 rounded-lg bg-brand-1/10 text-brand-1 text-sm font-medium">Team</span>
        <a href="/settings/notifications" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Notifications</a>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-inter font-bold text-base text-[#111827]">Members</h2>
          <button onClick={() => setShowInvite(true)} className="btn-primary px-4 py-2 text-xs">
            <UserPlus size={14} className="mr-1.5" /> Invite Member
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-text-muted py-8 text-center">Loading members...</p>
        ) : (
          <div className="space-y-2">
            {(members || []).map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-1/3 transition-all">
                <div className="w-9 h-9 rounded-full bg-brand-3/20 flex items-center justify-center text-brand-1 text-xs font-bold flex-shrink-0">
                  {member.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">{member.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-text-muted">{member.profiles?.email}</p>
                </div>
                <span className={`badge-${member.role === 'OWNER' ? 'info' : member.role === 'ACCOUNTANT' ? 'success' : 'warning'} text-[10px]`}>
                  {member.role}
                </span>
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMember.mutate(member.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                    aria-label="Remove member"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setShowInvite(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] glass-card p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-inter font-bold text-lg text-[#111827]">Invite Member</h3>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-brand-1/5"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#111827]">Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="colleague@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[#111827]">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm">
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                </select>
              </div>
              {inviteStatus && (
                <p className="text-xs text-brand-1 text-center">{inviteStatus}</p>
              )}
              <button
                onClick={() => sendInvite.mutate()}
                disabled={!inviteEmail || sendInvite.isPending}
                className="btn-primary w-full py-3 text-sm disabled:opacity-60"
              >
                <Mail size={14} className="mr-1.5" /> {sendInvite.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
