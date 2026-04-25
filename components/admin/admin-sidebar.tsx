'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  ScrollText,
  Settings,
  LogOut,
  X,
  Shield,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/workspaces', label: 'Workspaces', icon: Building2 },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/activity', label: 'Activity Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  profile: {
    full_name: string;
    email: string;
  };
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabase();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
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
        {/* Logo + Admin badge + Close button */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="font-instrument-serif italic text-xl gradient-text">
              Emiday
            </Link>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#5B21B6] text-white">
              <Shield size={10} />
              Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#6B7280] hover:text-[#111827]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] text-[#5B21B6] font-semibold border-l-[3px] border-[#5B21B6] shadow-sm shadow-purple-100'
                    : 'text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#374151]'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#5B21B6]' : 'text-[#9CA3AF]'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to Dashboard */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#374151] transition-all duration-200 border border-[#E5E7EB]"
          >
            <ArrowLeft size={16} className="text-[#9CA3AF]" />
            Back to Dashboard
          </Link>
        </div>

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

        {/* Profile section at bottom */}
        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {profile.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">
                {profile.full_name || 'Admin'}
              </p>
              <p className="text-[11px] text-[#6B7280] truncate">{profile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors disabled:opacity-50"
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
