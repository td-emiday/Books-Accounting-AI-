import type { WorkspaceTier } from '@/types';

export const APP_NAME = 'Emiday Books';
export const APP_TAGLINE = 'Your AI Accountant. Built for Africa.';

export const NIGERIA_VAT_RATE = 0.075;
export const GHANA_VAT_RATE = 0.15;
export const SOUTH_AFRICA_VAT_RATE = 0.15;

export const CURRENCIES: Record<string, { code: string; symbol: string; name: string }> = {
  NG: { code: 'NGN', symbol: '\u20a6', name: 'Nigerian Naira' },
  GH: { code: 'GHS', symbol: 'GH\u20b5', name: 'Ghanaian Cedi' },
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
};

export const JURISDICTIONS = [
  { code: 'NG' as const, name: 'Nigeria', flag: '\ud83c\uddf3\ud83c\uddec', authority: 'FIRS' },
  { code: 'GH' as const, name: 'Ghana', flag: '\ud83c\uddec\ud83c\udded', authority: 'GRA' },
  { code: 'ZA' as const, name: 'South Africa', flag: '\ud83c\uddff\ud83c\udde6', authority: 'SARS' },
];

export const BUSINESS_TYPES = [
  { value: 'SOLE_TRADER' as const, label: 'Sole Trader / Freelancer' },
  { value: 'LIMITED_COMPANY' as const, label: 'Limited Company (Ltd)' },
  { value: 'PARTNERSHIP' as const, label: 'Partnership' },
  { value: 'NGO' as const, label: 'NGO / Non-Profit' },
  { value: 'GOVERNMENT' as const, label: 'Government Agency' },
];

export const INDUSTRIES = [
  'Technology',
  'E-Commerce',
  'Consulting',
  'Real Estate',
  'Healthcare',
  'Education',
  'Agriculture',
  'Manufacturing',
  'Logistics & Transport',
  'Food & Beverage',
  'Fashion & Beauty',
  'Media & Entertainment',
  'Financial Services',
  'Construction',
  'Legal Services',
  'Hospitality',
  'Oil & Gas',
  'Telecommunications',
  'Other',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Client Invoice Payment',
  'Product Sales',
  'Service Revenue',
  'Rental Income',
  'Interest Income',
  'Grant / Donation',
  'Refund Received',
  'Other Income',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Staff Salary',
  'Generator Fuel',
  'Office Rent',
  'Logistics / Delivery',
  'Marketing & Advertising',
  'Professional Services',
  'Legal Fees',
  'Accounting Fees',
  'Bank Charges',
  'Equipment Purchase',
  'Software & Subscriptions',
  'Travel & Transport',
  'Meals & Entertainment',
  'Utilities (Electricity, Water)',
  'Internet & Phone',
  'Printing & Stationery',
  'Security',
  'Maintenance & Repairs',
  'Stock / Inventory',
  'Insurance Premium',
  'Tax Payment',
  'Other Expense',
];

export const PLAN_LIMITS: Record<WorkspaceTier, {
  bankImportsPerMonth: number;
  aiChatQueriesPerMonth: number;
  users: number;
  employees: number;
  clients: number;
  features: string[];
}> = {
  STARTER: {
    bankImportsPerMonth: 3,
    aiChatQueriesPerMonth: 50,
    users: 1,
    employees: 0,
    clients: 0,
    features: ['bookkeeping', 'vat_calculator', 'pl_report', 'ai_chat_limited'],
  },
  GROWTH: {
    bankImportsPerMonth: Infinity,
    aiChatQueriesPerMonth: Infinity,
    users: 2,
    employees: 5,
    clients: 0,
    features: [
      'bookkeeping', 'full_compliance', 'all_reports', 'payment_sync',
      'ai_chat_unlimited', 'tax_calendar', 'cac_reminders',
    ],
  },
  BUSINESS: {
    bankImportsPerMonth: Infinity,
    aiChatQueriesPerMonth: Infinity,
    users: 5,
    employees: 20,
    clients: 0,
    features: [
      'bookkeeping', 'full_compliance', 'all_reports', 'payment_sync',
      'ai_chat_unlimited', 'tax_calendar', 'audit_trail', 'api_access',
    ],
  },
  PRO: {
    bankImportsPerMonth: Infinity,
    aiChatQueriesPerMonth: Infinity,
    users: 1,
    employees: Infinity,
    clients: 10,
    features: ['all_sme_features', 'client_workspaces', 'white_label_reports'],
  },
  FIRM: {
    bankImportsPerMonth: Infinity,
    aiChatQueriesPerMonth: Infinity,
    users: 5,
    employees: Infinity,
    clients: 50,
    features: [
      'all_sme_features', 'client_workspaces', 'white_label_reports',
      'bulk_reports', 'client_portal', 'internal_notes',
    ],
  },
  ENTERPRISE: {
    bankImportsPerMonth: Infinity,
    aiChatQueriesPerMonth: Infinity,
    users: Infinity,
    employees: Infinity,
    clients: Infinity,
    features: ['everything', 'api_access', 'custom_integrations', 'dedicated_support'],
  },
};

export function hasFeature(tier: WorkspaceTier, feature: string): boolean {
  const limits = PLAN_LIMITS[tier];
  return limits.features.includes(feature) || limits.features.includes('everything');
}

export const PRICING = {
  SME: {
    STARTER: { monthly: 55000, annual: 55000 * 10, label: 'Starter' },
    GROWTH: { monthly: 80000, annual: 80000 * 10, label: 'Growth' },
    BUSINESS: { monthly: 150000, annual: 150000 * 10, label: 'Business' },
  },
  ACCOUNTANT: {
    PRO: { monthly: 75000, annual: 75000 * 10, label: 'Pro' },
    FIRM: { monthly: 165000, annual: 165000 * 10, label: 'Firm' },
    ENTERPRISE: { monthly: 0, annual: 0, label: 'Enterprise' },
  },
};
