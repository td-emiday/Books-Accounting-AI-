// Public demo dashboard. Renders the same shell as /app but seeded with
// mock data and bypassed of any auth gates. Used by the landing-page
// preview iframe so logged-out visitors can see the live UI.

import { DashboardShell } from "@/components/dashboard-shell";
import { TODAY_ISO, TRANSACTIONS } from "@/lib/data/transactions";
import { WORKSPACE, ACTIVE_USER } from "@/lib/data/workspace";
import type { WorkspaceContext } from "@/lib/queries/workspace";

export const metadata = {
  title: "Demo dashboard — Emiday",
  // Don't index the demo so it never outranks the marketing page.
  robots: { index: false, follow: false },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspaceContext = {
    workspace: WORKSPACE,
    user: ACTIVE_USER,
    firstName: ACTIVE_USER.name.split(" ")[0],
    onboarded: true,
    isNewWorkspace: false,
    channels: [] as WorkspaceContext["channels"],
  };

  return (
    <DashboardShell
      initialTransactions={TRANSACTIONS}
      workspaceContext={workspaceContext}
      todayIso={TODAY_ISO}
    >
      {children}
    </DashboardShell>
  );
}
