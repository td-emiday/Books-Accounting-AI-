import { DashboardShell } from "@/components/dashboard-shell";
import { TRANSACTIONS } from "@/lib/data/transactions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell initialTransactions={TRANSACTIONS}>{children}</DashboardShell>
  );
}
