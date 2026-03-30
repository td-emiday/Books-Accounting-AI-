import type { WorkspaceTier } from '@/types';
import { PLAN_LIMITS } from '@/lib/constants';

export function hasFeature(tier: WorkspaceTier, feature: string): boolean {
  const limits = PLAN_LIMITS[tier];
  return limits.features.includes(feature) || limits.features.includes('everything');
}

export function canAddUser(tier: WorkspaceTier, currentUserCount: number): boolean {
  return currentUserCount < PLAN_LIMITS[tier].users;
}

export function canImportStatement(tier: WorkspaceTier, currentMonthImports: number): boolean {
  return currentMonthImports < PLAN_LIMITS[tier].bankImportsPerMonth;
}

export function canSendAIQuery(tier: WorkspaceTier, currentMonthQueries: number): boolean {
  return currentMonthQueries < PLAN_LIMITS[tier].aiChatQueriesPerMonth;
}

export function canAddEmployee(tier: WorkspaceTier, currentEmployeeCount: number): boolean {
  return currentEmployeeCount < PLAN_LIMITS[tier].employees;
}

export function canAddClient(tier: WorkspaceTier, currentClientCount: number): boolean {
  return currentClientCount < PLAN_LIMITS[tier].clients;
}

export function getUpgradeMessage(feature: string, currentTier: WorkspaceTier): string {
  const messages: Record<string, string> = {
    full_compliance: 'Upgrade to Growth to access the full compliance engine.',
    all_reports: 'Upgrade to Growth to generate all financial reports.',
    payment_sync: 'Upgrade to Growth to auto-sync Paystack and Flutterwave.',
    ai_chat_unlimited: 'Upgrade to Growth for unlimited AI queries.',
    audit_trail: 'Upgrade to Business for full audit trail.',
    api_access: 'Upgrade to Business for API access.',
    client_workspaces: 'Upgrade to Pro to manage client workspaces.',
    white_label_reports: 'Upgrade to Pro for white-label reports.',
  };
  return messages[feature] || `This feature requires a plan upgrade from ${currentTier}.`;
}
