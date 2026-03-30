'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { calculateVAT, NIGERIA_VAT_RATE } from '@/lib/compliance/nigeria';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Check, Loader2 } from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';

export default function VATPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const supabase = useSupabase();
  const currency = workspace?.currency || 'NGN';
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState(false);
  const [filing, setFiling] = useState(false);
  const [filedMessage, setFiledMessage] = useState<string | null>(null);

  const { data: txResult } = useTransactions({ perPage: 500 });
  const transactions = (txResult?.data || []).map((t: any) => ({
    ...t,
    vatApplicable: t.vat_applicable ?? t.vatApplicable,
    whtApplicable: t.wht_applicable ?? t.whtApplicable,
  }));

  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0);
  const vatReturn = calculateVAT(transactions, startDate, endDate);

  const dueDate = new Date(selectedYear, selectedMonth + 1, 21);

  const handleDownloadVAT = useCallback(async () => {
    if (!workspace?.id) return;
    setDownloading(true);
    try {
      const sd = startDate.toISOString().split('T')[0];
      const ed = endDate.toISOString().split('T')[0];
      const res = await fetch(`/api/reports/download?type=vat&workspaceId=${workspace.id}&startDate=${sd}&endDate=${ed}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vat-return-${sd}-to-${ed}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('VAT PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [workspace?.id, startDate, endDate]);

  const handleMarkFiled = useCallback(async () => {
    if (!workspace?.id) return;
    setFiling(true);
    try {
      const { error } = await supabase.from('tax_periods').insert({
        workspace_id: workspace.id,
        tax_type: 'VAT',
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        status: 'FILED',
        filed_at: new Date().toISOString(),
      });
      if (error) throw error;
      setFiledMessage('VAT return marked as filed.');
      setTimeout(() => setFiledMessage(null), 3000);
    } catch (err: any) {
      setFiledMessage(err.message || 'Failed to mark as filed.');
      setTimeout(() => setFiledMessage(null), 3000);
    } finally {
      setFiling(false);
    }
  }, [workspace?.id, startDate, endDate, supabase]);
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(selectedYear, i).toLocaleDateString('en', { month: 'short', year: 'numeric' }),
    value: i,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">VAT Management</h1>
        <button onClick={handleDownloadVAT} disabled={downloading} className="btn-primary px-4 py-2 text-sm disabled:opacity-60 self-start sm:self-auto">
          {downloading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
          {downloading ? 'Downloading...' : 'Download VAT Return'}
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {months.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedMonth === m.value ? 'bg-brand-gradient text-white' : 'bg-brand-1/5 text-text-secondary hover:bg-brand-1/10'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* VAT Summary */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-inter font-bold text-sm sm:text-base">
              VAT Period: {startDate.toLocaleDateString('en', { day: 'numeric', month: 'long' })} – {endDate.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-xs text-text-muted mt-1">Due: {dueDate.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMarkFiled} disabled={filing} className="btn-secondary px-4 py-2 text-xs disabled:opacity-60">
              {filing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />}
              {filing ? 'Filing...' : 'Mark as Filed'}
            </button>
            {filedMessage && (
              <span className="text-xs text-brand-1">{filedMessage}</span>
            )}
          </div>
        </div>

        <div className="border border-[rgba(108,63,232,0.08)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[rgba(108,63,232,0.06)]">
                <td className="py-3 px-4 text-text-secondary">Output Tax (VAT collected on sales)</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(vatReturn.outputTax, currency)}</td>
              </tr>
              <tr className="border-b border-[rgba(108,63,232,0.06)]">
                <td className="py-3 px-4 text-text-secondary">Input Tax (VAT paid on purchases)</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(vatReturn.inputTax, currency)}</td>
              </tr>
              <tr className="bg-brand-1/5">
                <td className="py-3 px-4 font-semibold">Net VAT Payable to FIRS</td>
                <td className="py-3 px-4 text-right font-bold text-lg text-brand-1">{formatCurrency(vatReturn.netPayable, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* VAT Transactions */}
      <div className="glass-card p-6">
        <h3 className="font-inter font-bold text-base mb-4">
          VAT-Applicable Transactions ({vatReturn.transactions.length})
        </h3>
        {vatReturn.transactions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No VAT-applicable transactions in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2.5 px-3">Date</th>
                  <th className="text-left py-2.5 px-3">Description</th>
                  <th className="text-center py-2.5 px-3">Type</th>
                  <th className="text-right py-2.5 px-3">Amount</th>
                  <th className="text-right py-2.5 px-3">VAT (7.5%)</th>
                </tr>
              </thead>
              <tbody>
                {vatReturn.transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-[rgba(108,63,232,0.06)]">
                    <td className="py-2.5 px-3 text-text-muted text-xs">{formatDate(tx.date)}</td>
                    <td className="py-2.5 px-3 font-medium text-xs truncate max-w-[200px]">{tx.description}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={tx.type === 'INCOME' ? 'badge-success' : 'badge-danger'}>{tx.type === 'INCOME' ? 'Output' : 'Input'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(tx.amount, currency)}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-brand-1">
                      {formatCurrency(tx.amount * NIGERIA_VAT_RATE, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
