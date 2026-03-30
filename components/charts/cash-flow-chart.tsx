'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
      <div className="bg-white rounded-xl shadow-lg border border-[#E5E7EB] p-3 text-xs">
        <p className="font-semibold text-[#111827] mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 py-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[#6B7280]">{p.name}:</span>
            <span className="font-semibold text-[#111827]">{formatCompactCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base text-[#111827]">Cash Flow</h3>
        <div className="flex gap-1 p-1 bg-[#F3F4F6] rounded-lg">
          {(['3M', '6M', '12M', 'YTD'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-white shadow-sm text-brand-1'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={filteredData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#374151' }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="income" name="Income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7b39fc" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
