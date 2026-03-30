'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { FileText, TrendingUp, PieChart, DollarSign, BarChart3, Calendar, Download, Share2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REPORT_TYPES = [
  { id: 'pl', label: 'P&L Statement', description: 'Your profitability for any period', icon: TrendingUp },
  { id: 'cashflow', label: 'Cash Flow Statement', description: 'Money in vs money out by month', icon: BarChart3 },
  { id: 'expense-analysis', label: 'Expense Analysis', description: 'Breakdown of expenses by category', icon: PieChart },
];

const COLORS = ['#6C3FE8', '#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280', '#EC4899'];

export default function ReportsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currency = workspace?.currency || 'NGN';
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', selectedReport, workspace?.id, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/reports/${selectedReport}?workspaceId=${workspace!.id}&startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: !!selectedReport && !!workspace?.id,
  });

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (!workspace?.id || !selectedReport) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/reports/download?type=${selectedReport}&workspaceId=${workspace.id}&startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-${startDate}-to-${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [workspace?.id, selectedReport, startDate, endDate]);

  return (
    <div className="space-y-6">
      <h1 className="font-instrument-serif italic text-2xl md:text-3xl text-[#111827] tracking-tight">Financial Reports</h1>

      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className="metric-card text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-1/5 flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand-1" />
                </div>
                <h3 className="font-bold text-base mb-1">{report.label}</h3>
                <p className="text-xs text-text-muted">{report.description}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <button onClick={() => setSelectedReport(null)} className="text-sm text-text-secondary hover:text-text-primary self-start">&larr; Back to reports</button>
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[rgba(108,63,232,0.12)] text-sm" />
              <span className="text-text-muted text-sm">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[rgba(108,63,232,0.12)] text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary px-4 py-2 text-sm flex items-center"><Download size={14} className="mr-1.5" />{downloading ? 'Downloading...' : 'Download PDF'}</button>
              <button className="btn-secondary px-3 py-2 text-sm"><Share2 size={14} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card p-12 text-center text-sm text-text-muted">Generating report...</div>
          ) : reportData ? (
            <div className="glass-card p-6">
              {/* P&L Report */}
              {selectedReport === 'pl' && reportData.type === 'pl' && (
                <div className="space-y-6">
                  <h2 className="font-bold text-lg">Profit & Loss Statement</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#059669]/5 border border-[#059669]/10">
                      <p className="text-xs text-text-muted mb-1">Total Income</p>
                      <p className="font-bold tabular-nums text-xl text-[#059669]">{formatCurrency(reportData.totalIncome, currency)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#DC2626]/5 border border-[#DC2626]/10">
                      <p className="text-xs text-text-muted mb-1">Total Expenses</p>
                      <p className="font-bold tabular-nums text-xl text-[#DC2626]">{formatCurrency(reportData.totalExpenses, currency)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-brand-1/5 border border-brand-1/10">
                      <p className="text-xs text-text-muted mb-1">Net Profit</p>
                      <p className={`font-bold tabular-nums text-xl ${reportData.netProfit >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {formatCurrency(reportData.netProfit, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Income by Category</h3>
                      {Object.entries(reportData.incomeByCategory || {}).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center justify-between py-2 border-b border-[rgba(108,63,232,0.06)] text-sm">
                          <span>{cat}</span>
                          <span className="font-medium text-[#059669]">{formatCurrency(amt, currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Expenses by Category</h3>
                      {Object.entries(reportData.expensesByCategory || {}).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center justify-between py-2 border-b border-[rgba(108,63,232,0.06)] text-sm">
                          <span>{cat}</span>
                          <span className="font-medium text-[#DC2626]">{formatCurrency(amt, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Flow Report */}
              {selectedReport === 'cashflow' && reportData.type === 'cashflow' && (
                <div className="space-y-6">
                  <h2 className="font-bold text-lg">Cash Flow Statement</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthly} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,63,232,0.08)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} width={80} />
                      <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                      <Bar dataKey="income" name="Income" fill="#6C3FE8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left py-2.5 px-3">Month</th>
                        <th className="text-right py-2.5 px-3">Income</th>
                        <th className="text-right py-2.5 px-3">Expenses</th>
                        <th className="text-right py-2.5 px-3">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.monthly || []).map((m: any) => (
                        <tr key={m.month} className="border-t border-[rgba(108,63,232,0.06)]">
                          <td className="py-2.5 px-3 font-medium">{m.month}</td>
                          <td className="py-2.5 px-3 text-right text-[#059669]">{formatCurrency(m.income, currency)}</td>
                          <td className="py-2.5 px-3 text-right text-[#DC2626]">{formatCurrency(m.expense, currency)}</td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${m.net >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{formatCurrency(m.net, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expense Analysis */}
              {selectedReport === 'expense-analysis' && reportData.type === 'expense-analysis' && (
                <div className="space-y-6">
                  <h2 className="font-bold text-lg">Expense Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie data={reportData.categories || []} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60}>
                          {(reportData.categories || []).map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {(reportData.categories || []).map((cat: any, i: number) => (
                        <div key={cat.name} className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1">{cat.name}</span>
                          <span className="font-medium">{formatCurrency(cat.amount, currency)}</span>
                          <span className="text-text-muted text-xs w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
