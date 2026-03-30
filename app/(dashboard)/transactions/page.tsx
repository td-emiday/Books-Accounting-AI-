'use client';

import { useState, useCallback } from 'react';
import { useTransactions, useDeleteTransaction } from '@/hooks/use-transactions';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { useSupabase } from '@/hooks/use-supabase';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Upload, Download, Search, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function TransactionsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { setAddTransactionOpen } = useUIStore();
  const supabase = useSupabase();
  const currency = workspace?.currency || 'NGN';
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    type: '' as '' | 'INCOME' | 'EXPENSE',
    search: '',
    page: 1,
    perPage: 25,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: result, isLoading } = useTransactions({
    type: filters.type || undefined,
    search: filters.search || undefined,
    page: filters.page,
    perPage: filters.perPage,
  });
  const deleteTx = useDeleteTransaction();

  const transactions = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / filters.perPage);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selected) {
      await deleteTx.mutateAsync(id);
    }
    setSelected(new Set());
  };

  const handleExportCSV = useCallback(async () => {
    if (!workspace) return;
    setExporting(true);

    try {
      // Fetch ALL transactions (up to 5000) for export
      let query = supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('workspace_id', workspace.id)
        .order('date', { ascending: false })
        .limit(5000);

      if (filters.type) query = (query as any).eq('type', filters.type);
      if (filters.search) query = (query as any).ilike('description', `%${filters.search}%`);

      const { data: rows } = await query;
      if (!rows || rows.length === 0) return;

      const headers = ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Category', 'Vendor/Client', 'Reference', 'Source', 'VAT Applicable', 'VAT Amount', 'WHT Applicable', 'Notes'];
      const csvRows = [
        headers.join(','),
        ...rows.map((t: any) => [
          t.date,
          t.type,
          t.amount,
          t.currency,
          t.description,
          t.categories?.name || '',
          t.vendor_client || '',
          t.reference || '',
          t.source || '',
          t.vat_applicable ? 'Yes' : 'No',
          t.vat_amount || '',
          t.wht_applicable ? 'Yes' : 'No',
          t.notes || '',
        ].map(escapeCsvField).join(',')),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emiday-transactions-${workspace.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [workspace, supabase, filters.type, filters.search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Transactions</h1>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/transactions/import" className="btn-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm">
            <Upload size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Import Statement</span>
            <span className="sm:hidden">Import</span>
          </Link>
          <button onClick={() => setAddTransactionOpen(true)} className="btn-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
            <Plus size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[rgba(108,63,232,0.10)] flex-1 min-w-[200px]">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search transactions..."
            className="bg-transparent border-none outline-none text-sm flex-1"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as any, page: 1 })}
          className="px-3 py-2 rounded-xl border border-[rgba(108,63,232,0.10)] bg-white text-sm"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <button
          onClick={handleExportCSV}
          disabled={exporting || transactions.length === 0}
          className="btn-secondary px-3 py-2 text-xs disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Download size={14} className="mr-1.5" />
          )}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-1/5 border border-brand-1/15">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-text-muted">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-1/5 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1">No transactions yet</p>
            <p className="text-xs text-text-muted mb-4">Add your first transaction or import a bank statement.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setAddTransactionOpen(true)} className="btn-primary px-4 py-2 text-xs">
                Add Transaction
              </button>
              <Link href="/transactions/import" className="btn-secondary px-4 py-2 text-xs">
                Import Statement
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === transactions.length && transactions.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-brand-1"
                    />
                  </th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Vendor / Client</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-center py-3 px-4">Source</th>
                  <th className="text-center py-3 px-4">Tax</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-t border-[rgba(108,63,232,0.06)]">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-1"
                      />
                    </td>
                    <td className="py-3 px-4 text-text-muted whitespace-nowrap text-xs">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 font-medium truncate max-w-[200px]">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {tx.vendor_client || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {tx.categories ? (
                        <span className="badge-info text-[10px]">{tx.categories.name}</span>
                      ) : (
                        <span className="text-text-muted text-xs">Uncategorised</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-[#059669]' : 'text-[#DC2626]'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount), currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] text-text-muted uppercase">{tx.source}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.vat_applicable && <span className="badge-info text-[9px] mr-1">VAT</span>}
                      {tx.wht_applicable && <span className="badge-warning text-[9px]">WHT</span>}
                      {!tx.vat_applicable && !tx.wht_applicable && <span className="text-text-muted text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(108,63,232,0.06)]">
            <p className="text-xs text-text-muted">
              Showing {(filters.page - 1) * filters.perPage + 1}–{Math.min(filters.page * filters.perPage, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="p-1.5 rounded-lg hover:bg-brand-1/5 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs px-2">{filters.page} / {totalPages}</span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-brand-1/5 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddTransactionModal />
    </div>
  );
}
