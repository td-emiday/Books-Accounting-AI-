import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  const symbols: Record<string, string> = {
    NGN: '\u20a6',
    GHS: 'GH\u20b5',
    ZAR: 'R',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-NG', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactCurrency(amount: number, currency = 'NGN'): string {
  const symbols: Record<string, string> = {
    NGN: '\u20a6',
    GHS: 'GH\u20b5',
    ZAR: 'R',
  };
  const symbol = symbols[currency] || currency;
  if (amount >= 1_000_000_000) return `${symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(date: string | Date): number {
  const d = new Date(date);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDeadlineStatus(dueDate: string | Date): 'overdue' | 'urgent' | 'upcoming' | 'normal' {
  const days = daysUntil(dueDate);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'upcoming';
  return 'normal';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
