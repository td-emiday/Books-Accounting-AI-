'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Receipt, Building2, BarChart3, Bot, Users,
  Settings, HelpCircle, LogOut, ChevronDown, X, Check, Plus, Landmark,
  Sun, Moon
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { useSupabase } from '@/hooks/use-supabase';
import { useWorkspaces } from '@/hooks/use-workspace';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/compliance', label: 'Compliance', icon: Building2 },
  { href: '/tax', label: 'Tax', icon: Landmark },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/ai-chat', label: 'AI Assistant', icon: Bot },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const profile = useWorkspaceStore((s) => s.profile);
  const reset = useWorkspaceStore((s) => s.reset);
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore();
  const { data: workspaces = [] } = useWorkspaces();
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchWorkspace = (ws: any) => {
    setCurrentWorkspace({
      id: ws.id,
      name: ws.name,
      ownerId: ws.owner_id || ws.ownerId,
      businessType: ws.business_type || ws.businessType,
      jurisdiction: ws.jurisdiction,
      industry: ws.industry,
      vatRegistered: ws.vat_registered ?? ws.vatRegistered,
      vatNumber: ws.vat_number || ws.vatNumber,
      tin: ws.tin,
      rcNumber: ws.rc_number || ws.rcNumber,
      currency: ws.currency,
      planTier: ws.plan_tier || ws.planTier,
      billingCycle: ws.billing_cycle || ws.billingCycle,
      trialEndsAt: ws.trial_ends_at || ws.trialEndsAt,
      createdAt: ws.created_at || ws.createdAt,
      updatedAt: ws.updated_at || ws.updatedAt,
    });
    setWsDropdownOpen(false);
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    reset();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar fixed top-0 left-0 h-screen w-[240px] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo + Close button */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#E5E7EB]">
          <Link href="/dashboard" className="font-instrument-serif italic text-xl gradient-text">
            Emiday Books
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#6B7280] hover:text-[#111827]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-left hover:bg-[#EDE9FE] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {workspace?.name?.charAt(0) || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827] truncate">{workspace?.name || 'Select workspace'}</p>
              <p className="text-xs text-[#6B7280]">{workspace?.businessType?.replace('_', ' ') || ''}</p>
            </div>
            <ChevronDown size={14} className={`text-[#6B7280] flex-shrink-0 transition-transform ${wsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Workspace Dropdown */}
          {wsDropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
              {workspaces.length > 0 ? (
                workspaces.map((ws: any) => {
                  const isActive = workspace?.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F5F3FF] transition-all ${
                        isActive ? 'bg-[#F5F3FF]' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {ws.name?.charAt(0) || 'W'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{ws.name}</p>
                        <p className="text-xs text-[#6B7280]">{(ws.business_type || ws.businessType || '').replace('_', ' ')}</p>
                      </div>
                      {isActive && <Check size={14} className="text-brand-1 flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2.5 text-sm text-[#6B7280]">No workspaces found</p>
              )}
              <div className="border-t border-[#E5E7EB] mt-1 pt-1">
                <Link
                  href="/onboarding"
                  onClick={() => { setWsDropdownOpen(false); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F5F3FF] transition-all text-sm font-medium text-brand-1"
                >
                  <Plus size={14} />
                  Create new workspace
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 pt-1 space-y-0.5 overflow-y-auto">
          {navItems.slice(0, 6).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] text-[#7b39fc] font-semibold border-l-[3px] border-[#7b39fc] shadow-sm shadow-purple-100'
                    : 'text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#374151]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#7b39fc]' : 'text-[#9CA3AF]'} />
                {item.label}
              </Link>
            );
          })}

          <div className="!my-3 mx-3 border-t border-[#E5E7EB]" />

          {navItems.slice(6).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] text-[#7b39fc] font-semibold border-l-[3px] border-[#7b39fc] shadow-sm shadow-purple-100'
                    : 'text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#374151]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#7b39fc]' : 'text-[#9CA3AF]'} />
                {item.label}
              </Link>
            );
          })}

          <a
            href="mailto:hello@emiday.africa"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#374151] transition-all duration-200"
          >
            <HelpCircle size={18} className="text-[#9CA3AF]" />
            Help & Support
          </a>
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="text-center mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F5F3FF] text-brand-1 border border-[#DDD6FE]">
              {workspace?.planTier || 'Starter'} Plan
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {profile?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">{profile?.fullName || 'User'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
