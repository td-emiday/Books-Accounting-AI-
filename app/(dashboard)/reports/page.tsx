'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { FileText, TrendingUp, PieChart, DollarSign, BarChart3, Calendar, Download, Share2, ArrowLeft } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REPORT_TYPES = [
  { id: 'pl', label: 'P&L Statement', description: 'Your profitability for any period', icon: TrendingUp },
  { id: 'cashflow', label: 'Cash Flow Statement', description: 'Money in vs money out by month', icon: BarChart3 },
  { id: 'expense-analysis', label: 'Expense Analysis', description: 'Breakdown of expenses by category', icon: PieChart },
];

const COLORS = ['#4F46E5', '#818CF8', '#C7D2FE', '#10B981', '#34D399', '#F59E0B', '#EF4444', '#3B82F6', '#64748B', '#EC4899'];

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
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-1">Analytics</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">Financial Reports</h1>
      </div>

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
                <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon size={22} className="text-[#4F46E5]" />
                </div>
                <h3 className="font-bold text-base text-[#0F172A] mb-1">{report.label}</h3>
                <p className="text-sm text-[#94A3B8]">{report.description}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <button onClick={() => setSelectedReport(null)} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] self-start transition-colors">
              <ArrowLeft size={14} />
              Back to reports
            </button>
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all" />
              <span className="text-[#94A3B8] text-sm">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadPDF} disabled={downloading} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5">
                <Download size={14} />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button className="btn-secondary px-3 py-2.5 text-sm"><Share2 size={14} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card p-16 text-center">
              <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="glass-card p-6 md:p-8">
              {/* P&L Report */}
              {selectedReport === 'pl' && reportData.type === 'pl' && (
                <div className="space-y-8">
                  <h2 className="font-bold text-xl text-[#0F172A]">Profit & Loss Statement</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                      <p className="text-xs text-[#059669] font-medium mb-1">Total Income</p>
                      <p className="font-bold tabular-nums text-2xl text-[#059669]">{formatCurrency(reportData.totalIncome, currency)}</p>
                    </div>
                    <div className="p-5 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                      <p className="text-xs text-[#EF4444] font-medium mb-1">Total Expenses</p>
                      <p className="font-bold tabular-nums text-2xl text-[#EF4444]">{formatCurrency(reportData.totalExpenses, currency)}</p>
                    </div>
                    <div className="p-5 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
                      <p className="text-xs text-[#4F46E5] font-medium mb-1">Net Profit</p>
                      <p className={`font-bold tabular-nums text-2xl ${reportData.netProfit >= 0 ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
                        {formatCurrency(reportData.netProfit, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-sm text-[#0F172A] mb-3">Income by Category</h3>
                      {Object.entries(reportData.incomeByCategory || {}).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] text-sm">
                          <span className="text-[#475569]">{cat}</span>
                          <span className="font-semibold text-[#059669] tabular-nums">{formatCurrency(amt, currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#0F172A] mb-3">Expenses by Category</h3>
                      {Object.entries(reportData.expensesByCategory || {}).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] text-sm">
                          <span className="text-[#475569]">{cat}</span>
                          <span className="font-semibold text-[#EF4444] tabular-nums">{formatCurrency(amt, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Flow Report */}
              {selectedReport === 'cashflow' && reportData.type === 'cashflow' && (
                <div className="space-y-8">
                  <h2 className="font-bold text-xl text-[#0F172A]">Cash Flow Statement</h2>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={reportData.monthly} barGap={6} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => formatCurrency(v, currency)} width={80} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                      <Bar dataKey="income" name="Income" fill="url(#reportIncomeGrad)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#E2E8F0" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="reportIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" />
                          <stop offset="100%" stopColor="#818CF8" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4">Month</th>
                        <th className="text-right py-3 px-4">Income</th>
                        <th className="text-right py-3 px-4">Expenses</th>
                        <th className="text-right py-3 px-4">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.monthly || []).map((m: any) => (
                        <tr key={m.month} className="border-t border-[#F1F5F9]">
                          <td className="py-3 px-4 font-medium text-[#0F172A]">{m.month}</td>
                          <td className="py-3 px-4 text-right text-[#059669] tabular-nums">{formatCurrency(m.income, currency)}</td>
                          <td className="py-3 px-4 text-right text-[#EF4444] tabular-nums">{formatCurrency(m.expense, currency)}</td>
                          <td className={`py-3 px-4 text-right font-semibold tabular-nums ${m.net >= 0 ? 'text-[#059669]' : 'text-[#EF4444]'}`}>{formatCurrency(m.net, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expense Analysis */}
              {selectedReport === 'expense-analysis' && reportData.type === 'expense-analysis' && (
                <div className="space-y-8">
                  <h2 className="font-bold text-xl text-[#0F172A]">Expense Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie data={reportData.categories || []} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={70} strokeWidth={2} stroke="#fff">
                          {(reportData.categories || []).map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {(reportData.categories || []).map((cat: any, i: number) => (
                        <div key={cat.name} className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-[#475569]">{cat.name}</span>
                          <span className="font-semibold text-[#0F172A] tabular-nums">{formatCurrency(cat.amount, currency)}</span>
                          <span className="text-[#94A3B8] text-xs w-14 text-right tabular-nums">{cat.percentage.toFixed(1)}%</span>
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
