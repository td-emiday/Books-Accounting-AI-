"use client";

// Six-step welcome tour shown once per workspace, immediately after
// onboarding lands the user on /app. The last step is the billing
// CTA — clicking it submits the existing /api/paystack/checkout
// flow. Skipping at any time still marks the tour complete (we don't
// want to nag), but leaves the billing banner up so they can pay later.

import { useEffect, useState } from "react";
import { Icon } from "./icon";

type Plan = {
  publicId: "growth" | "pro";
  cycle: "MONTHLY" | "ANNUAL";
  label: string;
  priceLabel: string;
};

type Props = {
  firstName: string;
  plan: Plan;
  /** Workspace id — used to scope the "tour done" localStorage flag
   *  so a fresh signup in the same browser actually sees the tour
   *  again instead of inheriting the previous account's flag. */
  workspaceId: string;
};

// `target` is a CSS selector for an element on the dashboard. When set,
// the tour highlights that element with a glowing ring + dimmed scrim.
// Most steps target sidebar links — those are always rendered, so the
// spotlight works even on a freshly-onboarded empty workspace.
const STEPS = [
  {
    title: (firstName: string) => `Welcome, ${firstName}.`,
    body:
      "Two minutes to show you around. Skip any time — you can always come back to this from the help menu.",
    icon: "sparkle" as const,
    cta: "Show me around",
    target: null,
  },
  {
    title: () => "Upload your statements.",
    body:
      "Drop in 6 months of bank PDFs, CSVs, or screenshots. I'll categorise every line and rebuild your books overnight.",
    icon: "upload" as const,
    cta: "Next",
    target: '[data-tour="upload"]',
  },
  {
    title: () => "Tax & filings, drafted on time.",
    body:
      "VAT, PAYE, Pension, NSITF, CIT — I draft every return when it's due and let you pay in one click.",
    icon: "shield" as const,
    cta: "Next",
    target: '[data-tour="tax"]',
  },
  {
    title: () => "Reports that update themselves.",
    body:
      "P&L, Balance Sheet, Cashflow — rebuilt every time your books move. Export to PDF or share with your accountant.",
    icon: "chart" as const,
    cta: "Next",
    target: '[data-tour="reports"]',
  },
  {
    title: () => "Ask your CFO anything.",
    body:
      "Question about your numbers? Ask in plain English. I'll answer with the line items behind the answer.",
    icon: "chat" as const,
    cta: "Next",
    target: '[data-tour="chat"]',
  },
  {
    title: () => "Your 10-day free trial starts now.",
    body:
      "Use everything Emiday does for 10 days, no card needed. Add billing whenever you're ready — we use Paystack for cards, bank transfer or USSD. Cancel any time.",
    icon: "sparkle" as const,
    cta: "Start using Emiday",
    target: null,
  },
] as const;

// Per-workspace localStorage flag for the (rare) race where the user
// clicks Skip or Pay and the server write is still in flight when /app
// re-renders. Keyed by workspace id so each new signup gets its own
// blank slate — fixes the bug where a fresh signup in the same browser
// inherited a stale "done" flag from a previous test account.
const lsKey = (workspaceId: string) => `emiday.tour.completed.${workspaceId}`;

function setLocalDone(workspaceId: string) {
  try {
    localStorage.setItem(lsKey(workspaceId), "1");
  } catch {
    /* private mode / quota — non-fatal */
  }
}

function hasLocalDone(workspaceId: string): boolean {
  try {
    return localStorage.getItem(lsKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

async function markComplete(workspaceId: string) {
  setLocalDone(workspaceId);
  try {
    // keepalive lets the request finish even if the page is navigating
    // away (e.g. user clicked "Pay & start using Emiday" → Paystack).
    await fetch("/api/tour/complete", { method: "POST", keepalive: true });
  } catch {
    // Non-fatal — the Paystack checkout route also marks the tour
    // complete server-side as a safety net.
  }
}

export function TourModal({ firstName, plan, workspaceId }: Props) {
  const [step, setStep] = useState(0);
  // Initialise closed=true when localStorage says THIS workspace's
  // tour is already done — catches the race where /app's server
  // render reads a stale `tour_completed_at: null`. Scoped per
  // workspace so a fresh signup in the same browser gets a fresh
  // tour, not a stale flag from a previous account.
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (hasLocalDone(workspaceId)) setClosed(true);
  }, [workspaceId]);

  // Spotlight: find the target for this step, scroll it into view, and
  // toggle a CSS class that lifts it above the scrim with a halo.
  useEffect(() => {
    if (closed) return;
    const sel = STEPS[step]?.target;
    if (!sel) return;
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return;
    el.classList.add("tour-target-on");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => {
      el.classList.remove("tour-target-on");
    };
  }, [step, closed]);

  if (closed) return null;
  const total = STEPS.length;
  const isLast = step === total - 1;
  const current = STEPS[step];

  async function close() {
    // Set the localStorage flag synchronously so a fast re-mount
    // (e.g. user clicks Skip then immediately navigates) sees it.
    setLocalDone(workspaceId);
    setClosed(true);
    // Then send the server write — best effort, keepalive survives nav.
    void markComplete(workspaceId);
  }

  function next() {
    if (isLast) return; // last step CTA submits the form
    setStep((i) => i + 1);
  }

  const hasTarget = Boolean(current.target);

  return (
    <div
      className={`tour-scrim${hasTarget ? " has-target" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="tour-card">
        <button
          type="button"
          className="tour-skip"
          onClick={close}
          aria-label="Close tour"
        >
          Skip
        </button>

        <div className="tour-icon" aria-hidden>
          <Icon name={current.icon} size={20} />
        </div>

        <h2 id="tour-title" className="tour-title">
          {current.title(firstName)}
        </h2>
        <p className="tour-body">{current.body}</p>

        {isLast && (
          <div className="tour-recap">
            <div className="tour-recap-row">
              <span>Plan</span>
              <strong>{plan.label}</strong>
            </div>
            <div className="tour-recap-row">
              <span>Billing</span>
              <strong>
                {plan.priceLabel} ·{" "}
                {plan.cycle === "ANNUAL" ? "annual" : "monthly"}
              </strong>
            </div>
          </div>
        )}

        <div className="tour-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={i === step ? "on" : i < step ? "done" : ""}
            />
          ))}
        </div>

        <div className="tour-foot">
          {step > 0 && (
            <button
              type="button"
              className="btn"
              onClick={() => setStep((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
          )}
          <span className="tour-foot-step">
            Step {step + 1} of {total}
          </span>
          {isLast ? (
            // 10-day trial flow: the last step doesn't push the user
            // into Paystack — it just closes the tour and drops them
            // on the dashboard. They can activate billing any time
            // from the trial banner or Settings → Billing.
            <button
              type="button"
              className="auth-primary tour-cta"
              onClick={close}
            >
              {current.cta} →
            </button>
          ) : (
            <button
              type="button"
              className="auth-primary tour-cta"
              onClick={next}
            >
              {current.cta} →
            </button>
          )}
        </div>

        {isLast && (
          <button type="button" className="tour-later" onClick={close}>
            I&apos;ll do this later
          </button>
        )}
      </div>
    </div>
  );
}
