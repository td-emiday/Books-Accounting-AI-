"use client";

// Bank statement upload — a lightweight modal for pushing transactions
// into the dashboard from a CSV (or quick manual entry). Parsing is
// intentionally permissive so people can paste an export from any
// Nigerian bank that includes columns roughly matching:
//
//   Date, Description, Amount   (debits negative, or a separate Debit/Credit pair)
//
// We don't ship to a backend — `addTransactions` from the dashboard
// context is enough for the demo to feel real.

import { useId, useMemo, useRef, useState } from "react";
import { Icon } from "./icon";
import { useDashboardData } from "./dashboard-data-context";
import {
  CATEGORIES,
  type Transaction,
} from "@/lib/data/transactions";

type ParsedRow = {
  date: string; // ISO
  merchant: string;
  amount: number;
  ref: string;
};

const SAMPLE = `Date,Description,Amount,Reference
2026-04-25,Paystack Settlement,420000,Daily payout
2026-04-24,Konga Wholesale,-185000,INV
2026-04-24,Uber Lagos,-4200,Trip`;

/** Parse a CSV that has at minimum a date and amount column. */
function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: ["Empty file"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = header.findIndex((h) => /date/.test(h));
  const descIdx = header.findIndex((h) =>
    /(desc|narration|details|merchant|payee)/.test(h),
  );
  const amtIdx = header.findIndex((h) => /^amount$/.test(h));
  const debitIdx = header.findIndex((h) => /debit/.test(h));
  const creditIdx = header.findIndex((h) => /credit/.test(h));
  const refIdx = header.findIndex((h) => /ref|memo/.test(h));

  if (dateIdx < 0) errors.push("Missing Date column");
  if (descIdx < 0) errors.push("Missing Description column");
  if (amtIdx < 0 && (debitIdx < 0 || creditIdx < 0))
    errors.push("Missing Amount (or Debit + Credit) column");
  if (errors.length) return { rows: [], errors };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Naive CSV — splits on commas, doesn't handle quoted commas. Good
    // enough for paste-from-Excel which is the common path here.
    const cols = lines[i].split(",").map((c) => c.trim());
    const rawDate = cols[dateIdx];
    const iso = normaliseDate(rawDate);
    if (!iso) {
      errors.push(`Row ${i + 1}: bad date "${rawDate}"`);
      continue;
    }
    let amount = 0;
    if (amtIdx >= 0) {
      amount = Number((cols[amtIdx] || "0").replace(/[₦,\s]/g, ""));
    } else {
      const dr = Number((cols[debitIdx] || "0").replace(/[₦,\s]/g, ""));
      const cr = Number((cols[creditIdx] || "0").replace(/[₦,\s]/g, ""));
      amount = (cr || 0) - (dr || 0);
    }
    if (!Number.isFinite(amount)) {
      errors.push(`Row ${i + 1}: bad amount`);
      continue;
    }
    rows.push({
      date: iso,
      merchant: cols[descIdx] || "Unknown",
      amount,
      ref: refIdx >= 0 ? cols[refIdx] || "Imported" : "Imported",
    });
  }
  return { rows, errors };
}

/** Accept ISO, "DD/MM/YYYY", or "DD-MMM-YYYY". */
function normaliseDate(s: string): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slash = s.match(/^(\d{1,2})[/](\d{1,2})[/](\d{2,4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const yyyy = y.length === 2 ? "20" + y : y;
    return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const ddMmm = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[\s-](\d{4})$/);
  if (ddMmm) {
    const [, d, mmm, y] = ddMmm;
    const m = monthMap[mmm.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`;
  }
  return null;
}

/** Quick rule-based suggestion so imports don't all read "Uncategorised". */
function suggestCategory(merchant: string, amount: number): string {
  const m = merchant.toLowerCase();
  if (/(paystack|flutterwave|stripe|gtbank|inflow|payout|invoice)/.test(m))
    return "revenue";
  if (/(payroll|salary|zenith)/.test(m)) return "payroll";
  if (/(vat|paye|firs|tax|lasg|lagos irs)/.test(m)) return "tax";
  if (/(rent|lease|electric|mtn|nepa|ikeja)/.test(m)) return "rent";
  if (/(figma|aws|slack|notion|google|software|saas)/.test(m)) return "software";
  if (/(uber|bolt|fuel|total|arik|flight|trip|food)/.test(m)) return "travel";
  if (/(shoprite|konga|market|wholesale)/.test(m)) return "cogs";
  if (/(legal|advisory|pwc|consult)/.test(m)) return "prof";
  return amount > 0 ? "revenue" : "cogs";
}

export function BankUpload({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addTransactions } = useDashboardData();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const [accountLabel, setAccountLabel] = useState("Imported · Statement");

  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text]);

  if (!open) return null;

  const onFile = async (f: File) => {
    const t = await f.text();
    setText(t);
    setError(null);
    setImported(null);
  };

  const onImport = () => {
    if (!parsed || parsed.rows.length === 0) {
      setError("Nothing to import — paste or upload a statement first.");
      return;
    }
    const baseId = Date.now();
    const txns: Transaction[] = parsed.rows.map((r, i) => {
      const suggest = suggestCategory(r.merchant, r.amount);
      return {
        id: baseId + i,
        merchant: r.merchant,
        initial: (r.merchant.match(/[A-Za-z]/)?.[0] || "?").toUpperCase(),
        ref: r.ref,
        date: r.date,
        amount: Math.round(r.amount),
        suggest,
        conf: 80,
        applied: null,
      };
    });
    addTransactions(txns);
    setImported(txns.length);
    setError(null);
  };

  const fillSample = () => {
    setText(SAMPLE);
    setError(null);
    setImported(null);
  };

  const close = () => {
    setText("");
    setError(null);
    setImported(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,13,16,0.42)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: "min(640px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 0,
        }}
      >
        <div
          className="card-head"
          style={{
            padding: "18px 20px 14px",
            marginBottom: 0,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div
              id="upload-title"
              style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}
            >
              Upload bank statement
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              CSV with Date, Description, Amount (or Debit + Credit). Stays
              local to your browser.
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={close}
            title="Close"
            aria-label="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Account label
            </span>
            <input
              type="text"
              value={accountLabel}
              onChange={(e) => setAccountLabel(e.target.value)}
              style={inputStyle}
            />
          </label>

          <div
            style={{
              border: "1px dashed var(--line-strong)",
              borderRadius: 10,
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Icon name="upload" size={18} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Drop a CSV file
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Or paste rows directly below.
              </div>
            </div>
            <input
              ref={fileRef}
              id={fileInputId}
              type="file"
              accept=".csv,text/csv,text/plain"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="plus" size={13} /> Choose file
            </button>
            <button type="button" className="btn" onClick={fillSample}>
              Use sample
            </button>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              CSV preview
            </span>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
                setImported(null);
              }}
              placeholder="Date,Description,Amount&#10;2026-04-25,Paystack Settlement,420000"
              spellCheck={false}
              style={{
                ...inputStyle,
                minHeight: 140,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.5,
                resize: "vertical",
              }}
            />
          </label>

          {parsed && parsed.errors.length > 0 && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(143,42,31,0.08)",
                color: "#8f2a1f",
                fontSize: 12,
              }}
            >
              {parsed.errors.slice(0, 4).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}

          {parsed && parsed.rows.length > 0 && imported === null && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "var(--accent-soft, rgba(46,44,138,0.06))",
                fontSize: 12,
                color: "var(--ink)",
              }}
            >
              Parsed {parsed.rows.length} transactions ·{" "}
              <span className="num">
                ₦
                {parsed.rows
                  .reduce((s, r) => s + Math.abs(r.amount), 0)
                  .toLocaleString("en-NG")}
              </span>{" "}
              total volume.
            </div>
          )}

          {imported !== null && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(31,107,58,0.1)",
                color: "#1f6b3a",
                fontSize: 12,
              }}
            >
              Imported {imported} transaction{imported === 1 ? "" : "s"} into{" "}
              {accountLabel}. They&apos;re now in your inbox — review or
              auto-apply at the top of the list.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(143,42,31,0.08)",
                color: "#8f2a1f",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Show first 4 rows so the user trusts the parser. */}
          {parsed && parsed.rows.length > 0 && (
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                overflow: "hidden",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 110px 110px",
                  background: "rgba(0,0,0,0.02)",
                  padding: "8px 10px",
                  fontWeight: 500,
                  color: "var(--muted)",
                }}
              >
                <span>Date</span>
                <span>Merchant</span>
                <span>Suggest</span>
                <span style={{ textAlign: "right" }}>Amount</span>
              </div>
              {parsed.rows.slice(0, 5).map((r, i) => {
                const cat = CATEGORIES.find(
                  (c) => c.id === suggestCategory(r.merchant, r.amount),
                );
                return (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 1fr 110px 110px",
                      padding: "8px 10px",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <span className="num">{r.date}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.merchant}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
                      {cat && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: cat.color,
                          }}
                        />
                      )}
                      {cat?.name ?? "—"}
                    </span>
                    <span
                      className="num"
                      style={{
                        textAlign: "right",
                        color: r.amount < 0 ? "var(--negative, #8f2a1f)" : "var(--positive, #1f6b3a)",
                      }}
                    >
                      {(r.amount < 0 ? "−" : "+") +
                        "₦" +
                        Math.abs(r.amount).toLocaleString("en-NG")}
                    </span>
                  </div>
                );
              })}
              {parsed.rows.length > 5 && (
                <div
                  style={{
                    padding: "8px 10px",
                    borderTop: "1px solid var(--line)",
                    color: "var(--muted)",
                  }}
                >
                  + {parsed.rows.length - 5} more…
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "14px 20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onImport}
            disabled={!parsed || parsed.rows.length === 0}
          >
            <Icon name="sparkle" size={13} />{" "}
            {imported !== null ? "Import more" : "Import transactions"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--line-strong)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  background: "var(--surface, #fff)",
  color: "var(--ink)",
  width: "100%",
};
