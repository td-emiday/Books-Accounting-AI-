'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useTransactions } from '@/hooks/use-transactions';
import { calculateWHT } from '@/lib/compliance/nigeria';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Loader2 } from 'lucide-react';

export default function WHTPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const now = new Date();
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3));
  const year = now.getFullYear();

  const { data: txResult } = useTransactions({ perPage: 500 });
  const transactions = (txResult?.data || []).map((t: any) => ({
    ...t,
    vatApplicable: t.vat_applicable ?? t.vatApplicable,
    whtApplicable: t.wht_applicable ?? t.whtApplicable,
    whtRate: t.wht_rate ?? t.whtRate,
  }));

  const startDate = new Date(year, quarter * 3, 1);
  const endDate = new Date(year, quarter * 3 + 3, 0);
  const whtSummary = calculateWHT(transactions, startDate, endDate);

  const [downloading, setDownloading] = useState(false);
  const handleDownload = useCallback(async () => {
    if (!workspace?.id) return;
    setDownloading(true);
    try {
      const sd = startDate.toISOString().split('T')[0];
      const ed = endDate.toISOString().split('T')[0];
      const res = await fetch(`/api/reports/download?type=wht&workspaceId=${workspace.id}&startDate=${sd}&endDate=${ed}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wht-summary-Q${quarter + 1}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WHT PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [workspace?.id, startDate, endDate, quarter, year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Withholding Tax (WHT)</h1>
        <button onClick={handleDownload} disabled={downloading} className="btn-primary px-4 py-2 text-sm">
          {downloading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
          {downloading ? 'Downloading...' : 'Download WHT Summary (PDF)'}
        </button>
      </div>

      {/* Quarter Selector */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((q) => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              quarter === q ? 'bg-brand-gradient text-white' : 'bg-brand-1/5 text-text-secondary hover:bg-brand-1/10'
            }`}
          >
            Q{q + 1} {year}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="glass-card p-6">
        <h2 className="font-inter font-bold text-base mb-2">
          WHT Summary — Q{quarter + 1} {year}
        </h2>
        <p className="text-3xl font-inter font-bold text-brand-1 mt-4">
          {formatCurrency(whtSummary.totalWHTDeducted, currency)}
        </p>
        <p className="text-sm text-text-muted">Total WHT deducted · {whtSummary.transactions.length} transactions</p>
      </div>

      {/* WHT Transactions */}
      <div className="glass-card overflow-hidden">
        {whtSummary.transactions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">No WHT deductions this quarter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Vendor</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Invoice Amount</th>
                  <th className="text-center py-3 px-4">WHT Rate</th>
                  <th className="text-right py-3 px-4">WHT Deducted</th>
                </tr>
              </thead>
              <tbody>
                {whtSummary.transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-[rgba(108,63,232,0.06)]">
                    <td className="py-3 px-4 text-text-muted text-xs">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4 font-medium text-xs">{tx.vendorClient || '—'}</td>
                    <td className="py-3 px-4 text-xs truncate max-w-[180px]">{tx.description}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(tx.amount, currency)}</td>
                    <td className="py-3 px-4 text-center"><span className="badge-info">{((tx.whtRate || 0.10) * 100).toFixed(0)}%</span></td>
                    <td className="py-3 px-4 text-right font-semibold text-brand-1">{formatCurrency(tx.whtAmount, currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-1/5 border-t border-brand-1/10">
                  <td colSpan={5} className="py-3 px-4 font-semibold">Total WHT Deducted</td>
                  <td className="py-3 px-4 text-right font-bold text-lg text-brand-1">{formatCurrency(whtSummary.totalWHTDeducted, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
