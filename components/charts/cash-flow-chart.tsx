'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart
} from 'recharts';
import { formatCompactCurrency } from '@/lib/utils';

interface CashFlowChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  currency?: string;
}

export function CashFlowChart({ data, currency = 'NGN' }: CashFlowChartProps) {
  const [period, setPeriod] = useState<'3M' | '6M' | '12M' | 'YTD'>('6M');

  const filteredData = (() => {
    const now = new Date();
    switch (period) {
      case '3M': return data.slice(-3);
      case '6M': return data.slice(-6);
      case 'YTD': {
        const jan = data.findIndex(d => d.month.startsWith(`${now.getFullYear()}`));
        return jan >= 0 ? data.slice(jan) : data;
      }
      default: return data;
    }
  })();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-[#E2E8F0]/50 p-4 text-xs">
        <p className="font-semibold text-[#0F172A] mb-2.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2.5 py-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.stroke }} />
            <span className="text-[#64748B]">{p.name}:</span>
            <span className="font-semibold text-[#0F172A] tabular-nums">{formatCompactCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-1 p-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          {(['3M', '6M', '12M', 'YTD'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? 'bg-white shadow-sm text-[#4F46E5] border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={filteredData} barGap={8} barSize={28}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#FECACA" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
            width={75}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.04)' }} />
          <Bar dataKey="income" name="Income" fill="url(#incomeGrad)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill="url(#expenseGrad)" radius={[10, 10, 0, 0]} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke="#059669"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-b from-[#4F46E5] to-[#818CF8]" />
          <span className="text-xs font-medium text-[#64748B]">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-b from-[#F87171] to-[#FECACA]" />
          <span className="text-xs font-medium text-[#64748B]">Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t-2 border-dashed border-[#059669]" />
          <span className="text-xs font-medium text-[#64748B]">Net</span>
        </div>
      </div>
    </div>
  );
}
