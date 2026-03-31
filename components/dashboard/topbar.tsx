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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setShowAddDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-[#6B7280] hover:text-[#111827]"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Workspace name */}
      <h1 className="font-bold text-lg text-[#111827] hidden sm:block">
        {workspace?.name || 'Dashboard'}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] w-[260px]">
        <Search size={16} className="text-[#9CA3AF] flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions..."
          className="bg-transparent border-none outline-none text-sm flex-1 text-[#111827] placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Add Transaction CTA with dropdown */}
      <div ref={addRef} className="relative">
        <button
          onClick={() => setShowAddDropdown(!showAddDropdown)}
          className="btn-primary px-3 sm:px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Transaction</span>
          <ChevronDown size={12} className={`hidden sm:block transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showAddDropdown && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden z-50">
            <button
              onClick={() => { setAddTransactionOpen(true); setShowAddDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F9FAFB] transition-colors"
            >
              <PenLine size={16} className="text-brand-1" />
              <div>
                <p className="font-semibold text-[#111827]">Enter Manually</p>
                <p className="text-xs text-[#6B7280]">Add a single transaction</p>
              </div>
            </button>
            <div className="border-t border-[#F3F4F6]" />
            <button
              onClick={() => { router.push('/transactions/import'); setShowAddDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[#F9FAFB] transition-colors"
            >
              <Upload size={16} className="text-brand-1" />
              <div>
                <p className="font-semibold text-[#111827]">Upload Statement</p>
                <p className="text-xs text-[#6B7280]">Import from CSV or bank statement</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-[#F3F4F6] transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} className="text-[#fbbf24]" /> : <Moon size={18} className="text-[#6B7280]" />}
      </button>

      {/* Notification bell */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl hover:bg-[#F3F4F6] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-[#6B7280]" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 p-4">
            <p className="text-sm font-semibold text-[#111827] mb-2">Notifications</p>
            <p className="text-sm text-[#6B7280] text-center py-4">No new notifications</p>
          </div>
        )}
      </div>
    </header>
  );
}
