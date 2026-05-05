"use client";

import { useState } from "react";
import { Icon } from "./icon";
import type { Invoice, InvoiceStatus } from "@/lib/data/invoices";

type Filter = "all" | InvoiceStatus;

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  overdue: "Overdue",
  paid: "Paid",
  void: "Void",
};

const fmtN = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });

function StatusChip({ status, daysLeft }: { status: InvoiceStatus; daysLeft: number }) {
  if (status === "paid")
    return (
      <span className="chip up">
        <Icon name="check" size={10} /> Paid
      </span>
    );
  if (status === "overdue")
    return (
      <span className="chip down">
        {Math.abs(daysLeft)}d overdue
      </span>
    );
  if (status === "sent")
    return <span className="chip neutral">Sent · {daysLeft}d left</span>;
  if (status === "draft")
    return <span className="chip warn">Draft</span>;
  return <span className="chip neutral">Void</span>;
}

export function Invoices({ invoices }: { invoices: Invoice[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = invoices.filter(
    (inv) => filter === "all" || inv.status === filter,
  );

  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const overdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const paidMtd = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Invoices. <em>Sent, tracked, paid.</em>
          </h1>
          <p className="sub">
            I draft, send and follow up on every invoice — with friendly
            WhatsApp nudges when a client is past due.
          </p>
        </div>
        <div className="right">
          <button type="button" className="btn">
            <Icon name="download" size={13} /> Export
          </button>
          <button type="button" className="btn primary">
            <Icon name="plus" size={13} /> New invoice
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="bento" style={{ marginBottom: 18 }}>
        <div className="card metric" style={{ gridColumn: "span 4" }}>
          <div className="card-head">
            <span className="t">Outstanding</span>
          </div>
          <div className="value" style={{ fontSize: 26 }}>
            <sup>₦</sup>
            {(outstanding / 1_000_000).toFixed(2)}M
          </div>
          <div className="row">
            <span className="chip neutral">
              {invoices.filter((i) => i.status === "sent").length} invoices sent
            </span>
          </div>
        </div>

        <div className="card metric" style={{ gridColumn: "span 4" }}>
          <div className="card-head">
            <span className="t">Overdue</span>
          </div>
          <div
            className="value"
            style={{
              fontSize: 26,
              color: overdue > 0 ? "var(--danger)" : undefined,
            }}
          >
            <sup>₦</sup>
            {(overdue / 1_000_000).toFixed(2)}M
          </div>
          <div className="row">
            <span className="chip down">
              {invoices.filter((i) => i.status === "overdue").length} invoices overdue
            </span>
          </div>
        </div>

        <div className="card metric" style={{ gridColumn: "span 4" }}>
          <div className="card-head">
            <span className="t">Collected · MTD</span>
          </div>
          <div className="value" style={{ fontSize: 26 }}>
            <sup>₦</sup>
            {(paidMtd / 1_000_000).toFixed(2)}M
          </div>
          <div className="row">
            <span className="chip up">
              <Icon name="arrowUp" size={10} />{" "}
              {invoices.filter((i) => i.status === "paid").length} paid this period
            </span>
          </div>
        </div>
      </div>

      {/* Invoice table */}
      <div className="card" style={{ padding: 0, overflow: "visible" }}>
        {/* Header + filter */}
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
            {(["all", "draft", "sent", "overdue", "paid"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    border:
                      filter === f
                        ? "1px solid var(--line)"
                        : "1px solid transparent",
                    background:
                      filter === f ? "var(--surface)" : "transparent",
                    padding: "5px 14px",
                    fontSize: 12,
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
                  {f === "all" ? "All" : STATUS_LABEL[f]}
                </button>
              ),
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn">
              <Icon name="filter" size={13} /> Filter
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div
          className="inv-head"
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 90px 90px 130px 120px 42px",
            padding: "10px 20px",
            fontSize: 10.5,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: "1px solid var(--line)",
            fontWeight: 500,
          }}
        >
          <span>Invoice</span>
          <span>Client</span>
          <span>Issued</span>
          <span>Due</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span>Status</span>
          <span />
        </div>

        {/* Rows */}
        {rows.map((inv) => (
          <div
            key={inv.id}
            className="inv-row txn"
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 90px 90px 130px 120px 42px",
              padding: "14px 20px",
              alignItems: "center",
              borderBottom: "1px solid var(--line)",
              transition: "background 0.1s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 550,
              }}
            >
              {inv.id}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent-ink)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 600,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {inv.initial}
              </div>
              <div>
                <div style={{ fontWeight: 550, fontSize: 13 }}>
                  {inv.client}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {inv.sector}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {inv.issued}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {inv.due}
            </div>
            <div
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 550,
              }}
            >
              {fmtN(inv.amount)}
            </div>
            <div>
              <StatusChip status={inv.status} daysLeft={inv.daysLeft} />
            </div>
            <div style={{ textAlign: "right" }}>
              <button type="button" className="icon-btn" title="Actions">
                <Icon name="dots" size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Footer */}
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
            Showing {rows.length} of {invoices.length}
          </span>
          <span className="num">
            Total invoiced ·{" "}
            <b style={{ color: "var(--ink)" }}>
              {fmtN(invoices.filter(i => i.status !== "void").reduce((s, i) => s + i.amount, 0))}
            </b>
          </span>
        </div>
      </div>
    </>
  );
}
