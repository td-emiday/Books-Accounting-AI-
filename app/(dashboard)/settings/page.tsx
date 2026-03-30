'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useSupabase } from '@/hooks/use-supabase';
import { BUSINESS_TYPES, INDUSTRIES, JURISDICTIONS } from '@/lib/constants';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const supabase = useSupabase();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: workspace?.name || '',
    industry: workspace?.industry || '',
    businessType: (workspace?.businessType || 'LIMITED_COMPANY') as string,
    vatNumber: workspace?.vatNumber || '',
    tin: workspace?.tin || '',
    rcNumber: workspace?.rcNumber || '',
    currency: workspace?.currency || 'NGN',
  });

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('workspaces')
      .update({
        name: form.name,
        industry: form.industry,
        business_type: form.businessType,
        vat_number: form.vatNumber || null,
        tin: form.tin || null,
        rc_number: form.rcNumber || null,
        currency: form.currency,
      })
      .eq('id', workspace.id);

    if (!error) {
      setCurrentWorkspace({
        ...workspace,
        name: form.name,
        industry: form.industry,
        businessType: form.businessType as any,
        vatNumber: form.vatNumber,
        tin: form.tin,
        rcNumber: form.rcNumber,
        currency: form.currency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Settings</h1>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[rgba(108,63,232,0.08)] pb-3">
        <span className="px-3 py-1.5 rounded-lg bg-brand-1/10 text-brand-1 text-sm font-medium">General</span>
        <a href="/settings/billing" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Billing</a>
        <a href="/settings/team" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Team</a>
        <a href="/settings/notifications" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Notifications</a>
        <a href="/settings/whatsapp" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">WhatsApp</a>
        <a href="/settings/documents" className="px-3 py-1.5 rounded-lg text-text-secondary text-sm font-medium hover:bg-brand-1/5">Documents</a>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Business Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Industry</label>
            <select value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm">
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Business Type</label>
            <select value={form.businessType} onChange={(e) => setForm({...form, businessType: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm">
              {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">VAT Registration Number</label>
          <input type="text" value={form.vatNumber} onChange={(e) => setForm({...form, vatNumber: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="Enter VAT number" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tax ID (TIN)</label>
            <input type="text" value={form.tin} onChange={(e) => setForm({...form, tin: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="FIRS TIN" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">CAC Number (RC)</label>
            <input type="text" value={form.rcNumber} onChange={(e) => setForm({...form, rcNumber: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm" placeholder="RC Number" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Currency</label>
          <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-[rgba(108,63,232,0.12)] bg-white focus:outline-none focus:ring-2 focus:ring-brand-2/30 text-sm">
            <option value="NGN">Nigerian Naira (₦)</option>
            <option value="GHS">Ghanaian Cedi (GH₵)</option>
            <option value="ZAR">South African Rand (R)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving...' : <><Save size={14} className="mr-1.5" /> Save Changes</>}
          </button>
          {saved && <span className="text-sm text-[#059669] font-medium">Changes saved!</span>}
        </div>
      </div>
    </div>
  );
}
