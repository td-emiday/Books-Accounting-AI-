"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { TelegramConnect } from "./telegram-connect";
import { useWorkspaceContext } from "./dashboard-data-context";
import {
  seedDemoDataAction,
  clearDemoDataAction,
} from "@/app/app/settings/actions";
import {
  BILLING_INVOICES,
  CONNECTED_BANKS,
  DEVICE_SESSIONS,
  INTEGRATIONS,
  PLAN,
  TAX_PROFILE,
  USAGE,
  type TeamMember,
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

export function Settings({ team }: { team: TeamMember[] }) {
  const [tab, setTab] = useState<TabId>("profile");
  const { workspace: WORKSPACE } = useWorkspaceContext();

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Settings. <em>Tune me to your business.</em>
          </h1>
          <p className="sub">
            Bank connections, tax IDs, team access — everything I need to
            keep your books clean and your filings on time.
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
          {tab === "members"      && <MembersTab team={team} />}
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

function DemoDataSection() {
  const [busy, setBusy] = useState<"none" | "seeding" | "clearing">("none");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSeed() {
    setBusy("seeding");
    setMsg(null);
    try {
      await seedDemoDataAction();
      setMsg("Demo data seeded — refresh the dashboard to see it.");
    } catch (e: unknown) {
      setMsg("Seed failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy("none");
    }
  }

  async function onClear() {
    setBusy("clearing");
    setMsg(null);
    try {
      await clearDemoDataAction();
      setMsg("Workspace data cleared.");
    } catch (e: unknown) {
      setMsg("Clear failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy("none");
    }
  }

  return (
    <SettingsSection
      title="Demo data"
      desc="Populate the dashboard with sample clients, invoices, transactions and documents so it looks alive while you're setting up. Safe to run multiple times."
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={onSeed}
          disabled={busy !== "none"}
        >
          {busy === "seeding" ? "Seeding…" : "Seed demo data"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onClear}
          disabled={busy !== "none"}
          style={{ color: "var(--danger)" }}
        >
          {busy === "clearing" ? "Clearing…" : "Clear workspace data"}
        </button>
      </div>
      {msg && (
        <p style={{ marginTop: 10, fontSize: 13, color: "var(--ink-2)" }}>{msg}</p>
      )}
    </SettingsSection>
  );
}

function ProfileTab() {
  const { workspace: WORKSPACE } = useWorkspaceContext();
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

      <DemoDataSection />
    </>
  );
}

function BanksTab() {
  const { workspace } = useWorkspaceContext();
  const myBanks = workspace.banks ?? [];

  return (
    <>
      <SettingsSection
        title="Banks you use"
        desc="From onboarding. Drives feed prioritisation, transaction filters, and report letterhead. Edit any time."
      >
        {myBanks.length === 0 ? (
          <div
            className="muted"
            style={{ padding: "12px 0", fontSize: 13 }}
          >
            No banks selected yet.{" "}
            <a href="/onboarding" style={{ color: "var(--ink)" }}>
              Pick yours →
            </a>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: "8px 0 4px",
            }}
          >
            {myBanks.map((b) => (
              <span
                key={b}
                className="chip"
                style={{ fontSize: 12.5, padding: "5px 12px" }}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </SettingsSection>

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

function MembersTab({ team }: { team: TeamMember[] }) {
  return (
    <SettingsSection
      title="Team members"
      desc="Invite teammates or your external accountant. Role-based access."
    >
      {team.map((m) => (
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
  const { channels } = useWorkspaceContext();
  return (
    <>
      <SettingsSection
        title="Messaging"
        desc="Forward receipts to a chat — they land in your books as drafts."
      >
        <TelegramConnect channels={channels} />
      </SettingsSection>

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
    </>
  );
}

function BillingTab() {
  const { workspace } = useWorkspaceContext();
  const tierLabel =
    workspace.planTier === "GROWTH"
      ? "Growth"
      : workspace.planTier === "PRO" || workspace.planTier === "BUSINESS"
        ? "Pro"
        : workspace.planTier === "ENTERPRISE" || workspace.planTier === "FIRM"
          ? "Custom"
          : "Starter";
  const monthly =
    tierLabel === "Growth" ? 85_000 : tierLabel === "Pro" ? 150_000 : 0;
  const cycleLabel =
    workspace.billingCycle === "ANNUAL" ? "Annual" : "Monthly";

  const status = workspace.subscriptionStatus;
  const renewDate = workspace.currentPeriodEnd
    ? new Date(workspace.currentPeriodEnd).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : status === "active"
      ? "next cycle"
      : "—";
  const isPaidPublic = tierLabel === "Growth" || tierLabel === "Pro";
  const checkoutPlan = tierLabel === "Pro" ? "pro" : "growth";

  const statusCopy =
    status === "active"
      ? `Active · renews ${renewDate}`
      : status === "non_renewing"
        ? `Cancelled · access until ${renewDate}`
        : status === "past_due"
          ? "Past due — last payment failed"
          : status === "cancelled"
            ? "Cancelled"
            : "Not yet billed";

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
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
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
              {tierLabel}
              {monthly > 0
                ? ` · ₦${monthly.toLocaleString("en-NG")}/${
                    cycleLabel === "Annual" ? "yr" : "mo"
                  }`
                : ""}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {cycleLabel} billing · {statusCopy}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isPaidPublic && status !== "active" && status !== "non_renewing" && (
              <form method="POST" action="/api/paystack/checkout">
                <input type="hidden" name="plan"  value={checkoutPlan} />
                <input type="hidden" name="cycle" value={workspace.billingCycle} />
                <button type="submit" className="btn primary">
                  {status === "past_due" ? "Retry payment" : "Set up billing"}
                </button>
              </form>
            )}
            {status === "active" && (
              <form method="POST" action="/api/paystack/cancel">
                <button type="submit" className="btn">Cancel plan</button>
              </form>
            )}
            <a href="/#pricing" className="btn">Change plan</a>
          </div>
        </div>

        {/* Pending plan change banner — shown until cron applies it
            on the renewal date. Read-only here; surfaced so the user
            knows what's coming next. */}
        {workspace.pendingPlanChange && (
          <div className="pending-change">
            <div>
              <div className="pending-change-kicker">Scheduled change</div>
              <div className="pending-change-body">
                Switching to{" "}
                <strong>
                  {workspace.pendingPlanChange.publicId === "pro" ? "Pro" : "Growth"}
                </strong>{" "}
                ({workspace.pendingPlanChange.cycle === "ANNUAL" ? "annual" : "monthly"})
                on{" "}
                <strong>
                  {workspace.pendingPlanChange.effectiveAt
                    ? new Date(
                        workspace.pendingPlanChange.effectiveAt,
                      ).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "next renewal"}
                </strong>
                .
              </div>
            </div>
            <form method="POST" action="/api/paystack/cancel-change" style={{ marginLeft: "auto" }}>
              <button type="submit" className="btn">Undo</button>
            </form>
          </div>
        )}

        {/* Change-plan picker — only when there's an active sub.
            Schedules the swap for end-of-cycle; cron does the rest. */}
        {status === "active" && !workspace.pendingPlanChange && (
          <SchedulePlanChange
            currentPlan={tierLabel === "Pro" ? "pro" : "growth"}
            currentCycle={workspace.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY"}
          />
        )}
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

// Picker for scheduling a plan change at end-of-cycle. Disabled
// options match what the user is already on (no-op).
function SchedulePlanChange({
  currentPlan,
  currentCycle,
}: {
  currentPlan: "growth" | "pro";
  currentCycle: "MONTHLY" | "ANNUAL";
}) {
  return (
    <form
      method="POST"
      action="/api/paystack/schedule-change"
      className="schedule-change"
    >
      <div className="schedule-change-head">
        <strong>Change plan</strong>
        <span>Takes effect at the end of your current billing cycle.</span>
      </div>
      <div className="schedule-change-row">
        <label>
          <span>Plan</span>
          <select name="plan" defaultValue={currentPlan}>
            <option value="growth">Growth — ₦85,000/mo</option>
            <option value="pro">Pro — ₦150,000/mo</option>
          </select>
        </label>
        <label>
          <span>Billing</span>
          <select name="cycle" defaultValue={currentCycle}>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual (save 2 months)</option>
          </select>
        </label>
        <button type="submit" className="btn primary">Schedule change</button>
      </div>
    </form>
  );
}
