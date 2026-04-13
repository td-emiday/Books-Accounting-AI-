'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Receipt, Building2, BarChart3, Bot,
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

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-white/[0.08] text-white'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-[#818CF8]" />
        )}
        <Icon size={18} className={isActive ? 'text-[#818CF8]' : 'text-slate-500'} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 bg-gradient-to-b from-[#0F172A] to-[#131C2E] border-r border-white/[0.06] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo.png" alt="Emiday" width={150} height={42} className="h-[38px] w-auto brightness-0 invert" priority />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left hover:bg-white/[0.07] hover:border-white/[0.12] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
              {workspace?.name?.charAt(0) || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{workspace?.name || 'Select workspace'}</p>
              <p className="text-xs text-slate-500">{workspace?.businessType?.replace('_', ' ') || ''}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-500 flex-shrink-0 transition-transform ${wsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {wsDropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-[#1E293B] rounded-xl border border-[#334155] shadow-xl shadow-black/30 z-50 py-1 max-h-64 overflow-y-auto">
              {workspaces.length > 0 ? (
                workspaces.map((ws: any) => {
                  const isActive = workspace?.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] transition-all ${
                        isActive ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {ws.name?.charAt(0) || 'W'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{ws.name}</p>
                        <p className="text-xs text-slate-500">{(ws.business_type || ws.businessType || '').replace('_', ' ')}</p>
                      </div>
                      {isActive && <Check size={14} className="text-[#818CF8] flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2.5 text-sm text-slate-500">No workspaces found</p>
              )}
              <div className="border-t border-[#334155] mt-1 pt-1">
                <Link
                  href="/onboarding"
                  onClick={() => { setWsDropdownOpen(false); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.06] transition-all text-sm font-medium text-[#818CF8]"
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
          {navItems.slice(0, 6).map(renderNavItem)}

          <div className="!my-3 mx-3 border-t border-white/[0.06]" />

          {navItems.slice(6).map(renderNavItem)}

          <a
            href="mailto:hello@emiday.africa"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-150"
          >
            <HelpCircle size={18} className="text-slate-600" />
            Help & Support
          </a>
        </nav>

        {/* Theme toggle */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="text-center mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {workspace?.planTier || 'Starter'} Plan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
              {profile?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{profile?.fullName || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.email || ''}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
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
