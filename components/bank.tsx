"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icon";
import { useDashboardData, useToday } from "./dashboard-data-context";
import {
  CATEGORIES,
  fmtDate,
  type Transaction,
} from "@/lib/data/transactions";
import { PRIMARY_BANK_META } from "@/lib/data/bank-account";
import { filterByPeriod, summarize, windowFor } from "@/lib/period";

const catOf = (id: string | null) =>
  id ? CATEGORIES.find((c) => c.id === id) : undefined;

const fmt = (n: number) =>
  (n < 0 ? "−" : "+") + "₦" + Math.abs(n).toLocaleString();

type Props = {
  /** When true, cap the inbox to a tidy preview length. */
  preview?: boolean;
  /** Cap (default 12 in preview mode, 200 otherwise). */
  limit?: number;
};

export function Bank({ preview = false, limit }: Props) {
  const { transactions, period } = useDashboardData();
  const today = useToday();
  // Local override map: { txnId -> applied category id }.
  // We don't mutate context — categorisation is UI-only.
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);

  const applied = (t: Transaction) =>
    overrides[t.id] !== undefined ? overrides[t.id] : t.applied;

  const periodTxns = useMemo(
    () => filterByPeriod(transactions, period, today),
    [transactions, period, today],
  );

  const cap = limit ?? (preview ? 12 : 200);
  const visible = periodTxns.slice(0, cap);

  const uncategorised = periodTxns.filter((t) => applied(t) === null).length;
  const autoApplyCandidates = periodTxns.filter(
    (t) => applied(t) === null && t.conf >= 85,
  );

  const win = windowFor(period, today);
  const totals = summarize(periodTxns);
  const net = totals.net;

  const applyCat = (id: number, catId: string) => {
    setOverrides((m) => ({ ...m, [id]: catId }));
    setOpen(null);
  };

  const autoApply = () => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const t of autoApplyCandidates) next[t.id] = t.suggest;
      return next;
    });
  };

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
            Inbox{" "}
            <em style={{ fontStyle: "italic", color: "var(--muted)" }}>
              — {uncategorised} to categorise
            </em>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {PRIMARY_BANK_META.name} · {PRIMARY_BANK_META.accountMask} · synced{" "}
            {PRIMARY_BANK_META.lastSynced}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn">
            <Icon name="filter" size={13} /> Filter
          </button>
          <button type="button" className="btn">
            <Icon name="refresh" size={13} /> Sync
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={autoApply}
            disabled={autoApplyCandidates.length === 0}
          >
            <Icon name="sparkle" size={13} /> Auto-apply{" "}
            {autoApplyCandidates.length}
          </button>
        </div>
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
        const cat = catOf(applied(t));
        const suggest = catOf(t.suggest);
        return (
          <div key={t.id} className="txn" style={{ position: "relative" }}>
            <div className="logo">{t.initial}</div>
            <div>
              <div className="name">{t.merchant}</div>
              <div className="meta">
                {fmtDate(t.date)} · {t.ref}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              {cat ? (
                <button
                  className="cat"
                  onClick={() => setOpen(open === t.id ? null : t.id)}
                >
                  <span className="sw" style={{ background: cat.color }} />
                  {cat.name}
                  <span className="conf">{t.conf}%</span>
                </button>
              ) : (
                <button
                  className="cat suggest"
                  onClick={() => setOpen(open === t.id ? null : t.id)}
                >
                  <span className="sparkle">
                    <Icon name="sparkle" size={11} />
                  </span>
                  Suggest: {suggest?.name}
                  <span className="conf">{t.conf}%</span>
                </button>
              )}
              {open === t.id && (
                <div className="cat-pop">
                  <div className="search-in">
                    <Icon name="search" size={12} />
                    <span>Change category</span>
                  </div>
                  {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => applyCat(t.id, c.id)}>
                      <span className="sw" style={{ background: c.color }} />
                      {c.name}
                      {c.id === t.suggest && (
                        <span className="suggest">AI pick</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`amount ${t.amount < 0 ? "neg" : "pos"}`}>
              {fmt(t.amount)}
            </div>
            <button type="button" className="icon-btn" title="Actions">
              <Icon name="dots" size={14} />
            </button>
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
          Showing {visible.length} of {periodTxns.length} · {win.label}
        </span>
        <span className="num">
          Net flow ·{" "}
          <b style={{ color: "var(--ink)" }}>
            {net >= 0 ? "+" : "−"}₦{Math.abs(net).toLocaleString("en-NG")}
          </b>
        </span>
      </div>
    </div>
  );
}
