// /trial-expired
//
// Soft lock-out reached when the 24h trial closes and there's no
// active subscription. The dashboard layout redirects here. We render
// a focused upgrade screen with a single Pay CTA + Sign-out escape
// hatch, no app chrome.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/queries/workspace";
import { trialStateFor } from "@/lib/trial";
import { TIER_PRICE_NGN } from "@/lib/tiers";

export default async function TrialExpiredPage() {
  const ctx = await getWorkspaceContext();
  const trial = trialStateFor({
    subscriptionStatus: ctx.workspace.subscriptionStatus,
    trialEndsAt: ctx.workspace.trialEndsAt,
    planTier: ctx.workspace.planTier,
  });

  // Already paid or still in trial → bounce them back to /app.
  if (trial.status !== "locked") {
    redirect("/app");
  }

  const planPublic =
    ctx.workspace.planTier === "PRO" ? "pro" : "growth";
  const monthly =
    planPublic === "pro" ? TIER_PRICE_NGN.pro : TIER_PRICE_NGN.growth;
  const cycle = ctx.workspace.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const priceLabel =
    cycle === "ANNUAL"
      ? `₦${(monthly * 10).toLocaleString("en-NG")}/yr`
      : `₦${monthly.toLocaleString("en-NG")}/mo`;

  return (
    <main className="lock-shell">
      <div className="lock-card">
        <div className="lock-kicker">Trial ended</div>
        <h1 className="lock-title">
          Your 10-day free trial is up, {ctx.firstName}.
        </h1>
        <p className="lock-body">
          Activate your{" "}
          <strong>{planPublic === "pro" ? "Pro" : "Growth"}</strong> plan to
          keep using Emiday. Cancel any time from Settings → Billing.
        </p>

        <div className="lock-recap">
          <div className="lock-recap-row">
            <span>Plan</span>
            <strong>{planPublic === "pro" ? "Pro" : "Growth"}</strong>
          </div>
          <div className="lock-recap-row">
            <span>Billing</span>
            <strong>
              {priceLabel} · {cycle === "ANNUAL" ? "annual" : "monthly"}
            </strong>
          </div>
        </div>

        <form method="POST" action="/api/paystack/checkout" className="lock-cta-row">
          <input type="hidden" name="plan"  value={planPublic} />
          <input type="hidden" name="cycle" value={cycle} />
          <button type="submit" className="auth-primary lock-cta">
            Activate {planPublic === "pro" ? "Pro" : "Growth"} →
          </button>
        </form>

        <div className="lock-aux">
          <Link href="/#pricing" className="lock-link">Compare plans</Link>
          <span aria-hidden>·</span>
          <form method="POST" action="/auth/sign-out" style={{ display: "inline" }}>
            <button type="submit" className="lock-link as-button">Sign out</button>
          </form>
        </div>
      </div>
    </main>
  );
}
