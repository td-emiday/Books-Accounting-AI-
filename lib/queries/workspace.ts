// Server-side loader: resolves the active workspace + profile for the
// signed-in user. Shaped to match lib/data/workspace.ts so existing UI
// consumers (Sidebar, Settings) can swap out the mock import 1:1.

import { createClient } from "@/lib/supabase/server";
import {
  WORKSPACE as MOCK_WORKSPACE,
  ACTIVE_USER as MOCK_USER,
  type Workspace,
  type ActiveUser,
} from "@/lib/data/workspace";

export type WorkspaceContext = {
  workspace: Workspace;
  user: ActiveUser;
  /** First name for greetings — falls back to email local-part. */
  firstName: string;
  /** True once the user has finished the onboarding wizard. */
  onboarded: boolean;
  /** True when this is a real authenticated workspace with no transactions
   *  yet — UI uses this to render empty tables instead of mock seed data. */
  isNewWorkspace: boolean;
  /** Per-user channel bindings (Telegram / WhatsApp). Empty until paired. */
  channels: Array<{
    provider: "telegram" | "whatsapp";
    externalId: string;
    username: string | null;
    displayName: string | null;
  }>;
};

function firstNameOf(full: string | null | undefined, email: string): string {
  if (full && full.trim()) return full.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "there";
}

function initials(name: string | null | undefined, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CURRENCY_LABELS: Record<string, string> = {
  NGN: "Nigerian Naira (₦)",
  GHS: "Ghanaian Cedi (₵)",
  ZAR: "South African Rand (R)",
  USD: "US Dollar ($)",
};

const JURISDICTION_CITY: Record<string, string> = {
  NG: "Lagos",
  GH: "Accra",
  ZA: "Johannesburg",
};

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous fallback (shouldn't happen for /app routes — proxy guards them —
  // but keeps the shape stable if someone forgets the gate).
  if (!user) {
    return {
      workspace: MOCK_WORKSPACE,
      user: MOCK_USER,
      firstName: MOCK_USER.name.split(" ")[0],
      onboarded: true,
      isNewWorkspace: false,
      channels: [],
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  // Pull the user's first workspace via membership.
  // RLS on workspaces uses workspace_members for visibility, so we query
  // workspace_members and join workspaces in one round-trip.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select(
      "role, workspace:workspaces (id, name, jurisdiction, industry, currency, rc_number, address, business_type, onboarded_at, plan_tier, billing_cycle, banks, subscription_status, current_period_end, tour_completed_at, pending_plan_change)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  type WsRow = {
    id: string;
    name: string;
    jurisdiction: string | null;
    industry: string | null;
    currency: string | null;
    rc_number: string | null;
    address: string | null;
    business_type: string | null;
    onboarded_at: string | null;
    plan_tier: string | null;
    billing_cycle: string | null;
    banks: string[] | null;
    subscription_status: string | null;
    current_period_end: string | null;
    tour_completed_at: string | null;
    pending_plan_change: {
      public_id?: string;
      cycle?: string;
      effective_at?: string;
    } | null;
  };

  // Supabase types the embedded relation as an array; we ordered+limited
  // by 1 so flatten safely.
  const wsRaw = membership?.workspace as unknown;
  const ws: WsRow | null = Array.isArray(wsRaw)
    ? ((wsRaw[0] as WsRow) ?? null)
    : ((wsRaw as WsRow | null) ?? null);
  const fullName = profile?.full_name ?? user.email ?? "Account holder";
  const userEmail = profile?.email ?? user.email ?? "";

  const userCtx: ActiveUser = {
    name: fullName,
    email: userEmail,
    role:
      profile?.role === "SME_OWNER"
        ? "Owner"
        : profile?.role === "ACCOUNTANT"
          ? "Accountant"
          : profile?.role === "ADMIN"
            ? "Admin"
            : "Member",
    avatarInitials: initials(fullName, "U"),
  };

  if (!ws) {
    // Profile exists but workspace bootstrap hasn't run — fall back to mocks
    // for the workspace half so UI doesn't blank out.
    return {
      workspace: MOCK_WORKSPACE,
      user: userCtx,
      firstName: firstNameOf(fullName, userEmail),
      onboarded: false,
      isNewWorkspace: true,
      channels: [],
    };
  }

  // Pull this user's channel bindings (Telegram, WhatsApp, …).
  const { data: channelRows } = await supabase
    .from("workspace_channels")
    .select("provider, external_id, username, display_name")
    .eq("user_id", user.id);

  const channels = (channelRows ?? []).map((c) => ({
    provider: c.provider as "telegram" | "whatsapp",
    externalId: String(c.external_id),
    username: (c.username as string | null) ?? null,
    displayName: (c.display_name as string | null) ?? null,
  }));

  // Cheap "does this workspace have any data yet?" check. We only need to
  // know whether at least one row exists, not the count — head + limit(1).
  const { count: txnCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .limit(1);
  const isNewWorkspace = (txnCount ?? 0) === 0;

  const city = ws.jurisdiction ? JURISDICTION_CITY[ws.jurisdiction] : null;
  const sizeNote = "Small biz";

  const workspace: Workspace = {
    id: ws.id,
    name: ws.name,
    tradingAs: ws.name.replace(/['’]s workspace$/i, ""),
    rcNumber: ws.rc_number ?? "—",
    sector: ws.industry ?? "General",
    location: city ? `${city} · ${sizeNote}` : sizeNote,
    avatarInitial: initials(ws.name, "W").slice(0, 1),
    address: ws.address ?? "—",
    email: userEmail,
    phone: "—",
    fiscalYearEnd: "31 December",
    baseCurrency:
      CURRENCY_LABELS[ws.currency ?? "NGN"] ?? (ws.currency ?? "NGN"),
    planTier: ws.plan_tier ?? "STARTER",
    billingCycle: ws.billing_cycle ?? "MONTHLY",
    banks: ws.banks ?? [],
    subscriptionStatus: (ws.subscription_status ?? "pending") as
      | "pending"
      | "active"
      | "past_due"
      | "cancelled"
      | "non_renewing",
    currentPeriodEnd: ws.current_period_end,
    tourCompletedAt: ws.tour_completed_at,
    pendingPlanChange:
      ws.pending_plan_change &&
      typeof ws.pending_plan_change.public_id === "string"
        ? {
            publicId: ws.pending_plan_change.public_id as
              | "growth"
              | "pro"
              | "custom",
            cycle: (ws.pending_plan_change.cycle ?? "MONTHLY") as
              | "MONTHLY"
              | "ANNUAL",
            effectiveAt: ws.pending_plan_change.effective_at ?? null,
          }
        : null,
  };

  return {
    workspace,
    user: userCtx,
    firstName: firstNameOf(fullName, userEmail),
    onboarded: Boolean(ws.onboarded_at),
    isNewWorkspace,
    channels,
  };
}
