"use client";

// Unified sign-up + onboarding wizard.
//
// One progressive flow with six steps. The same component renders on
// /sign-up (mode: "signup", step 0 only) and /onboarding (mode: "onboarding",
// steps 1–5). Visual chrome and progress indicator are identical so the
// transition between auth and onboarding feels like one continuous flow.
//
// Steps:
//   0  Account     — name / email / password (signup only)
//   1  Plan        — confirm tier + billing cycle
//   2  Business    — trading name, type, jurisdiction, industry, tax IDs
//   3  Banks       — multi-select. Persisted to workspaces.banks (real column).
//   4  Team        — invite teammates by email + role (skippable)
//   5  Done        — recap + finish

import { useState, type ReactNode } from "react";
import { Icon } from "./icon";
import { signUpAction } from "@/app/auth/actions";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { TIERS, type PublicTierId } from "@/lib/tiers";

const BUSINESS_TYPES = [
  { id: "SOLE_TRADER", label: "Sole trader", desc: "Just me for now" },
  { id: "LIMITED_COMPANY", label: "Limited company", desc: "Registered Ltd / Plc" },
  { id: "PARTNERSHIP", label: "Partnership", desc: "Two or more partners" },
  { id: "NGO", label: "NGO", desc: "Non-profit / foundation" },
];

const JURISDICTIONS = [
  { id: "NG", label: "Nigeria", flag: "🇳🇬" },
  { id: "GH", label: "Ghana", flag: "🇬🇭" },
  { id: "ZA", label: "South Africa", flag: "🇿🇦" },
];

const INDUSTRIES = [
  "Food & Beverage",
  "Retail / E-commerce",
  "Tech / Software",
  "Logistics & Transport",
  "Manufacturing",
  "Professional services",
  "Healthcare",
  "Creative / Media",
  "Agriculture",
  "Education",
  "Real estate",
  "Other",
];

// Providus is featured (recommended partner) — pinned first with a star.
// The featured flag drives the visual; the rest are alphabetical-ish in the
// order Nigerian SMEs tend to recognise.
export const NIGERIAN_BANKS: Array<{ name: string; featured?: boolean }> = [
  { name: "Providus", featured: true },
  { name: "GTBank" },
  { name: "Zenith" },
  { name: "Access" },
  { name: "UBA" },
  { name: "First Bank" },
  { name: "Stanbic IBTC" },
  { name: "Wema" },
  { name: "Sterling" },
  { name: "Fidelity" },
  { name: "Union Bank" },
  { name: "Ecobank" },
  { name: "Polaris" },
  { name: "FCMB" },
  { name: "Kuda" },
  { name: "Opay" },
  { name: "PalmPay" },
  { name: "Moniepoint" },
];

const INVITE_ROLES = [
  { id: "ACCOUNTANT", label: "Accountant" },
  { id: "FINANCE_LEAD", label: "Finance lead" },
  { id: "BOOKKEEPER", label: "Bookkeeper" },
  { id: "VIEWER", label: "View only" },
];

type Mode = "signup" | "onboarding";

const STEP_LABELS = [
  "Account",
  "Plan",
  "Business",
  "Banks",
  "Team",
  "Done",
] as const;

type Invite = { email: string; role: string };

type State = {
  // Step 1 – plan
  plan: PublicTierId;
  billing_cycle: "MONTHLY" | "ANNUAL";

  // Step 2 – business
  trading_name: string;
  business_type: string;
  jurisdiction: string;
  industry: string;
  tin: string;
  rc_number: string;
  vat_registered: boolean;
  vat_number: string;

  // Step 3 – banks
  banks: string[];

  // Step 4 – team invites
  invites: Invite[];
  invite_email: string;
  invite_role: string;
};

function initialState(plan: PublicTierId, defaultTradingName: string): State {
  return {
    plan,
    billing_cycle: "MONTHLY",
    trading_name: defaultTradingName,
    business_type: "LIMITED_COMPANY",
    jurisdiction: "NG",
    industry: "",
    tin: "",
    rc_number: "",
    vat_registered: false,
    vat_number: "",
    banks: [],
    invites: [],
    invite_email: "",
    invite_role: "ACCOUNTANT",
  };
}

export function OnboardingWizard({
  mode,
  firstName,
  defaultTradingName,
  plan = "growth",
  defaultBanks = [],
  error,
}: {
  mode: Mode;
  firstName: string;
  defaultTradingName: string;
  plan?: PublicTierId;
  defaultBanks?: string[];
  error?: string;
}) {
  // signup → start at Account (0). Onboarding → start at Plan (1).
  const [step, setStep] = useState<number>(mode === "signup" ? 0 : 1);
  const [s, setS] = useState<State>({
    ...initialState(plan, defaultTradingName),
    banks: defaultBanks,
  });

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const toggleBank = (b: string) =>
    setS((prev) => ({
      ...prev,
      banks: prev.banks.includes(b)
        ? prev.banks.filter((x) => x !== b)
        : [...prev.banks, b],
    }));

  const addInvite = () => {
    const email = s.invite_email.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    if (s.invites.some((i) => i.email === email)) return;
    setS((prev) => ({
      ...prev,
      invites: [...prev.invites, { email, role: prev.invite_role }],
      invite_email: "",
    }));
  };

  const removeInvite = (email: string) =>
    setS((prev) => ({
      ...prev,
      invites: prev.invites.filter((i) => i.email !== email),
    }));

  const next = () => setStep((i) => Math.min(i + 1, STEP_LABELS.length - 1));
  const back = () => setStep((i) => Math.max(i - 1, mode === "signup" ? 0 : 1));

  const isLast = step === STEP_LABELS.length - 1;
  const planConfig = TIERS[s.plan];
  const isCustom = s.plan === "custom";

  return (
    <div className="onb-shell">
      <div className="onb-card">
        <header className="onb-head">
          <div className="onb-brand">
            <span className="onb-mark">e</span>
            <span>Emiday</span>
          </div>
          <ol className="onb-steps" aria-label="Onboarding progress">
            {STEP_LABELS.map((label, i) => {
              const cn =
                i === step
                  ? "on"
                  : i < step || (mode === "onboarding" && i === 0)
                    ? "done"
                    : "";
              return (
                <li key={label} className={cn}>
                  <span className="onb-step-n">
                    {cn === "done" ? <Icon name="check" size={11} /> : i + 1}
                  </span>
                  <span className="onb-step-l">{label}</span>
                </li>
              );
            })}
          </ol>
        </header>

        {error ? <div className="auth-error">{error}</div> : null}

        {/* ─────────────── STEP 0 — Account (signup only) ─────────────── */}
        {step === 0 && mode === "signup" && (
          <form action={signUpAction} className="onb-form">
            <input type="hidden" name="plan" value={s.plan} />
            <Panel
              kicker="Create your account"
              title="Let's get you set up."
              hint="Two minutes to a workspace that runs your books for you."
              body={
                <>
                  <Field label="Full name">
                    <input
                      type="text"
                      name="full_name"
                      autoComplete="name"
                      required
                      autoFocus
                      placeholder="e.g. Adaeze Okonkwo"
                    />
                  </Field>
                  <Field label="Work email">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.com"
                    />
                  </Field>
                  <Field label="Password" hint="Minimum 8 characters.">
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      className="onb-input-lg"
                      placeholder="Create a password"
                    />
                  </Field>
                  <div className="onb-plan-tag">
                    Selected plan{" "}
                    <strong>{TIERS[s.plan].label}</strong>{" "}
                    <button
                      type="button"
                      className="onb-text-link"
                      onClick={() => {
                        // Cycle through plans inline so user can switch
                        // before committing.
                        const order: PublicTierId[] = ["growth", "pro", "custom"];
                        const i = order.indexOf(s.plan);
                        set("plan", order[(i + 1) % order.length]);
                      }}
                    >
                      change
                    </button>
                  </div>
                </>
              }
            />
            <footer className="onb-foot">
              <span className="onb-foot-step muted">
                Step 1 of {STEP_LABELS.length}
              </span>
              <button type="submit" className="auth-primary">
                Create account →
              </button>
            </footer>
          </form>
        )}

        {/* ─── STEP 1+ — onboarding wizard, single submit at the end ─── */}
        {step >= 1 && mode === "onboarding" && (
          <form action={completeOnboardingAction} className="onb-form">
            {/* Hidden mirrors so the final submit carries every field. */}
            <input type="hidden" name="plan"          value={s.plan} />
            <input type="hidden" name="billing_cycle" value={s.billing_cycle} />
            <input type="hidden" name="trading_name"  value={s.trading_name} />
            <input type="hidden" name="business_type" value={s.business_type} />
            <input type="hidden" name="jurisdiction"  value={s.jurisdiction} />
            <input type="hidden" name="industry"      value={s.industry} />
            <input type="hidden" name="tin"           value={s.tin} />
            <input type="hidden" name="rc_number"     value={s.rc_number} />
            {s.vat_registered && (
              <input type="hidden" name="vat_registered" value="on" />
            )}
            <input type="hidden" name="vat_number" value={s.vat_number} />
            {s.banks.map((b) => (
              <input key={b} type="hidden" name="banks" value={b} />
            ))}
            {s.invites.map((inv) => (
              <input
                key={inv.email}
                type="hidden"
                name="invites"
                value={`${inv.email}|${inv.role}`}
              />
            ))}

            {/* ────────────── STEP 1 — Plan & billing ────────────── */}
            {step === 1 && (
              <Panel
                kicker={`Welcome, ${firstName}`}
                title="Pick a plan."
                hint="You won't be charged today — your first 10 days are on us. Cancel any time."
                body={
                  <>
                    <Field label="Plan">
                      <select
                        value={s.plan}
                        onChange={(e) => set("plan", e.target.value as PublicTierId)}
                      >
                        <option value="growth">
                          Growth — ₦85,000/month · Run your own books
                        </option>
                        <option value="pro">
                          Pro — ₦150,000/month · Bigger team, bigger volume
                        </option>
                        <option value="custom">
                          Custom — Quote · Firms &amp; multi-entity
                        </option>
                      </select>
                    </Field>

                    {!isCustom && (
                      <Field label="Billing cycle">
                        <div className="onb-row">
                          <label
                            className={`onb-chip${
                              s.billing_cycle === "MONTHLY" ? " on" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="_billing"
                              checked={s.billing_cycle === "MONTHLY"}
                              onChange={() => set("billing_cycle", "MONTHLY")}
                            />
                            Monthly
                          </label>
                          <label
                            className={`onb-chip${
                              s.billing_cycle === "ANNUAL" ? " on" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="_billing"
                              checked={s.billing_cycle === "ANNUAL"}
                              onChange={() => set("billing_cycle", "ANNUAL")}
                            />
                            Annual <span className="onb-save-pill">save 2 months</span>
                          </label>
                        </div>
                      </Field>
                    )}

                    {isCustom && (
                      <p className="onb-note">
                        Custom plans are quoted per workspace. We&apos;ll reach out
                        within 1 business day to scope your needs.
                      </p>
                    )}
                  </>
                }
              />
            )}

            {/* ───────── STEP 2 — Business + Tax (combined) ───────── */}
            {step === 2 && (
              <Panel
                kicker="About the business"
                title="Tell me about the business."
                hint="Anything you skip can be added later from Settings."
                body={
                  <>
                    <Field label="Trading name">
                      <input
                        type="text"
                        value={s.trading_name}
                        onChange={(e) => set("trading_name", e.target.value)}
                        placeholder="e.g. Kadara Foods Ltd"
                        autoFocus
                      />
                    </Field>

                    <Field label="What kind of business?">
                      <div className="onb-cards">
                        {BUSINESS_TYPES.map((bt) => (
                          <label
                            key={bt.id}
                            className={`onb-pick${
                              s.business_type === bt.id ? " on" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={s.business_type === bt.id}
                              onChange={() => set("business_type", bt.id)}
                            />
                            <span className="onb-pick-l">{bt.label}</span>
                            <span className="onb-pick-d">{bt.desc}</span>
                          </label>
                        ))}
                      </div>
                    </Field>

                    <div className="onb-grid-2">
                      <Field label="Where are you based?">
                        <div className="onb-row">
                          {JURISDICTIONS.map((j) => (
                            <label
                              key={j.id}
                              className={`onb-chip${
                                s.jurisdiction === j.id ? " on" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                checked={s.jurisdiction === j.id}
                                onChange={() => set("jurisdiction", j.id)}
                              />
                              <span aria-hidden>{j.flag}</span> {j.label}
                            </label>
                          ))}
                        </div>
                      </Field>

                      <Field label="Industry">
                        <select
                          value={s.industry}
                          onChange={(e) => set("industry", e.target.value)}
                        >
                          <option value="">Choose one…</option>
                          {INDUSTRIES.map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="onb-divider" />

                    <div className="onb-grid-2">
                      <Field label="TIN" hint="Tax Identification Number">
                        <input
                          type="text"
                          value={s.tin}
                          onChange={(e) => set("tin", e.target.value)}
                          placeholder="e.g. 1488-2011-8402"
                        />
                      </Field>
                      <Field label="RC number" hint="From CAC">
                        <input
                          type="text"
                          value={s.rc_number}
                          onChange={(e) => set("rc_number", e.target.value)}
                          placeholder="e.g. RC 1882301"
                        />
                      </Field>
                    </div>

                    <Field label="VAT registered?">
                      <label className="onb-toggle">
                        <input
                          type="checkbox"
                          checked={s.vat_registered}
                          onChange={(e) =>
                            set("vat_registered", e.target.checked)
                          }
                        />
                        <span>Yes — I charge 7.5% VAT on invoices</span>
                      </label>
                    </Field>
                    {s.vat_registered && (
                      <Field label="VAT number">
                        <input
                          type="text"
                          value={s.vat_number}
                          onChange={(e) => set("vat_number", e.target.value)}
                          placeholder="e.g. VAT-20110832"
                        />
                      </Field>
                    )}
                  </>
                }
              />
            )}

            {/* ─────────────────── STEP 3 — Banks ─────────────────── */}
            {step === 3 && (
              <Panel
                kicker="Banking"
                title="Which banks do you use?"
                hint="Pick all that apply. We'll prioritise feeds for these and surface them across reports and filters."
                body={
                  <>
                    <div className="onb-banks">
                      {NIGERIAN_BANKS.map((b) => {
                        const on = s.banks.includes(b.name);
                        return (
                          <button
                            key={b.name}
                            type="button"
                            className={`onb-bank${on ? " on" : ""}${b.featured ? " featured" : ""}`}
                            onClick={() => toggleBank(b.name)}
                          >
                            <span className="onb-bank-tick" aria-hidden>
                              {on ? <Icon name="check" size={11} /> : null}
                            </span>
                            <span className="onb-bank-name">{b.name}</span>
                            {b.featured && (
                              <span
                                className="onb-bank-star"
                                aria-label="Recommended partner"
                                title="Recommended partner"
                              >
                                ★
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="onb-note">
                      Selected: <strong>{s.banks.length}</strong>
                      {s.banks.length === 0 && " · skip if you'd rather connect later."}
                    </p>
                  </>
                }
              />
            )}

            {/* ──────────────────── STEP 4 — Team ──────────────────── */}
            {step === 4 && (
              <Panel
                kicker="Team"
                title="Bring in your accountant or team."
                hint="They'll get an email invite. You can do this later from Settings → Team."
                body={
                  <>
                    <div className="onb-invite-row">
                      <input
                        type="email"
                        value={s.invite_email}
                        onChange={(e) => set("invite_email", e.target.value)}
                        placeholder="teammate@email.com"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addInvite();
                          }
                        }}
                      />
                      <select
                        value={s.invite_role}
                        onChange={(e) => set("invite_role", e.target.value)}
                      >
                        {INVITE_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="onb-add-btn"
                        onClick={addInvite}
                      >
                        Add
                      </button>
                    </div>

                    {s.invites.length > 0 && (
                      <ul className="onb-invite-list">
                        {s.invites.map((inv) => (
                          <li key={inv.email}>
                            <span className="onb-invite-email">{inv.email}</span>
                            <span className="onb-invite-role">
                              {INVITE_ROLES.find((r) => r.id === inv.role)
                                ?.label ?? inv.role}
                            </span>
                            <button
                              type="button"
                              className="onb-invite-remove"
                              onClick={() => removeInvite(inv.email)}
                              aria-label={`Remove ${inv.email}`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {s.invites.length === 0 && (
                      <p className="onb-note muted">
                        No invites yet. Skip this step if you&apos;re flying solo.
                      </p>
                    )}
                  </>
                }
              />
            )}

            {/* ──────────────────── STEP 5 — Done ──────────────────── */}
            {step === 5 && (
              <Panel
                kicker="All set"
                title={`We're ready, ${firstName}.`}
                body={
                  <>
                    <p>
                      I&apos;ll spin up your workspace, build a chart of
                      accounts that matches your industry, and start watching
                      for transactions.
                    </p>
                    <ul className="onb-summary">
                      <li>
                        <strong>Plan</strong>
                        <span>
                          {planConfig.label}
                          {!isCustom && ` · ${s.billing_cycle.toLowerCase()}`}
                        </span>
                      </li>
                      <li>
                        <strong>Business</strong>
                        <span>{s.trading_name || "Unnamed"}</span>
                      </li>
                      <li>
                        <strong>Type</strong>
                        <span>
                          {BUSINESS_TYPES.find((b) => b.id === s.business_type)
                            ?.label ?? "—"}
                        </span>
                      </li>
                      <li>
                        <strong>Jurisdiction</strong>
                        <span>
                          {JURISDICTIONS.find((j) => j.id === s.jurisdiction)
                            ?.label ?? "—"}
                        </span>
                      </li>
                      <li>
                        <strong>Industry</strong>
                        <span>{s.industry || "—"}</span>
                      </li>
                      <li>
                        <strong>VAT</strong>
                        <span>
                          {s.vat_registered ? "Registered" : "Not registered"}
                        </span>
                      </li>
                      <li>
                        <strong>Banks</strong>
                        <span>
                          {s.banks.length > 0 ? s.banks.join(", ") : "—"}
                        </span>
                      </li>
                      <li>
                        <strong>Invites</strong>
                        <span>
                          {s.invites.length > 0
                            ? `${s.invites.length} pending`
                            : "—"}
                        </span>
                      </li>
                    </ul>
                  </>
                }
              />
            )}

            <footer className="onb-foot">
              <button
                type="button"
                className="btn"
                onClick={back}
                disabled={step === 1}
              >
                Back
              </button>
              <span className="onb-foot-step muted">
                Step {step + 1} of {STEP_LABELS.length}
              </span>
              {!isLast ? (
                <div className="onb-foot-cta">
                  {step === 4 && (
                    <button
                      type="button"
                      className="btn onb-skip"
                      onClick={() => {
                        // Skip clears any half-typed invite and advances.
                        setS((prev) => ({ ...prev, invite_email: "" }));
                        next();
                      }}
                    >
                      Skip
                    </button>
                  )}
                  <button type="button" className="auth-primary" onClick={next}>
                    Continue →
                  </button>
                </div>
              ) : (
                <button type="submit" className="auth-primary">
                  Open my dashboard →
                </button>
              )}
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

function Panel({
  kicker,
  title,
  hint,
  body,
}: {
  kicker: string;
  title: string;
  hint?: string;
  body: ReactNode;
}) {
  return (
    <div className="onb-panel">
      <div className="onb-kicker">{kicker}</div>
      <h2 className="onb-title">{title}</h2>
      {hint && <p className="onb-hint">{hint}</p>}
      <div className="onb-body">{body}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="onb-field">
      <span className="onb-field-l">
        {label}
        {hint && <span className="onb-field-hint"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
