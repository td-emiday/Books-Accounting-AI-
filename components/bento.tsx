"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "./icon";
import { useDashboardData, useToday } from "./dashboard-data-context";
import {
  AUTHORITIES,
  COMPLIANCE,
  TAX_LIABILITY,
} from "@/lib/data/overview";
import {
  filterByPeriod,
  filterByRange,
  previousWindow,
  summarize,
  windowFor,
  TODAY,
} from "@/lib/period";
import type { Transaction } from "@/lib/data/transactions";

const toneVar: Record<"ink" | "ink-2" | "line", string> = {
  ink: "var(--ink)",
  "ink-2": "var(--ink-2)",
  line: "var(--line-strong)",
};

type SparklineProps = {
  values: number[];
  color?: string;
  fill?: boolean;
};

function Sparkline({ values, color = "currentColor", fill = false }: SparklineProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 44;
  const pts = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
    const y = h - ((v - min) / range) * h;
    return [x, y] as const;
  });
  const d = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const dFill = d + ` L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={44}
      preserveAspectRatio="none"
    >
      {fill && <path d={dFill} fill={color} opacity={0.08} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        vectorEffect="non-scaling-stroke"
      />
      {last && <circle cx={last[0]} cy={last[1]} r={2} fill={color} />}
    </svg>
  );
}

/**
 * Builds a sparkline of `bins` evenly-sized buckets across a window of
 * `txns`, summing positives or negatives per bucket.
 */
function bucketed(
  txns: Transaction[],
  startIso: string,
  endIso: string,
  bins: number,
  sign: "in" | "out",
): number[] {
  const start = new Date(startIso + "T00:00:00Z").getTime();
  const end = new Date(endIso + "T00:00:00Z").getTime();
  const span = Math.max(1, end - start);
  const buckets = Array.from({ length: bins }, () => 0);
  for (const t of txns) {
    if (sign === "in" ? t.amount <= 0 : t.amount >= 0) continue;
    const ts = new Date(t.date + "T00:00:00Z").getTime();
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(((ts - start) / span) * bins)));
    buckets[idx] += Math.abs(t.amount);
  }
  return buckets;
}

const MONTH_LBL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Last 12 months of in/out totals from any txn list, anchored to TODAY. */
function cashflow12m(
  txns: Transaction[],
): Array<{ month: string; in: number; out: number }> {
  const anchor = TODAY;
  const months: Array<{ y: number; m: number; in: number; out: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1));
    months.push({ y: d.getUTCFullYear(), m: d.getUTCMonth(), in: 0, out: 0 });
  }
  for (const t of txns) {
    const [y, m] = t.date.split("-").map(Number);
    const slot = months.find((s) => s.y === y && s.m === m - 1);
    if (!slot) continue;
    if (t.amount >= 0) slot.in += t.amount;
    else slot.out += -t.amount;
  }
  // Convert to ₦M for readable bar heights.
  return months.map((s) => ({
    month: MONTH_LBL[s.m],
    in: Math.round(s.in / 1_000_000),
    out: Math.round(s.out / 1_000_000),
  }));
}

function CashBars({ data }: { data: ReturnType<typeof cashflow12m> }) {
  const max = Math.max(1, ...data.map((p) => Math.max(p.in, p.out)));
  return (
    <div style={{ position: "relative", paddingBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          height: 160,
        }}
      >
        {data.map((p, i) => (
          <div
            key={`${p.month}-${i}`}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 3,
                alignItems: "flex-end",
                width: "100%",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "40%",
                  height: `${(p.in / max) * 100}%`,
                  background: "var(--ink)",
                  opacity: i === data.length - 1 ? 1 : 0.88,
                  borderRadius: "3px 3px 0 0",
                }}
              />
              <div
                style={{
                  width: "40%",
                  height: `${(p.out / max) * 100}%`,
                  background: "var(--line-strong)",
                  borderRadius: "3px 3px 0 0",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                marginTop: 6,
              }}
            >
              {p.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type KpiData = {
  label: string;
  amount: number;
  trend: "up" | "down";
  changePct: string;
  changeLabel: string;
  sparkline: number[];
};

function KpiCard({ kpi }: { kpi: KpiData }) {
  const sparkColor = kpi.trend === "up" ? "var(--positive)" : "var(--ink)";
  const chipClass = kpi.trend === "up" ? "chip up" : "chip down";
  const formatted = kpi.amount.toLocaleString("en-NG");
  return (
    <div className="card metric" style={{ gridColumn: "span 4" }}>
      <div className="card-head">
        <span className="t">{kpi.label}</span>
        <button type="button" className="icon-btn" title="Expand">
          <Icon name="expand" size={14} />
        </button>
      </div>
      <div className="value">
        <sup>₦</sup>
        {formatted}
      </div>
      <div className="row">
        <span className={chipClass}>
          <Icon name="arrowUp" size={10} /> {kpi.changePct}
        </span>
        <span>{kpi.changeLabel}</span>
      </div>
      <div className="spark" style={{ color: sparkColor }}>
        <Sparkline values={kpi.sparkline} color={sparkColor} fill />
      </div>
    </div>
  );
}

function pctChange(current: number, prev: number): { trend: "up" | "down"; pct: string } {
  if (prev === 0) {
    return { trend: current >= 0 ? "up" : "down", pct: current === 0 ? "0%" : "—" };
  }
  const delta = ((current - prev) / prev) * 100;
  return {
    trend: delta >= 0 ? "up" : "down",
    pct: (delta >= 0 ? "" : "−") + Math.abs(delta).toFixed(1) + "%",
  };
}

export function Bento() {
  const { transactions, period } = useDashboardData();
  const today = useToday();

  const { revenueKpi, expensesKpi, monthly } = useMemo(() => {
    const win = windowFor(period, today);
    const prev = previousWindow(win);

    const cur = filterByPeriod(transactions, period, today);
    const prevTxns = filterByRange(transactions, prev.startIso, prev.endIso);

    const curSum = summarize(cur);
    const prevSum = summarize(prevTxns);

    const bins = Math.min(12, Math.max(4, win.days <= 7 ? 7 : win.days <= 31 ? 12 : 12));
    const revBuckets = bucketed(cur, win.startIso, win.endIso, bins, "in");
    const expBuckets = bucketed(cur, win.startIso, win.endIso, bins, "out");

    const periodLabel =
      period === "Today" ? "vs yesterday" :
      period === "Week" ? "vs prior week" :
      period === "Month" ? "vs prior period" :
      period === "Quarter" ? "vs prior quarter" :
      "vs prior year";

    const revPct = pctChange(curSum.revenue, prevSum.revenue);
    const expPct = pctChange(curSum.expenses, prevSum.expenses);

    return {
      revenueKpi: {
        label: `Revenue · ${period}`,
        amount: curSum.revenue,
        trend: revPct.trend,
        changePct: revPct.pct,
        changeLabel: periodLabel,
        sparkline: revBuckets.length ? revBuckets : [0, 0],
      } satisfies KpiData,
      expensesKpi: {
        label: `Expenses · ${period}`,
        amount: curSum.expenses,
        // For expenses, *down* is good — invert chip tone.
        trend: expPct.trend === "up" ? "down" : "up",
        changePct: expPct.pct,
        changeLabel: periodLabel,
        sparkline: expBuckets.length ? expBuckets : [0, 0],
      } satisfies KpiData,
      monthly: cashflow12m(transactions),
    };
  }, [transactions, period, today]);

  const totalLiability = TAX_LIABILITY.total.toLocaleString("en-NG");

  return (
    <div className="bento">
      <KpiCard kpi={revenueKpi} />
      <KpiCard kpi={expensesKpi} />

      <div className="card tax-liability" style={{ gridColumn: "span 4" }}>
        <div className="card-head">
          <span className="t">Tax liability · Q2</span>
          <span className="chip warn">Accruing</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="value">
            <sup>₦</sup>
            {totalLiability}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            <span className="num">{TAX_LIABILITY.dueDate}</span>{" "}
            <span style={{ fontWeight: 500, color: "var(--ink)" }}>
              · in {TAX_LIABILITY.daysToDue}d
            </span>
          </div>
        </div>

        <div className="tl-bar">
          {TAX_LIABILITY.rows.map((r) => (
            <div
              key={r.name}
              style={{
                flex: r.amount,
                background: toneVar[r.tone],
                opacity: r.tone === "ink-2" ? 0.65 : 1,
              }}
            />
          ))}
        </div>

        <div className="tl-rows">
          {TAX_LIABILITY.rows.map((r) => (
            <div key={r.name} className="tl-row">
              <span
                className="tl-dot"
                style={{
                  background: toneVar[r.tone],
                  opacity: r.tone === "ink-2" ? 0.65 : 1,
                }}
              />
              <span style={{ flex: 1 }}>
                {r.name}{" "}
                <span style={{ color: "var(--muted)" }}>{r.note}</span>
              </span>
              <span className="num">₦{r.amount.toLocaleString("en-NG")}</span>
            </div>
          ))}
        </div>

        <Link
          href="/app/tax"
          className="btn"
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: 12,
            textDecoration: "none",
          }}
        >
          <Icon name="lightning" size={12} /> Pay now
        </Link>
      </div>

      <div className="card compliance-card" style={{ gridColumn: "span 4" }}>
        <div className="card-head">
          <span className="t">Compliance health</span>
          <span className="chip up">
            <Icon name="check" size={10} /> On track
          </span>
        </div>

        <div className="comp-hero">
          <div className="comp-score">
            <div className="comp-score-n">
              {COMPLIANCE.scorePct}
              <span>%</span>
            </div>
            <div className="comp-score-l">of obligations met this quarter</div>
          </div>
          <div className="comp-streak">
            <div className="comp-streak-n">{COMPLIANCE.streakMonths}</div>
            <div className="comp-streak-l">{COMPLIANCE.streakLabel}</div>
            <div className="comp-streak-dots">
              {Array.from({ length: COMPLIANCE.streakMonths }).map((_, i) => (
                <span
                  key={i}
                  className="dot"
                  style={{
                    opacity: 0.4 + (i / COMPLIANCE.streakMonths) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="comp-authorities">
          {AUTHORITIES.map((a) => (
            <div key={a.name} className="comp-auth">
              <div className={`comp-tick ${a.state}`}>
                {a.state === "ok" ? (
                  <Icon name="check" size={11} />
                ) : (
                  <span>!</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="comp-auth-n">
                  {a.name}{" "}
                  <span className="muted" style={{ fontWeight: 400 }}>
                    · {a.sub}
                  </span>
                </div>
                <div className="comp-auth-m">{a.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ gridColumn: "span 8" }}>
        <div className="card-head">
          <span className="t">Cashflow · last 12 months</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--muted)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "var(--ink)",
                  }}
                />
                In
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "var(--line-strong)",
                  }}
                />
                Out
              </span>
            </span>
            <button type="button" className="icon-btn" title="Download">
              <Icon name="download" size={14} />
            </button>
          </div>
        </div>
        <CashBars data={monthly} />
      </div>
    </div>
  );
}
