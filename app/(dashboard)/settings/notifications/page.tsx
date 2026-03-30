'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSupabase } from '@/hooks/use-supabase';
import { Bell, Mail, Calendar, TrendingUp, AlertTriangle, Save } from 'lucide-react';

interface NotificationPrefs {
  emailTaxDeadlines: boolean;
  emailWeeklySummary: boolean;
  emailLargeTransactions: boolean;
  emailComplianceAlerts: boolean;
  largeTransactionThreshold: number;
  deadlineReminderDays: number;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailTaxDeadlines: true,
  emailWeeklySummary: true,
  emailLargeTransactions: false,
  emailComplianceAlerts: true,
  largeTransactionThreshold: 500000,
  deadlineReminderDays: 7,
};

export default function NotificationSettingsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    // Load notification prefs from workspace metadata or use defaults
    const loadPrefs = async () => {
      const { data } = await supabase
        .from('workspaces')
        .select('metadata')
        .eq('id', workspace.id)
        .single();
      if (data?.metadata?.notificationPrefs) {
        setPrefs({ ...DEFAULT_PREFS, ...data.metadata.notificationPrefs });
      }
    };
    loadPrefs();
  }, [workspace, supabase]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    setSaved(false);

    const { data: current } = await supabase
      .from('workspaces')
      .select('metadata')
      .eq('id', workspace.id)
      .single();

    await supabase
      .from('workspaces')
      .update({
        metadata: { ...(current?.metadata || {}), notificationPrefs: prefs },
      })
      .eq('id', workspace.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-1' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Settings</h1>

      {/* Navigation */}
      <div className="flex gap-2 border-b border-[rgba(108,63,232,0.08)] pb-3">
        <a href="/settings" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">General</a>
        <a href="/settings/billing" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Billing</a>
        <a href="/settings/team" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Team</a>
        <span className="px-3 py-1.5 rounded-lg bg-brand-1/10 text-brand-1 text-sm font-medium">Notifications</span>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={20} className="text-brand-1" />
          <h2 className="font-inter font-bold text-lg">Email Notifications</h2>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm font-medium">Tax Deadline Reminders</p>
                <p className="text-xs text-text-secondary">Get notified before upcoming tax deadlines</p>
              </div>
            </div>
            <Toggle checked={prefs.emailTaxDeadlines} onChange={(v) => setPrefs({ ...prefs, emailTaxDeadlines: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm font-medium">Weekly Financial Summary</p>
                <p className="text-xs text-text-secondary">Receive a weekly summary of your financial activity</p>
              </div>
            </div>
            <Toggle checked={prefs.emailWeeklySummary} onChange={(v) => setPrefs({ ...prefs, emailWeeklySummary: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm font-medium">Large Transaction Alerts</p>
                <p className="text-xs text-text-secondary">Get notified when a transaction exceeds a threshold</p>
              </div>
            </div>
            <Toggle checked={prefs.emailLargeTransactions} onChange={(v) => setPrefs({ ...prefs, emailLargeTransactions: v })} />
          </div>

          {prefs.emailLargeTransactions && (
            <div className="pl-9">
              <label className="block text-sm font-medium mb-1.5">Threshold Amount (NGN)</label>
              <input
                type="number"
                value={prefs.largeTransactionThreshold}
                onChange={(e) => setPrefs({ ...prefs, largeTransactionThreshold: Number(e.target.value) })}
                className="w-48 px-4 py-2.5 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm font-medium">Compliance Alerts</p>
                <p className="text-xs text-text-secondary">Alerts when compliance scores drop or filings are overdue</p>
              </div>
            </div>
            <Toggle checked={prefs.emailComplianceAlerts} onChange={(v) => setPrefs({ ...prefs, emailComplianceAlerts: v })} />
          </div>
        </div>

        <div className="border-t border-[rgba(108,63,232,0.08)] pt-5">
          <label className="block text-sm font-medium mb-1.5">Deadline Reminder Lead Time</label>
          <select
            value={prefs.deadlineReminderDays}
            onChange={(e) => setPrefs({ ...prefs, deadlineReminderDays: Number(e.target.value) })}
            className="w-48 px-4 py-2.5 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm"
          >
            <option value={3}>3 days before</option>
            <option value={5}>5 days before</option>
            <option value={7}>7 days before</option>
            <option value={14}>14 days before</option>
            <option value={30}>30 days before</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving...' : <><Save size={14} className="mr-1.5" /> Save Preferences</>}
          </button>
          {saved && <span className="text-sm text-[#059669] font-medium">Preferences saved!</span>}
        </div>
      </div>
    </div>
  );
}
