'use client';

import { useState, useEffect } from 'react';
import { useAdminSettings, useUpdateSettings } from '@/hooks/use-admin';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSettings();

  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });
  const [banner, setBanner] = useState({ enabled: false, message: '', type: 'info' });
  const [flags, setFlags] = useState({ whatsapp_integration: true, ai_chat: true, bank_import: true });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      const mm = settings.find((s: any) => s.key === 'maintenance_mode')?.value;
      const ab = settings.find((s: any) => s.key === 'announcement_banner')?.value;
      const ff = settings.find((s: any) => s.key === 'feature_flags')?.value;
      if (mm) setMaintenance(mm as any);
      if (ab) setBanner(ab as any);
      if (ff) setFlags(ff as any);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const save = async (key: string, value: Record<string, unknown>) => {
    await updateSettings.mutateAsync({ key, value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#111827]">System Settings</h1>
        <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">System Settings</h1>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Maintenance Mode</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={maintenance.enabled} onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer-checked:bg-[#5B21B6] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium text-[#374151]">{maintenance.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
          <textarea
            value={maintenance.message}
            onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
            placeholder="Maintenance message for users..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] outline-none focus:ring-2 focus:ring-[#5B21B6] resize-none"
            rows={2}
          />
          <button onClick={() => save('maintenance_mode', maintenance)} disabled={updateSettings.isPending} className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-50 transition-colors">
            {updateSettings.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Announcement Banner</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={banner.enabled} onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer-checked:bg-[#5B21B6] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium text-[#374151]">{banner.enabled ? 'Visible' : 'Hidden'}</span>
          </label>
          <input
            type="text"
            value={banner.message}
            onChange={(e) => setBanner({ ...banner, message: e.target.value })}
            placeholder="Banner message..."
            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] outline-none focus:ring-2 focus:ring-[#5B21B6]"
          />
          <select
            value={banner.type}
            onChange={(e) => setBanner({ ...banner, type: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] bg-white outline-none focus:ring-2 focus:ring-[#5B21B6]"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button onClick={() => save('announcement_banner', banner)} disabled={updateSettings.isPending} className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-50 transition-colors">
            {updateSettings.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Feature Flags</h2>
        <div className="space-y-4">
          {Object.entries(flags).map(([key, enabled]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={enabled} onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer-checked:bg-[#5B21B6] transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm font-medium text-[#374151]">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            </label>
          ))}
          <button onClick={() => save('feature_flags', flags)} disabled={updateSettings.isPending} className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] disabled:opacity-50 transition-colors">
            {updateSettings.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
