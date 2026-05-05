"use client";

// Branded printable report document.
//
// Renders a single ReportTemplate as an A4-styled HTML page with a
// download CTA. The document carries the workspace identity in the
// header (trading name, RC number, period) and falls back to muted
// defaults for the public demo path.
//
// Print = browser native PDF. We don't ship a PDF lib — the @media
// print rules below are scoped so File → Print produces a clean,
// pagination-friendly document at A4.

import { useEffect } from "react";
import {
  fmtMoney,
  sumRows,
  type ReportTemplate,
  type ReportRow,
} from "@/lib/data/report-templates";
import type { Workspace, ActiveUser } from "@/lib/data/workspace";

type Props = {
  template: ReportTemplate;
  workspace: Workspace;
  user: ActiveUser;
  /** When true, kick off the print dialog automatically once the page mounts. */
  autoPrint?: boolean;
};

const TODAY = new Date().toLocaleDateString("en-NG", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function ReportDocument({
  template,
  workspace,
  user,
  autoPrint = false,
}: Props) {
  useEffect(() => {
    if (autoPrint) {
      // Delay one frame so layout/fonts settle before the print dialog.
      const t = setTimeout(() => window.print(), 250);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const sym = template.currencySymbol;

  return (
    <div className="rpt-shell">
      {/* Toolbar — hidden in print */}
      <div className="rpt-toolbar">
        <div className="rpt-toolbar-l">
          <button
            type="button"
            className="rpt-tool-btn"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
          <span className="rpt-tool-meta">
            {template.title} · {template.subtitle}
          </span>
        </div>
        <div className="rpt-toolbar-r">
          <button
            type="button"
            className="rpt-tool-btn primary"
            onClick={() => window.print()}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* The document itself */}
      <article className="rpt-doc">
        {/* Letterhead — workspace identity is primary; Emiday is the
            quiet "prepared by" attribution in the footer. */}
        <header className="rpt-head">
          <div className="rpt-brand">
            <span className="rpt-mark" aria-hidden="true">
              {workspace.avatarInitial || workspace.tradingAs.slice(0, 1)}
            </span>
            <div className="rpt-brand-block">
              <div className="rpt-brand-l">{workspace.tradingAs}</div>
              <div className="rpt-brand-sub">{workspace.sector}</div>
            </div>
          </div>
          <div className="rpt-org">
            <div className="rpt-org-name">{workspace.name}</div>
            <div className="rpt-org-meta">
              {workspace.rcNumber} · {workspace.address}
            </div>
            <div className="rpt-org-meta">
              {workspace.email} · {workspace.phone}
            </div>
          </div>
        </header>

        <div className="rpt-rule" />

        {/* Title block */}
        <section className="rpt-title">
          <h1>{template.title}</h1>
          <div className="rpt-period">{template.subtitle}</div>
          <div className="rpt-meta-grid">
            <Meta label="Prepared for"  value={workspace.tradingAs} />
            <Meta label="Prepared by"   value={`Emiday · for ${user.name}`} />
            <Meta label="Generated"     value={TODAY} />
            <Meta label="Currency"      value={workspace.baseCurrency} />
          </div>
        </section>

        {/* Net strip — the headline number for the period. Coloured
            green when positive, red when negative, neutral when the
            template wants the sign suppressed (e.g. trial balance). */}
        {template.net && (() => {
          const t =
            template.net.tone ??
            (template.net.amount > 0
              ? "positive"
              : template.net.amount < 0
                ? "negative"
                : "neutral");
          const signed =
            template.net.amount === 0
              ? fmtMoney(0, sym)
              : template.net.amount > 0
                ? `+${fmtMoney(template.net.amount, sym)}`
                : fmtMoney(template.net.amount, sym);
          return (
            <section className={`rpt-net rpt-net-${t}`}>
              <div className="rpt-net-l">
                <div className="rpt-net-label">{template.net.label}</div>
                {template.net.caption && (
                  <div className="rpt-net-caption">{template.net.caption}</div>
                )}
              </div>
              <div className="rpt-net-v">{signed}</div>
            </section>
          );
        })()}

        {/* Optional table of contents */}
        {template.toc && template.toc.length > 0 && (
          <section className="rpt-toc">
            <div className="rpt-toc-l">Inside this pack</div>
            <ol>
              {template.toc.map((item, i) => (
                <li key={i}>
                  <span className="rpt-toc-n">{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Sections */}
        {template.sections.map((sec, i) => {
          const total = sec.totalLabel ? sumRows(sec.rows) : null;
          return (
            <section key={i} className="rpt-section">
              {sec.kicker && <div className="rpt-kicker">{sec.kicker}</div>}
              <h2 className="rpt-h2">{sec.heading}</h2>
              <table className="rpt-table">
                <colgroup>
                  <col />
                  <col style={{ width: "32%" }} />
                </colgroup>
                <tbody>
                  {sec.rows.map((row, j) => (
                    <Row key={j} row={row} sym={sym} />
                  ))}
                  {total !== null && sec.totalLabel && (
                    <tr className="rpt-total-row">
                      <td className="rpt-total-l">{sec.totalLabel}</td>
                      <td className="rpt-total-v">{fmtMoney(total, sym)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          );
        })}

        {/* Notes */}
        {template.notes && template.notes.length > 0 && (
          <section className="rpt-notes">
            <div className="rpt-notes-l">Notes</div>
            <ul>
              {template.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="rpt-foot">
          <div className="rpt-foot-l">
            Generated by Emiday — your AI accountant.
          </div>
          <div className="rpt-foot-r">
            {workspace.tradingAs} · {workspace.rcNumber} · Page <span className="rpt-pgnum" />
          </div>
        </footer>
      </article>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rpt-meta">
      <div className="rpt-meta-l">{label}</div>
      <div className="rpt-meta-v">{value}</div>
    </div>
  );
}

function Row({ row, sym }: { row: ReportRow; sym: string }) {
  const indent = row.indent ?? 0;
  const cls = [
    "rpt-row",
    row.emphasis ? `rpt-row-${row.emphasis}` : "",
    indent ? `rpt-indent-${indent}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <tr className={cls}>
      <td className="rpt-row-l">{row.label}</td>
      <td className="rpt-row-v">
        {row.raw ? row.raw : fmtMoney(row.amount, sym)}
      </td>
    </tr>
  );
}
