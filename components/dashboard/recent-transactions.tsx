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
        <h3 className="font-bold text-sm md:text-base text-[#111827] mb-3 md:mb-4">Recent Transactions</h3>
        <div className="text-center py-8 md:py-12 px-4">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl bg-[#F5F3FF] flex items-center justify-center">
            <FileText size={22} className="text-brand-1" />
          </div>
          <p className="text-sm font-semibold text-[#111827] mb-1">No transactions yet</p>
          <p className="text-xs md:text-sm text-[#6B7280] mb-4">Add your first transaction or import a bank statement.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/transactions" className="btn-primary px-4 py-2 text-xs">Add Transaction</Link>
            <Link href="/transactions/import" className="btn-secondary px-4 py-2 text-xs">Import Statement</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="font-bold text-sm md:text-base text-[#111827]">Recent Transactions</h3>
        <Link href="/transactions" className="text-[11px] md:text-xs text-brand-1 font-semibold hover:underline">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto -mx-4 md:-mx-5">
        <table className="data-table w-full text-xs md:text-sm">
          <thead>
            <tr>
              <th className="text-left py-3 px-6">Date</th>
              <th className="text-left py-3 px-4">Description</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-right py-3 px-6">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 8).map((tx) => (
              <tr key={tx.id} className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                <td className="py-3 px-6 text-[#6B7280] whitespace-nowrap text-sm">
                  {formatDate(tx.date)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'INCOME' ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'
                    }`}>
                      {tx.type === 'INCOME'
                        ? <ArrowUpRight size={14} className="text-[#059669]" />
                        : <ArrowDownRight size={14} className="text-[#DC2626]" />
                      }
                    </div>
                    <span className="font-medium text-[#111827] truncate max-w-[200px]">
                      {tx.description}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {tx.category ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F5F3FF] text-[#7b39fc] border border-[#DDD6FE]">
                      {tx.category.name}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] text-xs">Uncategorized</span>
                  )}
                </td>
                <td className={`py-3 px-6 text-right font-semibold whitespace-nowrap ${
                  tx.type === 'INCOME' ? 'text-[#059669]' : 'text-[#DC2626]'
                }`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
