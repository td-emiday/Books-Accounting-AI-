import type { Report, ReportShape } from "@/lib/data/reports";

function Preview({ shape }: { shape: ReportShape }) {
  if (shape === "pl") {
    return (
      <div className="doc">
        <h4>Profit &amp; Loss</h4>
        <div className="ln m" />
        <div className="ln s" />
        <div className="ln" />
        <div className="bars">
          {[60, 80, 45, 95, 55, 70, 40, 88].map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (shape === "bs") {
    return (
      <div className="doc">
        <h4>Balance Sheet</h4>
        <div className="ln m" />
        <div className="ln" />
        <div className="ln s" />
        <div style={{ display: "flex", gap: 4, marginTop: "auto" }}>
          <div
            style={{
              flex: 1,
              background: "var(--ink)",
              height: 40,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              flex: 0.7,
              background: "var(--line-strong)",
              height: 40,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    );
  }
  if (shape === "cf") {
    return (
      <div className="doc">
        <h4>Cashflow</h4>
        <div className="ln m" />
        <div className="ln s" />
        <svg
          viewBox="0 0 100 40"
          style={{ marginTop: "auto", width: "100%", height: 40 }}
        >
          <path
            d="M0,30 L14,24 L28,28 L42,18 L56,22 L70,10 L84,14 L100,4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }
  if (shape === "vat") {
    return (
      <div className="doc">
        <h4>VAT Return</h4>
        <div className="ln" />
        <div className="ln m" />
        <div className="ln s" />
        <div
          style={{
            marginTop: "auto",
            border: "1px dashed var(--line-strong)",
            padding: 6,
            borderRadius: 4,
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--muted)",
          }}
        >
          Output VAT ₦3,241,500
        </div>
      </div>
    );
  }
  if (shape === "pay") {
    return (
      <div className="doc">
        <h4>Payroll · April</h4>
        <div className="ln m" />
        <div className="ln" />
        <div
          style={{
            marginTop: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2,
          }}
        >
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 6,
                background: i % 3 === 0 ? "var(--ink)" : "var(--line-strong)",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="doc">
      <h4>Trial Balance</h4>
      <div className="ln" />
      <div className="ln m" />
      <div className="ln s" />
      <div className="ln m" />
      <div className="ln" />
    </div>
  );
}

export function Reports({ reports }: { reports: Report[] }) {
  return (
    <div className="reports-grid">
      {reports.map((r) => (
        <div key={r.title} className="card report">
          <div className="preview">
            <Preview shape={r.shape} />
          </div>
          <div className="label">
            <div>
              <div className="t">{r.title}</div>
              <div className="d">{r.date}</div>
            </div>
            <span className={`status ${r.status}`}>
              {r.status === "ready" ? "Ready" : "Draft"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
