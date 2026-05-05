// Workspace, active user and current period.
// In a real app these come from session + DB; for now they're
// the single source of truth consumed by Sidebar, TopBar, Chat, etc.

export type Workspace = {
  id: string;
  name: string;
  tradingAs: string;
  rcNumber: string;
  sector: string;
  location: string; // "Lagos · Small biz"
  avatarInitial: string;
  address: string;
  email: string;
  phone: string;
  fiscalYearEnd: string;
  baseCurrency: string;
  /** DB plan_tier value: STARTER | GROWTH | BUSINESS | PRO | FIRM | ENTERPRISE.
   *  Resolve to feature flags / quotas via lib/tiers.ts → tierFor(). */
  planTier: string;
  /** Billing cadence: MONTHLY | ANNUAL. */
  billingCycle: string;
  /** Banks the business uses, captured during onboarding. Source of truth
   *  for the Settings → Banking panel and the Bank Feeds prioritisation. */
  banks: string[];
  /** Paystack subscription state. */
  subscriptionStatus:
    | "pending"
    | "active"
    | "past_due"
    | "cancelled"
    | "non_renewing";
  /** Next renewal date (ISO) — null until first successful charge. */
  currentPeriodEnd: string | null;
  /** Timestamp the user dismissed/finished the post-onboarding tour. */
  tourCompletedAt: string | null;
  /** End of the 24-hour free-trial window. Null only on legacy data
   *  (the migration backfills, but we keep the type lenient). */
  trialEndsAt: string | null;
  /** Plan change scheduled to apply at end of current cycle. */
  pendingPlanChange:
    | {
        publicId: "growth" | "pro" | "custom";
        cycle: "MONTHLY" | "ANNUAL";
        effectiveAt: string | null;
      }
    | null;
};

export type ActiveUser = {
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
};

export type CurrentPeriod = {
  label: string;
  range: string; // "Apr 2026 · month-to-date"
};

export const WORKSPACE: Workspace = {
  id: "kadara-foods",
  name: "Kadara Foods Ltd",
  tradingAs: "Kadara",
  rcNumber: "RC 1882301",
  sector: "Food & Beverage",
  location: "Lagos · Small biz",
  avatarInitial: "K",
  address: "14 Akin Adesola Street, Victoria Island, Lagos",
  email: "finance@kadarafoods.ng",
  phone: "+234 803 004 1182",
  fiscalYearEnd: "31 December",
  baseCurrency: "Nigerian Naira (₦)",
  planTier: "GROWTH",
  billingCycle: "MONTHLY",
  banks: ["GTBank", "Zenith"],
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-05-15T00:00:00Z",
  tourCompletedAt: "2026-04-25T10:00:00Z",
  trialEndsAt: null,
  pendingPlanChange: null,
};

export const ACTIVE_USER: ActiveUser = {
  name: "Adaeze O.",
  email: "adaeze@kadarafoods.ng",
  role: "Finance Lead",
  avatarInitials: "AO",
};

export const CURRENT_PERIOD: CurrentPeriod = {
  label: "Month",
  range: "Apr 2026 · month-to-date",
};
