"use client";

// Thin status banner shown across /app/* while a workspace is in its
// 24-hour trial. Updates every 60s client-side so the countdown is
// fresh without re-rendering the rest of the dashboard.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorkspaceContext } from "./dashboard-data-context";
import { Icon } from "./icon";
import { trialStateFor, formatTrialLeft } from "@/lib/trial";

export function TrialBanner() {
  const { workspace } = useWorkspaceContext();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const trial = trialStateFor({
    subscriptionStatus: workspace.subscriptionStatus,
    trialEndsAt: workspace.trialEndsAt,
    planTier: workspace.planTier,
    now,
  });
  if (trial.status !== "trialing") return null;

  const checkoutPlan = workspace.planTier === "PRO" ? "pro" : "growth";

  return (
    <div className="trial-banner" role="status" aria-live="polite">
      <span className="trial-banner-dot" aria-hidden />
      <span className="trial-banner-body">
        <strong>Free trial</strong> · {formatTrialLeft(trial.msLeft)}
      </span>
      <span className="trial-banner-spacer" />
      <form method="POST" action="/api/paystack/checkout">
        <input type="hidden" name="plan"  value={checkoutPlan} />
        <input type="hidden" name="cycle" value={workspace.billingCycle} />
        <button type="submit" className="trial-banner-cta">
          <Icon name="sparkle" size={11} /> Activate plan
        </button>
      </form>
      <Link href="/app/settings?tab=billing" className="trial-banner-secondary">
        Manage
      </Link>
    </div>
  );
}
