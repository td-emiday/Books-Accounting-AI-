// Tier configuration — the single source of truth that the marketing
// page, signup, onboarding, and feature gates all read from.
//
// Naming map:
//   - landing.ts uses lowercase ids: "growth" | "pro" | "custom"
//   - the workspaces.plan_tier column uses uppercase enum values:
//     "STARTER" | "GROWTH" | "BUSINESS" | "PRO" | "FIRM" | "ENTERPRISE"
//
// We sell three public tiers (Growth, Pro, Custom). Custom = ENTERPRISE
// in the DB. STARTER is the default a workspace gets from the bootstrap
// trigger before the user picks a plan; we treat it like a downgraded
// Growth (lower quotas, no premium features) until they choose.

export type PublicTierId = "growth" | "pro" | "custom";

export type PlanTier =
  | "STARTER"
  | "GROWTH"
  | "BUSINESS"
  | "PRO"
  | "FIRM"
  | "ENTERPRISE";

export type TierFeatureFlag =
  | "white_label_reports"
  | "audit_log"
  | "priority_support"
  | "multi_entity"
  | "sso"
  | "bespoke_integrations"
  | "dedicated_sm";

export type TierQuotas = {
  /** Bank/wallet accounts that can be connected. -1 = unlimited. */
  bankAccounts: number;
  /** Max transactions ingested per calendar month. -1 = unlimited. */
  txnsPerMonth: number;
  /** User seats on the workspace. -1 = unlimited. */
  seats: number;
  /** Client workspaces an account can manage (firms / multi-entity). */
  clientWorkspaces: number;
};

export type TierConfig = {
  /** DB enum value. */
  planTier: PlanTier;
  /** Public id used on landing + signup query string. */
  publicId: PublicTierId;
  /** Display name. */
  label: string;
  quotas: TierQuotas;
  features: Record<TierFeatureFlag, boolean>;
};

const NONE: Record<TierFeatureFlag, boolean> = {
  white_label_reports: false,
  audit_log: false,
  priority_support: false,
  multi_entity: false,
  sso: false,
  bespoke_integrations: false,
  dedicated_sm: false,
};

export const TIERS: Record<PublicTierId, TierConfig> = {
  growth: {
    planTier: "GROWTH",
    publicId: "growth",
    label: "Growth",
    quotas: {
      bankAccounts: 5,
      txnsPerMonth: 2_000,
      seats: 2,
      clientWorkspaces: 1,
    },
    features: { ...NONE },
  },
  pro: {
    planTier: "PRO",
    publicId: "pro",
    label: "Pro",
    quotas: {
      bankAccounts: -1,
      txnsPerMonth: 10_000,
      seats: -1,
      clientWorkspaces: 1,
    },
    features: {
      ...NONE,
      white_label_reports: true,
      audit_log: true,
      priority_support: true,
    },
  },
  custom: {
    planTier: "ENTERPRISE",
    publicId: "custom",
    label: "Custom",
    quotas: {
      bankAccounts: -1,
      txnsPerMonth: -1,
      seats: -1,
      clientWorkspaces: -1,
    },
    features: {
      white_label_reports: true,
      audit_log: true,
      priority_support: true,
      multi_entity: true,
      sso: true,
      bespoke_integrations: true,
      dedicated_sm: true,
    },
  },
};

/** Default a brand-new workspace gets before the user picks a plan. */
export const STARTER_TIER: TierConfig = {
  planTier: "STARTER",
  publicId: "growth", // closest public surface for any link-back
  label: "Starter",
  quotas: {
    bankAccounts: 1,
    txnsPerMonth: 250,
    seats: 1,
    clientWorkspaces: 1,
  },
  features: { ...NONE },
};

const PUBLIC_BY_PLAN: Record<PlanTier, TierConfig> = {
  STARTER: STARTER_TIER,
  GROWTH: TIERS.growth,
  BUSINESS: TIERS.pro, // legacy alias
  PRO: TIERS.pro,
  FIRM: TIERS.custom, // legacy alias
  ENTERPRISE: TIERS.custom,
};

/** Resolve a workspace's plan_tier value to its config, with a safe default. */
export function tierFor(planTier: string | null | undefined): TierConfig {
  if (!planTier) return STARTER_TIER;
  const key = planTier.toUpperCase() as PlanTier;
  return PUBLIC_BY_PLAN[key] ?? STARTER_TIER;
}

/** True when a workspace's plan unlocks the given feature. */
export function canUse(
  planTier: string | null | undefined,
  feature: TierFeatureFlag,
): boolean {
  return tierFor(planTier).features[feature];
}

/** Quota lookup. Returns -1 for unlimited. */
export function quota(
  planTier: string | null | undefined,
  key: keyof TierQuotas,
): number {
  return tierFor(planTier).quotas[key];
}

/** Validate a public id (e.g. from ?plan= query) and return the DB enum value. */
export function planTierFromPublicId(value: unknown): PlanTier | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase() as PublicTierId;
  return TIERS[v]?.planTier ?? null;
}

// ────────────────────────── Pricing & Paystack mapping ───────────────

export type BillingCycle = "MONTHLY" | "ANNUAL";

/** NGN price (monthly base) per public tier. Annual = monthly × 10
 *  (2 months free). Custom is quoted, so no client-side price. */
export const TIER_PRICE_NGN: Record<Exclude<PublicTierId, "custom">, number> = {
  growth: 85_000,
  pro: 150_000,
};

/** Compute the kobo amount Paystack should charge for one cycle. */
export function priceKoboFor(
  publicId: PublicTierId,
  cycle: BillingCycle,
): number | null {
  if (publicId === "custom") return null;
  const monthly = TIER_PRICE_NGN[publicId];
  const ngn = cycle === "ANNUAL" ? monthly * 10 : monthly;
  return ngn * 100;
}

/** Map a (tier, cycle) to the Paystack plan code from env. Returns null
 *  when the env var is missing — the caller should error helpfully. */
export function paystackPlanCodeFor(
  publicId: PublicTierId,
  cycle: BillingCycle,
): string | null {
  if (publicId === "custom") return null;
  const k =
    publicId === "growth"
      ? cycle === "MONTHLY"
        ? process.env.PAYSTACK_PLAN_GROWTH_MONTHLY
        : process.env.PAYSTACK_PLAN_GROWTH_ANNUAL
      : cycle === "MONTHLY"
        ? process.env.PAYSTACK_PLAN_PRO_MONTHLY
        : process.env.PAYSTACK_PLAN_PRO_ANNUAL;
  return k && k.length > 0 ? k : null;
}

/** Reverse: which (publicId, cycle) is this plan code? Used by the
 *  webhook so we can update the workspace tier without trusting metadata. */
export function publicTierFromPlanCode(
  code: string | null | undefined,
): { publicId: Exclude<PublicTierId, "custom">; cycle: BillingCycle } | null {
  if (!code) return null;
  const map: Array<[
    string | undefined,
    Exclude<PublicTierId, "custom">,
    BillingCycle,
  ]> = [
    [process.env.PAYSTACK_PLAN_GROWTH_MONTHLY, "growth", "MONTHLY"],
    [process.env.PAYSTACK_PLAN_GROWTH_ANNUAL,  "growth", "ANNUAL"],
    [process.env.PAYSTACK_PLAN_PRO_MONTHLY,    "pro",    "MONTHLY"],
    [process.env.PAYSTACK_PLAN_PRO_ANNUAL,     "pro",    "ANNUAL"],
  ];
  for (const [envCode, publicId, cycle] of map) {
    if (envCode === code) return { publicId, cycle };
  }
  return null;
}
