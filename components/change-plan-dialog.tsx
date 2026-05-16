"use client";

// In-app modal for switching plans. Replaces the old "Change plan"
// link that jumped to /#pricing — that broke the founder's mental
// model (they're in Settings, why are they back on the marketing
// page?). Modal stays inside the dashboard, picks the right backend
// route based on current subscription status:
//
//   active        → POST /api/paystack/schedule-change   (takes effect at renewal)
//   pending / past_due → POST /api/paystack/checkout     (charges now)
//   non_renewing  → POST /api/paystack/checkout          (re-activate)
//
// One canonical entry point so we don't fork the upgrade UX again.

import { useEffect, useRef, useState } from "react";

export type ChangePlanContext = {
  /** Current plan ("growth" | "pro") for highlighting. */
  currentPlan: "growth" | "pro";
  currentCycle: "MONTHLY" | "ANNUAL";
  subscriptionStatus:
    | "pending"
    | "active"
    | "past_due"
    | "cancelled"
    | "non_renewing";
  /** ISO date of next renewal, for the "takes effect on …" copy. */
  currentPeriodEnd: string | null;
};

const PLANS = [
  {
    id: "growth" as const,
    name: "Growth",
    desc: "For SMEs running their own books.",
    monthlyNgn: 85_000,
  },
  {
    id: "pro" as const,
    name: "Pro",
    desc: "For SMEs with a finance team.",
    monthlyNgn: 150_000,
  },
];

function fmtNgn(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "next renewal";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ChangePlanDialog({
  open,
  onClose,
  context,
}: {
  open: boolean;
  onClose: () => void;
  context: ChangePlanContext;
}) {
  const [plan, setPlan] = useState<"growth" | "pro">(context.currentPlan);
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">(context.currentCycle);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset to current state every time the dialog opens.
  useEffect(() => {
    if (open) {
      setPlan(context.currentPlan);
      setCycle(context.currentCycle);
    }
  }, [open, context.currentPlan, context.currentCycle]);

  // Escape closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isActive = context.subscriptionStatus === "active";
  const isSame = plan === context.currentPlan && cycle === context.currentCycle;
  const submitEndpoint = isActive
    ? "/api/paystack/schedule-change"
    : "/api/paystack/checkout";

  const monthly =
    PLANS.find((p) => p.id === plan)?.monthlyNgn ?? 85_000;
  const priceLabel =
    cycle === "ANNUAL"
      ? `${fmtNgn(monthly * 10)}/yr · 2 months free`
      : `${fmtNgn(monthly)}/mo`;

  const subhead = isActive
    ? `Takes effect at the end of your current cycle (${fmtDate(context.currentPeriodEnd)}).`
    : "Pay now via Paystack to activate your subscription.";

  const submitLabel = isActive
    ? isSame
      ? "Already on this plan"
      : `Schedule change for ${fmtDate(context.currentPeriodEnd)}`
    : `Activate ${PLANS.find((p) => p.id === plan)?.name} →`;

  return (
    <div
      className="confirm-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-plan-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cp-card">
        <button
          type="button"
          className="cp-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="change-plan-title" className="cp-title">
          Change plan
        </h2>
        <p className="cp-sub">{subhead}</p>

        <form ref={formRef} method="POST" action={submitEndpoint}>
          <input type="hidden" name="plan"  value={plan} />
          <input type="hidden" name="cycle" value={cycle} />

          {/* Plan cards */}
          <div className="cp-plans">
            {PLANS.map((p) => {
              const on = plan === p.id;
              const isCurrent = p.id === context.currentPlan;
              return (
                <button
                  type="button"
                  key={p.id}
                  className={`cp-plan${on ? " on" : ""}`}
                  onClick={() => setPlan(p.id)}
                  aria-pressed={on}
                >
                  <div className="cp-plan-head">
                    <span className="cp-plan-name">{p.name}</span>
                    {isCurrent && <span className="cp-plan-tag">Current</span>}
                  </div>
                  <div className="cp-plan-price">
                    {fmtNgn(p.monthlyNgn)}
                    <span>/mo</span>
                  </div>
                  <div className="cp-plan-desc">{p.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Cycle */}
          <div className="cp-cycle">
            <label className={`cp-chip${cycle === "MONTHLY" ? " on" : ""}`}>
              <input
                type="radio"
                name="_cycle"
                checked={cycle === "MONTHLY"}
                onChange={() => setCycle("MONTHLY")}
              />
              Monthly
            </label>
            <label className={`cp-chip${cycle === "ANNUAL" ? " on" : ""}`}>
              <input
                type="radio"
                name="_cycle"
                checked={cycle === "ANNUAL"}
                onChange={() => setCycle("ANNUAL")}
              />
              Annual <span className="cp-save">save 2 months</span>
            </label>
          </div>

          <div className="cp-summary">
            You&apos;ll be billed{" "}
            <strong>{priceLabel}</strong>.
          </div>

          <div className="cp-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="cp-submit"
              disabled={isActive && isSame}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
