"use client";

// Single source of truth for dashboard-wide state:
//   • the seeded + uploaded transaction list
//   • the active period (Today / Week / Month / Quarter / Year)
//
// Sits at the top of the dashboard tree (DashboardShell) so the top-bar
// toggle, KPI cards, and bank inbox all read the same numbers and re-render
// together when the user changes period or imports new statements.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Transaction } from "@/lib/data/transactions";
import type { Period } from "./top-bar";

type Ctx = {
  transactions: Transaction[];
  addTransactions: (extra: Transaction[]) => void;
  period: Period;
  setPeriod: (p: Period) => void;
};

const DashboardDataCtx = createContext<Ctx | null>(null);

export function DashboardDataProvider({
  initialTransactions,
  children,
}: {
  initialTransactions: Transaction[];
  children: ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions,
  );
  const [period, setPeriod] = useState<Period>("Month");

  const addTransactions = useCallback((extra: Transaction[]) => {
    setTransactions((prev) => {
      // Prepend new ones; re-sort newest first to match the seed convention.
      const next = [...extra, ...prev];
      next.sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
      );
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ transactions, addTransactions, period, setPeriod }),
    [transactions, addTransactions, period],
  );

  return (
    <DashboardDataCtx.Provider value={value}>
      {children}
    </DashboardDataCtx.Provider>
  );
}

export function useDashboardData(): Ctx {
  const ctx = useContext(DashboardDataCtx);
  if (!ctx) {
    throw new Error(
      "useDashboardData must be used inside <DashboardDataProvider>",
    );
  }
  return ctx;
}
