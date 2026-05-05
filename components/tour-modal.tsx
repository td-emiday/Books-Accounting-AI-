"use client";

// Six-step welcome tour shown once per workspace, immediately after
// onboarding lands the user on /app. The last step is the billing
// CTA — clicking it submits the existing /api/paystack/checkout
// flow. Skipping at any time still marks the tour complete (we don't
// want to nag), but leaves the billing banner up so they can pay later.

import { useState } from "react";
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
};

const STEPS = [
  {
    title: (firstName: string) => `Welcome, ${firstName}.`,
    body:
      "Two minutes to show you around. Skip any time — you can always come back to this from the help menu.",
    icon: "sparkle" as const,
    cta: "Show me around",
  },
  {
    title: () => "Upload your statements.",
    body:
      "Drop in 6 months of bank PDFs, CSVs, or screenshots. I'll categorise every line and rebuild your books overnight.",
    icon: "upload" as const,
    cta: "Next",
  },
  {
    title: () => "Tax & filings, drafted on time.",
    body:
      "VAT, PAYE, Pension, NSITF, CIT — I draft every return when it's due and let you pay in one click.",
    icon: "shield" as const,
    cta: "Next",
  },
  {
    title: () => "Reports that update themselves.",
    body:
      "P&L, Balance Sheet, Cashflow — rebuilt every time your books move. Export to PDF or share with your accountant.",
    icon: "chart" as const,
    cta: "Next",
  },
  {
    title: () => "Ask your CFO anything.",
    body:
      "Question about your numbers? Ask in plain English. I'll answer with the line items behind the answer.",
    icon: "chat" as const,
    cta: "Next",
  },
  {
    title: () => "Last step — set up billing.",
    body:
      "Activate your plan to keep using Emiday. We use Paystack — pay with card, bank transfer, or USSD. Cancel any time.",
    icon: "receipt" as const,
    cta: "Pay & start using Emiday",
  },
] as const;

async function markComplete() {
  try {
    await fetch("/api/tour/complete", { method: "POST" });
  } catch {
    // Non-fatal: the modal closes regardless. Worst case it shows once more.
  }
}

export function TourModal({ firstName, plan }: Props) {
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);

  if (closed) return null;
  const total = STEPS.length;
  const isLast = step === total - 1;
  const current = STEPS[step];

  function close() {
    void markComplete();
    setClosed(true);
  }

  function next() {
    if (isLast) return; // last step CTA submits the form
    setStep((i) => i + 1);
  }

  return (
    <div
      className="tour-scrim"
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
            <form
              method="POST"
              action="/api/paystack/checkout"
              onSubmit={() => {
                // Paystack hosted checkout takes over the tab; mark
                // the tour complete server-side first so the user
                // doesn't see it again on return.
                void markComplete();
              }}
              className="tour-cta-form"
            >
              <input type="hidden" name="plan"  value={plan.publicId} />
              <input type="hidden" name="cycle" value={plan.cycle} />
              <button type="submit" className="auth-primary tour-cta">
                {current.cta} →
              </button>
            </form>
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
