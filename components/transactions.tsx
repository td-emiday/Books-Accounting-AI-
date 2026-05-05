"use client";

// Transactions — a clean, read-only ledger view.
//
// Replaces the old "Bank & Cash" inbox. The goal here isn't to categorise
// or reconcile — it's just to show money in vs money out so an SME owner
// can scan their day at a glance. Debits and credits are colour-coded
// and labelled in plain English ("Money in" / "Money out").

import { useMemo, useState } from "react";
import { Icon } from "./icon";
import { useDashboardData, useToday } from "./dashboard-data-context";
import {
  CATEGORIES,
  fmtDate,
  type Transaction,
} from "@/lib/data/transactions";
import { filterByPeriod, summarize, windowFor } from "@/lib/period";

const catOf = (id: string | null) =>
  id ? CATEGORIES.find((c) => c.id === id) : undefined;

const fmtMoney = (n: number) =>
  "₦" + Math.abs(n).toLocaleString("en-NG");

type Filter = "all" | "in" | "out";

type Props = {
  /** Tidy preview length used by the dashboard overview tile. */
  preview?: boolean;
  limit?: number;
};

export function Transactions({ preview = false, limit }: Props) {
  const { transactions, period } = useDashboardData();
  const today = useToday();
  const [filter, setFilter] = useState<Filter>("all");

  const periodTxns = useMemo(
    () => filterByPeriod(transactions, period, today),
    [transactions, period, today],
  );

  const filtered = useMemo(() => {
    if (filter === "in") return periodTxns.filter((t) => t.amount > 0);
    if (filter === "out") return periodTxns.filter((t) => t.amount < 0);
    return periodTxns;
  }, [periodTxns, filter]);

  const cap = limit ?? (preview ? 8 : 200);
  const visible = filtered.slice(0, cap);

  const win = windowFor(period, today);
  const totals = summarize(periodTxns);
  const inflowCount = periodTxns.filter((t) => t.amount > 0).length;
  const outflowCount = periodTxns.length - inflowCount;

  return (
    <div className="card" style={{ padding: 0, overflow: "visible" }}>
      <div
        className="card-head"
        style={{
          padding: "18px 20px 14px",
          marginBottom: 0,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>
            Transactions{" "}
            <em style={{ fontStyle: "italic", color: "var(--muted)" }}>
              — {win.label}
            </em>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Money in and out across all linked accounts.
          </div>
        </div>
        <div role="tablist" aria-label="Filter" style={{ display: "flex", gap: 6 }}>
          {(
            [
              { id: "all", label: "All" },
              { id: "in",  label: "Money in" },
              { id: "out", label: "Money out" },
            ] as Array<{ id: Filter; label: string }>
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`btn${filter === f.id ? " primary" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <SummaryCell
          label="Money in"
          value={`+${fmtMoney(totals.revenue)}`}
          tone="pos"
          icon="arrowDown"
        />
        <SummaryCell
          label="Money out"
          value={`−${fmtMoney(totals.expenses)}`}
          tone="neg"
          icon="arrowUp"
        />
        <SummaryCell
          label="Net flow"
          value={`${totals.net >= 0 ? "+" : "−"}${fmtMoney(totals.net)}`}
          tone={totals.net >= 0 ? "pos" : "neg"}
          divider={false}
        />
      </div>

      {visible.length === 0 && (
        <div
          style={{
            padding: "32px 20px",
            color: "var(--muted)",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          No transactions in this period.
        </div>
      )}

      {visible.map((t) => {
        const credit = t.amount > 0;
        const cat = catOf(t.applied) ?? catOf(t.suggest);
        return (
          <div key={t.id} className="txn">
            <div
              className="logo"
              aria-hidden
              style={{
                background: credit ? "rgba(31,107,58,0.08)" : "rgba(143,42,31,0.08)",
                color: credit ? "#1f6b3a" : "#8f2a1f",
              }}
            >
              <Icon name={credit ? "arrowDown" : "arrowUp"} size={16} />
            </div>
            <div>
              <div className="name">{t.merchant}</div>
              <div className="meta">
                {fmtDate(t.date)} · {t.ref} ·{" "}
                <span style={{ color: credit ? "#1f6b3a" : "#8f2a1f" }}>
                  {credit ? "Credit" : "Debit"}
                </span>
              </div>
            </div>
            <div>
              {cat && (
                <span className="cat" style={{ pointerEvents: "none" }}>
                  <span className="sw" style={{ background: cat.color }} />
                  {cat.name}
                </span>
              )}
            </div>
            <div className={`amount ${credit ? "pos" : "neg"}`}>
              {credit ? "+" : "−"}
              {fmtMoney(t.amount)}
            </div>
          </div>
        );
      })}

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        <span>
          Showing {visible.length} of {filtered.length} · {win.label}
        </span>
        <span className="num">
          {periodTxns.length} txns · {inflowCount} in / {outflowCount} out
        </span>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
  icon,
  divider = true,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg";
  icon?: "arrowDown" | "arrowUp";
  divider?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 20px",
        borderRight: divider ? "1px solid var(--line)" : "none",
      }}
    >
      <div
        className="muted"
        style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}
      >
        {icon && <Icon name={icon} size={11} />}
        {label}
      </div>
      <div
        className="num"
        style={{
          fontSize: 20,
          marginTop: 4,
          color: tone === "pos" ? "#1f6b3a" : "#8f2a1f",
        }}
      >
        {value}
      </div>
    </div>
  );
}
