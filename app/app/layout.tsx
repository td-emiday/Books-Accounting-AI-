import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getWorkspaceContext } from "@/lib/queries/workspace";
import { getTransactions } from "@/lib/queries/transactions";
import { TODAY_ISO as MOCK_TODAY_ISO } from "@/lib/data/transactions";
import { trialStateFor } from "@/lib/trial";

// Subscription state, tour completion, and trial countdown all change
// out-of-band (Paystack callback, webhook, cron). Force a fresh server
// render on every visit so the user sees current state immediately.
export const dynamic = "force-dynamic";

// Note on onboarding gating:
// Onboarding is a sign-up-only experience — see app/auth/actions.ts where
// signUpAction sends new users to /onboarding before they ever hit /app.
// Sign-in is "just sign me in": no detours, even if the user abandoned
// onboarding earlier. They can finish their workspace setup any time from
// Settings.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspaceContext, txnResult] = await Promise.all([
    getWorkspaceContext(),
    getTransactions(),
  ]);

  // Trial gate. Once the 24h window closes and there's no active sub,
  // any /app/* visit redirects to the upgrade page. Settings stays
  // reachable so the user can pay without a flicker dance.
  const trial = trialStateFor({
    subscriptionStatus: workspaceContext.workspace.subscriptionStatus,
    trialEndsAt: workspaceContext.workspace.trialEndsAt,
    planTier: workspaceContext.workspace.planTier,
  });
  if (trial.status === "locked") {
    redirect("/trial-expired");
  }

  // For real workspaces use the actual current date so period labels
  // ("May 2026 · month-to-date") match wall-clock reality. For empty
  // workspaces we fell back to mock data anchored to a fixed date —
  // pin "today" there too so KPIs don't render as zero for a brand
  // new account.
  const todayIso =
    txnResult.source === "live"
      ? new Date().toISOString().slice(0, 10)
      : MOCK_TODAY_ISO;

  return (
    <DashboardShell
      initialTransactions={txnResult.transactions}
      workspaceContext={workspaceContext}
      todayIso={todayIso}
    >
      {children}
    </DashboardShell>
  );
}
