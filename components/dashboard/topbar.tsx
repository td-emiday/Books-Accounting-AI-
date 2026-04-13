'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Bell, Search, Menu, ChevronDown, PenLine, Sun, Moon } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { toggleSidebar, setAddTransactionOpen, setImportStatementOpen, toggleTheme, theme } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setShowAddDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="font-semibold text-lg text-[#0F172A] hidden sm:block">
        {workspace?.name || 'Dashboard'}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] w-[280px] focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/10 transition-all">
        <Search size={16} className="text-[#94A3B8] flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions..."
          className="bg-transparent border-none outline-none text-sm flex-1 text-[#0F172A] placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Add Transaction */}
      <div ref={addRef} className="relative">
        <button
          onClick={() => setShowAddDropdown(!showAddDropdown)}
          className="btn-primary px-3.5 sm:px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Transaction</span>
          <ChevronDown size={12} className={`hidden sm:block transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showAddDropdown && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50">
            <button
              onClick={() => { setAddTransactionOpen(true); setShowAddDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <PenLine size={16} className="text-brand-1" />
              <div>
                <p className="font-semibold text-[#0F172A]">Enter Manually</p>
                <p className="text-xs text-[#94A3B8]">Add a single transaction</p>
              </div>
            </button>
            <div className="border-t border-[#F1F5F9]" />
            <button
              onClick={() => { router.push('/transactions/import'); setShowAddDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <Upload size={16} className="text-brand-1" />
              <div>
                <p className="font-semibold text-[#0F172A]">Upload Statement</p>
                <p className="text-xs text-[#94A3B8]">Import from CSV or bank statement</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} className="text-[#FBBF24]" /> : <Moon size={18} className="text-[#64748B]" />}
      </button>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-[#64748B]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-50 p-4">
            <p className="text-sm font-semibold text-[#0F172A] mb-2">Notifications</p>
            <p className="text-sm text-[#94A3B8] text-center py-4">No new notifications</p>
          </div>
        )}
      </div>
    </header>
  );
}
