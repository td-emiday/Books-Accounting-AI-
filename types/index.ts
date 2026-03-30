export type UserRole = 'SME_OWNER' | 'ACCOUNTANT';
export type WorkspaceTier = 'STARTER' | 'GROWTH' | 'BUSINESS' | 'PRO' | 'FIRM' | 'ENTERPRISE';
export type Jurisdiction = 'NG' | 'GH' | 'ZA';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionSource = 'MANUAL' | 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_IMPORT' | 'MONIEPOINT' | 'WHATSAPP';
export type TaxType = 'VAT' | 'WHT' | 'PAYE' | 'CIT' | 'PROVISIONAL';
export type BusinessType = 'SOLE_TRADER' | 'LIMITED_COMPANY' | 'PARTNERSHIP' | 'NGO' | 'GOVERNMENT';
export type MemberRole = 'OWNER' | 'ACCOUNTANT' | 'VIEWER';
export type TaxTreatment = 'VAT_STANDARD' | 'VAT_EXEMPT' | 'WHT_SERVICES' | 'WHT_RENT' | 'PAYE' | 'STANDARD' | 'NON_DEDUCTIBLE';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  businessType: BusinessType;
  jurisdiction: Jurisdiction;
  industry?: string;
  vatRegistered: boolean;
  vatNumber?: string;
  tin?: string;
  rcNumber?: string;
  address?: string;
  logoUrl?: string;
  currency: string;
  planTier: WorkspaceTier;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  invitedBy?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  workspaceId?: string;
  name: string;
  type: TransactionType;
  parentId?: string;
  taxTreatment?: TaxTreatment;
  icon?: string;
  color?: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  description: string;
  vendorClient?: string;
  categoryId?: string;
  categoryConfirmed: boolean;
  source: TransactionSource;
  reference?: string;
  notes?: string;
  vatApplicable: boolean;
  vatAmount?: number;
  whtApplicable: boolean;
  whtRate?: number;
  whtAmount?: number;
  receiptUrl?: string;
  reconciled: boolean;
  bankImportId?: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  category?: Category;
}

export interface BankImport {
  id: string;
  workspaceId: string;
  filename: string;
  fileUrl: string;
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: string;
  uploadDate: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  transactionCount: number;
  matchedCount: number;
  errorMessage?: string;
  parsedAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  workspaceId: string;
  fullName: string;
  email?: string;
  grossMonthlySalary: number;
  department?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  startDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxPeriod {
  id: string;
  workspaceId: string;
  periodType: TaxType;
  jurisdiction: Jurisdiction;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: 'PENDING' | 'FILED' | 'OVERDUE' | 'PAID';
  grossAmount?: number;
  taxAmount?: number;
  reportUrl?: string;
  notes?: string;
  filedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planTier: WorkspaceTier;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  paystackCustomerCode?: string;
  paystackSubscriptionCode?: string;
  paystackPlanCode?: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  amount?: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TaxDeadline {
  type: TaxType;
  label: string;
  dueDate: Date;
  period: string;
  authority: string;
  jurisdiction: Jurisdiction;
}

export interface VATReturn {
  outputTax: number;
  inputTax: number;
  netPayable: number;
  period: { startDate: Date; endDate: Date };
  transactions: Transaction[];
}

export interface WHTSummary {
  transactions: Array<Transaction & { whtAmount: number }>;
  totalWHTDeducted: number;
  period: { startDate: Date; endDate: Date };
}

export interface PAYEResult {
  grossAnnual: number;
  grossMonthly: number;
  annualPAYE: number;
  monthlyPAYE: number;
  effectiveRate: number;
  deductions: {
    pension: number;
    nhis: number;
    nhf: number;
    cra: number;
  };
}

export interface AICategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  vatApplicable: boolean;
  whtApplicable: boolean;
  reasoning: string;
}

export interface PaymentIntegration {
  id: string;
  workspaceId: string;
  provider: 'PAYSTACK' | 'FLUTTERWAVE' | 'MONIEPOINT';
  accessToken?: string;
  webhookSecret?: string;
  lastSyncAt?: string;
  syncStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
}

export interface FinancialContext {
  workspace: {
    id: string;
    name: string;
    jurisdiction: Jurisdiction;
    currency: string;
  };
  monthlySummary: Array<{
    month: string;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalAmount: number;
    count: number;
    type: TransactionType;
  }>;
  tax: {
    currentMonth: {
      vatLiability: number;
      vatCredit: number;
      netVAT: number;
    };
  };
  recentTransactions: Array<{
    date: string;
    type: TransactionType;
    amount: number;
    description: string;
    category?: string;
    vat: boolean;
  }>;
}
