"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { WORKSPACE } from "@/lib/data/workspace";
import {
  BILLING_INVOICES,
  CONNECTED_BANKS,
  DEVICE_SESSIONS,
  INTEGRATIONS,
  PLAN,
  TAX_PROFILE,
  TEAM_MEMBERS,
  USAGE,
} from "@/lib/data/settings";

type TabId =
  | "profile"
  | "banks"
  | "tax"
  | "members"
  | "integrations"
  | "billing"
  | "security";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "profile",      label: "Business profile",    icon: "users"     },
  { id: "banks",        label: "Bank connections",    icon: "bank"      },
  { id: "tax",          label: "Tax & filing",        icon: "shield"    },
  { id: "members",      label: "Team & permissions",  icon: "users"     },
  { id: "integrations", label: "Integrations",        icon: "lightning" },
  { id: "billing",      label: "Billing",             icon: "receipt"   },
  { id: "security",     label: "Security",            icon: "shield"    },
];

export function Settings() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Settings. <em>Tune Emiday to your business.</em>
          </h1>
          <p className="sub">
            Bank connections, tax identifiers, team access — everything Emiday
            needs to keep your books clean.
          </p>
        </div>
      </div>

      <div className="settings-shell">
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`settings-tab ${tab === t.id ? "on" : ""}`}
            >
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profile"      && <ProfileTab />}
          {tab === "banks"        && <BanksTab />}
          {tab === "tax"          && <TaxTab />}
          {tab === "members"      && <MembersTab />}
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "billing"      && <BillingTab />}
          {tab === "security"     && <SecurityTab />}
        </div>
      </div>
    </>
  );
}

function SettingsSection({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.015em" }}
        >
          {title}
        </div>
        {desc && (
          <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
            {desc}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 20,
        padding: "12px 0",
        borderTop: "1px solid var(--line)",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
        {hint && (
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Input({
  value,
  suffix,
  type = "text",
}: {
  value: string;
  suffix?: string;
  type?: string;
}) {
  const [v, setV] = useState(value);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid var(--line-strong)",
        borderRadius: 8,
        padding: "8px 12px",
        background: "var(--surface)",
        maxWidth: 400,
      }}
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        type={type}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          font: "inherit",
          fontSize: 13,
          flex: 1,
          color: "var(--ink)",
        }}
      />
      {suffix && (
        <span className="muted" style={{ fontSize: 11.5 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function Toggle({ on = false }: { on?: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button
      type="button"
      aria-pressed={v}
      className={`tog ${v ? "on" : ""}`}
      onClick={() => setV(!v)}
      style={{ width: 34, height: 20, border: "none", padding: 0, cursor: "pointer" }}
    />
  );
}

function ProfileTab() {
  return (
    <>
      <SettingsSection
        title="Business details"
        desc="How Emiday addresses you and stamps your documents."
      >
        <Field label="Registered name">
          <Input value={WORKSPACE.name} />
        </Field>
        <Field label="Trading as">
          <Input value={WORKSPACE.tradingAs} />
        </Field>
        <Field label="RC number" hint="Corporate Affairs Commission">
          <Input value={WORKSPACE.rcNumber} />
        </Field>
        <Field label="Sector">
          <Input value={WORKSPACE.sector} />
        </Field>
        <Field label="Financial year-end">
          <Input value={WORKSPACE.fiscalYearEnd} />
        </Field>
        <Field label="Base currency">
          <Input value={WORKSPACE.baseCurrency} />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Contact & address"
        desc="Used on invoices, receipts and official filings."
      >
        <Field label="Registered address">
          <Input value={WORKSPACE.address} />
        </Field>
        <Field label="Primary email">
          <Input value={WORKSPACE.email} />
        </Field>
        <Field label="Phone">
          <Input value={WORKSPACE.phone} />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Logo & branding"
        desc="Shown on reports, invoices, and client-facing PDFs."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "var(--accent)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {WORKSPACE.avatarInitial}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn">Upload logo</button>
            <button
              type="button"
              className="btn"
              style={{ color: "var(--danger)" }}
            >
              Remove
            </button>
          </div>
        </div>
      </SettingsSection>
    </>
  );
}

function BanksTab() {
  return (
    <>
      <SettingsSection
        title="Connected accounts"
        desc="Read-only feeds via Mono. Nightly sync at 2am WAT."
      >
        {CONNECTED_BANKS.map((b) => (
          <div
            key={b.acct}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: b.color,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {b.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 550, fontSize: 13 }}>{b.name}</div>
              <div
                className="muted"
                style={{
                  fontSize: 11.5,
                  fontFamily: "var(--font-mono)",
                  marginTop: 2,
                }}
              >
                {b.acct} · {b.txns} txns this month
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Synced {b.synced}
            </div>
            {b.status === "active" ? (
              <span className="chip up">
                <Icon name="check" size={10} /> Active
              </span>
            ) : (
              <span className="chip warn">Re-auth required</span>
            )}
            <button type="button" className="icon-btn" title="Actions">
              <Icon name="dots" size={14} />
            </button>
          </div>
        ))}
        <div
          style={{
            marginTop: 14,
            borderTop: "1px solid var(--line)",
            paddingTop: 14,
          }}
        >
          <button type="button" className="btn primary">
            <Icon name="plus" size={13} /> Connect another account
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Sync behaviour">
        <Field label="Sync frequency">
          <Input value="Every 4 hours" />
        </Field>
        <Field
          label="Auto-categorise"
          hint="Apply AI suggestions above 90% confidence automatically."
        >
          <Toggle on />
        </Field>
        <Field label="Email me when sync fails">
          <Toggle on />
        </Field>
      </SettingsSection>
    </>
  );
}

function TaxTab() {
  return (
    <>
      <SettingsSection
        title="Tax identifiers"
        desc="Used on every return, remittance and invoice Emiday prepares."
      >
        <Field label="TIN" hint="FIRS Taxpayer Identification Number">
          <Input value={TAX_PROFILE.tin} />
        </Field>
        <Field label="VAT registration">
          <Input value={TAX_PROFILE.vatReg} />
        </Field>
        <Field label="VAT status">
          <span className="chip up">
            <Icon name="check" size={10} /> {TAX_PROFILE.vatStatusNote}
          </span>
        </Field>
        <Field label="Tax office">
          <Input value={TAX_PROFILE.taxOffice} />
        </Field>
        <Field label="State tax authority">
          <Input value={TAX_PROFILE.stateAuthority} />
        </Field>
      </SettingsSection>

      <SettingsSection title="Filing preferences">
        <Field
          label="Auto-prepare returns"
          hint="Emiday drafts every return 3 days before due date."
        >
          <Toggle on />
        </Field>
        <Field label="Require my approval to file">
          <Toggle on />
        </Field>
        <Field
          label="Auto-pay on due date"
          hint="Debits from GTBank **2041 on the morning a return is due."
        >
          <Toggle />
        </Field>
      </SettingsSection>

      <SettingsSection title="Tax calendar reminders">
        <Field label="Remind me">
          <Input value="7 days before due date" />
        </Field>
        <Field label="Notification channels">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="chip neutral">
              <Icon name="mail" size={10} /> Email
            </span>
            <span className="chip up">
              <Icon name="whatsapp" size={10} /> WhatsApp
            </span>
            <span className="chip neutral">In-app</span>
          </div>
        </Field>
      </SettingsSection>
    </>
  );
}

function MembersTab() {
  return (
    <SettingsSection
      title="Team members"
      desc="Invite teammates or your external accountant. Role-based access."
    >
      {TEAM_MEMBERS.map((m) => (
        <div
          key={m.email}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: m.avatarColor,
              color: "#3a3328",
              display: "grid",
              placeItems: "center",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {m.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 550, fontSize: 13 }}>{m.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              {m.email}
            </div>
          </div>
          <span className="chip neutral">{m.role}</span>
          <button type="button" className="icon-btn" title="Manage member">
            <Icon name="dots" size={14} />
          </button>
        </div>
      ))}
      <div
        style={{
          marginTop: 14,
          borderTop: "1px solid var(--line)",
          paddingTop: 14,
        }}
      >
        <button type="button" className="btn primary">
          <Icon name="plus" size={13} /> Invite member
        </button>
      </div>
    </SettingsSection>
  );
}

function IntegrationsTab() {
  return (
    <SettingsSection
      title="Apps & integrations"
      desc="Connect Emiday to the rest of your stack."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginTop: 6,
        }}
      >
        {INTEGRATIONS.map((a) => (
          <div
            key={a.name}
            style={{
              padding: 14,
              border: "1px solid var(--line)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                display: "grid",
                placeItems: "center",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {a.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 550, fontSize: 13 }}>{a.name}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {a.desc}
              </div>
            </div>
            <button
              type="button"
              className={`btn ${a.connected ? "" : "primary"}`}
              style={{ padding: "6px 12px", fontSize: 11.5 }}
            >
              {a.connected ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

function BillingTab() {
  return (
    <>
      <SettingsSection title="Current plan">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 16,
            background: "var(--ink)",
            color: "var(--bg)",
            borderRadius: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              Emiday
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {PLAN.tier} · ₦{PLAN.monthly.toLocaleString("en-NG")}/mo
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Renews {PLAN.renewDate} · billed via {PLAN.billingAccount}
            </div>
          </div>
          <button type="button" className="btn">Change plan</button>
        </div>
      </SettingsSection>

      <SettingsSection title="Usage this cycle">
        <Field
          label="Transactions processed"
          hint={`Included: ${USAGE.txnsIncluded.toLocaleString()}/mo`}
        >
          <span className="num" style={{ fontSize: 14, fontWeight: 500 }}>
            {USAGE.txnsProcessed.toLocaleString()}{" "}
            <span className="muted" style={{ fontSize: 12 }}>
              / {USAGE.txnsIncluded.toLocaleString()}
            </span>
          </span>
        </Field>
        <Field label="Connected accounts" hint={`Included: ${USAGE.accountsIncluded}`}>
          <span className="num" style={{ fontSize: 14, fontWeight: 500 }}>
            {USAGE.accountsConnected}{" "}
            <span className="muted" style={{ fontSize: 12 }}>
              / {USAGE.accountsIncluded}
            </span>
          </span>
        </Field>
        <Field label="Filings paid on your behalf">
          <span className="num" style={{ fontSize: 14, fontWeight: 500 }}>
            {USAGE.filingsPaid} this month
          </span>
        </Field>
      </SettingsSection>

      <SettingsSection title="Invoices">
        {BILLING_INVOICES.map((i) => (
          <div
            key={i.number}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 550, fontSize: 13 }}>{i.period}</div>
              <div
                className="muted"
                style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}
              >
                {i.number}
              </div>
            </div>
            <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>
              ₦{i.amount.toLocaleString("en-NG")}
            </div>
            <span className="chip up">
              <Icon name="check" size={10} /> Paid
            </span>
            <button type="button" className="icon-btn" title="Download invoice">
              <Icon name="download" size={13} />
            </button>
          </div>
        ))}
      </SettingsSection>
    </>
  );
}

function SecurityTab() {
  return (
    <>
      <SettingsSection
        title="Sign-in"
        desc="Protect your books with strong authentication."
      >
        <Field label="Password">
          <button type="button" className="btn">Change password</button>
        </Field>
        <Field
          label="Two-factor authentication"
          hint="Required for payments and filings."
        >
          <Toggle on />
        </Field>
        <Field label="Biometric on mobile">
          <Toggle on />
        </Field>
      </SettingsSection>

      <SettingsSection title="Session & devices">
        {DEVICE_SESSIONS.map((d) => (
          <div
            key={d.device}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 550, fontSize: 13 }}>
                {d.device}
                {d.current && (
                  <span className="chip up" style={{ marginLeft: 6 }}>
                    This device
                  </span>
                )}
              </div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {d.location} · {d.when}
              </div>
            </div>
            {!d.current && (
              <button type="button" className="btn" style={{ fontSize: 11.5 }}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </SettingsSection>

      <SettingsSection title="Data & privacy">
        <Field
          label="Export all data"
          hint="CSV bundle of transactions, reports and filings."
        >
          <button type="button" className="btn">
            <Icon name="download" size={13} /> Request export
          </button>
        </Field>
        <Field label="Data residency">
          <span className="chip neutral">
            <Icon name="shield" size={10} /> Nigeria (Lagos)
          </span>
        </Field>
        <Field
          label="Delete workspace"
          hint="Irreversible. Removes all books, documents and audit trails."
        >
          <button
            type="button"
            className="btn"
            style={{
              color: "var(--danger)",
              borderColor: "var(--danger-soft)",
            }}
          >
            Delete workspace
          </button>
        </Field>
      </SettingsSection>
    </>
  );
}
