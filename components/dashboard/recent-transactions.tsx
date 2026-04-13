'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency?: string;
}

export function RecentTransactions({ transactions, currency = 'NGN' }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div>
        <div className="text-center py-8 md:py-12 px-4">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
            <FileText size={22} className="text-brand-1" />
          </div>
          <p className="text-sm font-semibold text-[#111827] mb-1">No transactions yet</p>
          <p className="text-xs md:text-sm text-[#6B7280] mb-4">
            Add your first transaction or import a bank statement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/transactions" className="btn-primary px-4 py-2 text-xs">
              Add Transaction
            </Link>
            <Link href="/transactions/import" className="btn-secondary px-4 py-2 text-xs">
              Import Statement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0.5">
        {transactions.slice(0, 6).map((tx, index) => (
          <div
            key={tx.id}
            className={`flex items-center gap-3 py-3 px-1 ${
              index < Math.min(transactions.length, 6) - 1 ? 'border-b border-[#F1F5F9]' : ''
            }`}
          >
            {/* Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'INCOME' ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'
              }`}
            >
              {tx.type === 'INCOME' ? (
                <ArrowUpRight size={15} className="text-[#059669]" />
              ) : (
                <ArrowDownRight size={15} className="text-[#DC2626]" />
              )}
            </div>

            {/* Description + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">{tx.description}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{formatDate(tx.date)}</p>
            </div>

            {/* Amount */}
            <span
              className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                tx.type === 'INCOME' ? 'text-[#059669]' : 'text-[#DC2626]'
              }`}
            >
              {tx.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(tx.amount, currency)}
            </span>
          </div>
        ))}
      </div>

      {/* View all link */}
      <Link
        href="/transactions"
        className="block text-center py-3 mt-2 text-sm font-medium text-[#4F46E5] hover:bg-[#F8FAFC] rounded-xl transition-colors"
      >
        View all transactions &rarr;
      </Link>
    </div>
  );
}
