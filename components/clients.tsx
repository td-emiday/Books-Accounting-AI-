"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { CLIENTS_AUM_DELTA_PCT, type Client, type ClientStatus } from "@/lib/data/clients";

type Filter = "all" | ClientStatus;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(0) + "k";
  return "₦" + n;
};

export function Clients({ clients }: { clients: Client[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const rows = clients.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (q === "" || c.name.toLowerCase().includes(q.toLowerCase())),
  );
  const totalReview = clients.reduce((s, c) => s + c.toReview, 0);
  const late = clients.filter((c) => c.status === "late").length;
  const healthy = clients.filter((c) => c.reconciled >= 95).length;
  const combinedRevenue = clients.reduce((s, c) => s + c.revenue, 0);
  const aumShort = "₦" + Math.round(combinedRevenue / 1_000_000) + "M";

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Clients. <em>{clients.length} workspaces, one view.</em>
          </h1>
          <p className="sub">
            Every client&apos;s books, filings and flagged items — so you can
            spend the hour where it matters.
          </p>
        </div>
        <div className="right">
          <button type="button" className="btn">
            <Icon name="download" size={13} /> Export roster
          </button>
          <button type="button" className="btn primary">
            <Icon name="plus" size={13} /> Add client
          </button>
        </div>
      </div>

      <div className="bento" style={{ marginBottom: 18 }}>
        <div className="card metric" style={{ gridColumn: "span 3" }}>
          <div className="card-head">
            <span className="t">Workspaces</span>
          </div>
          <div className="value" style={{ fontSize: 30 }}>
            {clients.length}
          </div>
          <div className="row">
            <span className="muted">{healthy} reconciled ≥ 95%</span>
          </div>
        </div>
        <div className="card metric" style={{ gridColumn: "span 3" }}>
          <div className="card-head">
            <span className="t">Needs your eyes</span>
          </div>
          <div className="value" style={{ fontSize: 30 }}>
            {totalReview}
          </div>
          <div className="row">
            <span className="chip warn">transactions flagged</span>
          </div>
        </div>
        <div className="card metric" style={{ gridColumn: "span 3" }}>
          <div className="card-head">
            <span className="t">Overdue</span>
          </div>
          <div className="value" style={{ fontSize: 30 }}>
            {late}
          </div>
          <div className="row">
            <span className="chip down">client behind</span>
          </div>
        </div>
        <div className="card metric" style={{ gridColumn: "span 3" }}>
          <div className="card-head">
            <span className="t">AUM this month</span>
          </div>
          <div className="value" style={{ fontSize: 30 }}>
            {aumShort}
          </div>
          <div className="row">
            <span className="chip up">
              <Icon name="arrowUp" size={10} /> {CLIENTS_AUM_DELTA_PCT}%
            </span>
            <span className="muted">combined revenue</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "visible" }}>
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--line)",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                background: "var(--surface-2)",
                flex: "0 0 280px",
              }}
            >
              <Icon name="search" size={13} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients…"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 12.5,
                  font: "inherit",
                  flex: 1,
                  color: "var(--ink)",
                }}
              />
            </div>
            <div
              className="seg"
              style={{
                display: "flex",
                gap: 2,
                padding: 2,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 999,
              }}
            >
              {(["all", "ok", "warn", "late"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    border:
                      filter === f
                        ? "1px solid var(--line)"
                        : "1px solid transparent",
                    background:
                      filter === f ? "var(--surface)" : "transparent",
                    padding: "5px 12px",
                    fontSize: 11.5,
                    borderRadius: 999,
                    color: filter === f ? "var(--ink)" : "var(--muted)",
                    fontFamily: "inherit",
                    fontWeight: 500,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    boxShadow:
                      filter === f ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  {f === "all"
                    ? "All"
                    : f === "ok"
                    ? "On track"
                    : f === "warn"
                    ? "Review"
                    : "Overdue"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {rows.length} of {clients.length}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr 60px",
            padding: "10px 20px",
            fontSize: 10.5,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: "1px solid var(--line)",
            fontWeight: 500,
          }}
        >
          <span>Client</span>
          <span>Reconciled</span>
          <span style={{ textAlign: "right" }}>Flagged</span>
          <span>Next deadline</span>
          <span style={{ textAlign: "right" }}>Revenue MTD</span>
          <span />
        </div>

        {rows.map((c) => (
          <div key={c.id} className="client-row">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                className="client-avatar"
                style={{
                  background:
                    c.status === "late"
                      ? "var(--danger-soft)"
                      : c.status === "warn"
                      ? "var(--warn-soft)"
                      : "var(--accent-soft)",
                  color:
                    c.status === "late"
                      ? "var(--danger)"
                      : c.status === "warn"
                      ? "var(--warn)"
                      : "var(--accent-ink)",
                }}
              >
                {c.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 550,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>
                  {c.sector} · {c.owner}
                </div>
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: "var(--line)",
                    borderRadius: 999,
                    overflow: "hidden",
                    maxWidth: 100,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${c.reconciled}%`,
                      background:
                        c.reconciled < 80
                          ? "var(--danger)"
                          : c.reconciled < 95
                          ? "var(--warn)"
                          : "var(--positive)",
                    }}
                  />
                </div>
                <span
                  className="num"
                  style={{ fontSize: 11.5, fontWeight: 500 }}
                >
                  {c.reconciled}%
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {c.toReview > 0 ? (
                <span
                  className={`chip ${c.toReview > 10 ? "down" : "warn"}`}
                >
                  {c.toReview}
                </span>
              ) : (
                <span className="chip up">
                  <Icon name="check" size={10} /> 0
                </span>
              )}
            </div>
            <div style={{ fontSize: 12 }}>
              <span
                className={
                  c.status === "late"
                    ? "chip down"
                    : c.nextDue.includes("21 Apr")
                    ? "chip warn"
                    : "chip neutral"
                }
              >
                {c.nextDue}
              </span>
            </div>
            <div
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {fmtShort(c.revenue)}
            </div>
            <div style={{ textAlign: "right" }}>
              <button type="button" className="icon-btn" title="Actions">
                <Icon name="dots" size={14} />
              </button>
            </div>
          </div>
        ))}

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
            Showing {rows.length} of {clients.length}
          </span>
          <span>
            Combined revenue{" "}
            <b className="num" style={{ color: "var(--ink)" }}>
              ₦{combinedRevenue.toLocaleString("en-NG")}
            </b>
          </span>
        </div>
      </div>
    </>
  );
}
