"use client";

import { useState } from "react";
import { Icon } from "./icon";
import type { Document, DocumentCategory } from "@/lib/data/documents";

type Filter = "all" | DocumentCategory;

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  receipt: "Receipts",
  tax: "Tax",
  contract: "Contracts",
  report: "Reports",
  payroll: "Payroll",
  other: "Other",
};

const CATEGORY_COLOR: Record<DocumentCategory, string> = {
  receipt:  "#8a5a18",
  tax:      "#2e2c8a",
  contract: "#1f6b3a",
  report:   "#2a5a5a",
  payroll:  "#8f2a1f",
  other:    "#888",
};

const SOURCE_LABEL = {
  upload:    "Uploaded",
  whatsapp:  "WhatsApp",
  email:     "Email",
  generated: "Auto-generated",
};

function DocIcon({ category }: { category: DocumentCategory }) {
  const color = CATEGORY_COLOR[category];
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: color + "18",
        color,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={category === "report" || category === "payroll" ? "chart" : "file"} size={16} />
    </div>
  );
}

export function Documents({ documents }: { documents: Document[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const rows = documents.filter((d) => {
    const matchCat = filter === "all" || d.category === filter;
    const matchQ =
      q === "" || d.name.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  const counts = (Object.keys(CATEGORY_LABEL) as DocumentCategory[]).reduce(
    (acc, cat) => {
      acc[cat] = documents.filter((d) => d.category === cat).length;
      return acc;
    },
    {} as Record<DocumentCategory, number>,
  );

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Documents. <em>Every paper, in one place.</em>
          </h1>
          <p className="sub">
            Receipts from WhatsApp, tax certificates, contracts — Emiday files
            them automatically and links each one to the right transaction.
          </p>
        </div>
        <div className="right">
          <button type="button" className="btn">
            <Icon name="search" size={13} /> Search
          </button>
          <button type="button" className="btn primary">
            <Icon name="plus" size={13} /> Upload
          </button>
        </div>
      </div>

      {/* Category summary tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {(Object.keys(CATEGORY_LABEL) as DocumentCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(filter === cat ? "all" : cat)}
            style={{
              background:
                filter === cat
                  ? CATEGORY_COLOR[cat] + "15"
                  : "var(--surface)",
              border: `1px solid ${filter === cat ? CATEGORY_COLOR[cat] + "44" : "var(--line)"}`,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: filter === cat ? CATEGORY_COLOR[cat] : "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {counts[cat]}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: filter === cat ? CATEGORY_COLOR[cat] : "var(--muted)",
                marginTop: 3,
                fontWeight: 500,
              }}
            >
              {CATEGORY_LABEL[cat]}
            </div>
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="card" style={{ padding: 0 }}>
        {/* Search + filter bar */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "var(--surface-2)",
              flex: "0 0 300px",
            }}
          >
            <Icon name="search" size={13} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents…"
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
          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
            {rows.length} of {documents.length} documents
          </div>
          <button type="button" className="btn">
            <Icon name="filter" size={13} /> Filter
          </button>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 110px 100px 90px 130px 42px",
            padding: "10px 20px",
            fontSize: 10.5,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: "1px solid var(--line)",
            fontWeight: 500,
          }}
        >
          <span>Document</span>
          <span>Category</span>
          <span>Date</span>
          <span>Size</span>
          <span>Source</span>
          <span />
        </div>

        {/* Rows */}
        {rows.map((doc) => (
          <div
            key={doc.id}
            className="txn"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 100px 90px 130px 42px",
              padding: "13px 20px",
              alignItems: "center",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <DocIcon category={doc.category} />
              <div>
                <div
                  style={{
                    fontWeight: 550,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 360,
                  }}
                >
                  {doc.name}
                </div>
                {doc.client && (
                  <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>
                    {doc.client}
                  </div>
                )}
              </div>
            </div>
            <div>
              <span
                className="chip neutral"
                style={{
                  color: CATEGORY_COLOR[doc.category],
                  background: CATEGORY_COLOR[doc.category] + "15",
                  border: "none",
                }}
              >
                {CATEGORY_LABEL[doc.category]}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{doc.date}</div>
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {doc.size}
            </div>
            <div>
              <span
                className="chip neutral"
                style={{ fontSize: 11 }}
              >
                {doc.source === "whatsapp" && <Icon name="whatsapp" size={10} />}
                {doc.source === "email"    && <Icon name="mail"      size={10} />}
                {doc.source === "generated"&& <Icon name="sparkle"   size={10} />}
                {doc.source === "upload"   && <Icon name="file"       size={10} />}
                {" "}{SOURCE_LABEL[doc.source]}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <button type="button" className="icon-btn" title="Actions">
                <Icon name="dots" size={14} />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
            }}
          >
            No documents match your filter.
          </div>
        )}

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
          <span>Showing {rows.length} of {documents.length}</span>
          <span>
            Last upload ·{" "}
            <b style={{ color: "var(--ink)" }}>
              {[...documents].sort((a, b) => (a.date > b.date ? -1 : 1))[0]?.date}
            </b>
          </span>
        </div>
      </div>
    </>
  );
}
