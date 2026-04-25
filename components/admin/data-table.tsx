'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      {/* Search bar */}
      {onSearchChange && (
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/20 focus:border-[#5B21B6] transition-all placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-[#F3F4F6] rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#9CA3AF]"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={(item.id as string) ?? index}
                  className={`hover:bg-[#F5F3FF] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[#374151]">
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as React.ReactNode) ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
          <p className="text-sm text-[#6B7280]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
