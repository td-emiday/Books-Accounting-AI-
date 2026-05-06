import Link from "next/link";
import { Transactions } from "@/components/transactions";
import { Bento } from "@/components/bento";
import { ExportMenu } from "@/components/export-menu";
import { Icon } from "@/components/icon";
import { Reports } from "@/components/reports";
import { Tax } from "@/components/tax";
import { TourModal } from "@/components/tour-modal";
import { UploadButton } from "@/components/upload-button";
import { REPORTS } from "@/lib/data/reports";
import { TAX_ITEMS } from "@/lib/data/tax";
import { getWorkspaceContext } from "@/lib/queries/workspace";
import { TIER_PRICE_NGN } from "@/lib/tiers";

function timeOfDayGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; billing?: string }>;
}) {
  const { firstName, isNewWorkspace, workspace } = await getWorkspaceContext();
  const { welcome, billing } = await searchParams;
  const greeting = timeOfDayGreeting();
  const isWelcome = welcome === "1" || welcome === "custom";
  const billingSuccess = billing === "success";

  // Show the "fix payment" banner only when something's actually
  // wrong (a charge failed). During the 10-day free trial we let the
  // TrialBanner alone do the nudge — stacking both was double-asking.
  const needsBilling =
    !billingSuccess &&
    workspace.subscriptionStatus === "past_due" &&
    (workspace.planTier === "GROWTH" || workspace.planTier === "PRO");
  const billingPlanPublic =
    workspace.planTier === "PRO" ? "pro" : "growth";

  // The tour shows once: post-onboarding, before any other prompt.
  const showTour = !workspace.tourCompletedAt;
  const tourPriceMonthly =
    billingPlanPublic === "pro"
      ? TIER_PRICE_NGN.pro
      : TIER_PRICE_NGN.growth;
  const tourPriceLabel =
    workspace.billingCycle === "ANNUAL"
      ? `₦${(tourPriceMonthly * 10).toLocaleString("en-NG")}/yr`
      : `₦${tourPriceMonthly.toLocaleString("en-NG")}/mo`;

  return (
    <>
      {showTour && (
        <TourModal
          firstName={firstName}
          plan={{
            publicId: billingPlanPublic,
            cycle: workspace.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY",
            label: billingPlanPublic === "pro" ? "Pro" : "Growth",
            priceLabel: tourPriceLabel,
          }}
        />
      )}
      {needsBilling && !showTour && (
        <form
          method="POST"
          action="/api/paystack/checkout"
          className="welcome-banner"
          role="region"
          aria-label="Add billing"
          style={{
            background:
              "linear-gradient(135deg, #fff5e1 0%, #fafaf6 100%)",
            borderColor: "#d4a017",
          }}
        >
          <input type="hidden" name="plan"  value={billingPlanPublic} />
          <input type="hidden" name="cycle" value={workspace.billingCycle} />
          <div className="welcome-banner-body">
            <div className="welcome-banner-kicker" style={{ color: "#8a5a00" }}>
              <Icon name="sparkle" size={13} /> Activate billing
            </div>
            <h2 className="welcome-banner-title">
              {workspace.subscriptionStatus === "past_due"
                ? "Your last payment didn't go through."
                : "Add billing to keep your " +
                  (billingPlanPublic === "pro" ? "Pro" : "Growth") +
                  " plan."}
            </h2>
            <p className="welcome-banner-sub">
              We use Paystack — pay with card, bank transfer, or USSD. You can
              cancel any time from Settings → Billing.
            </p>
          </div>
          <div className="welcome-banner-actions">
            <button type="submit" className="btn primary">
              Set up billing →
            </button>
            <Link href="/app/settings?tab=billing" className="welcome-banner-skip">
              Manage billing
            </Link>
          </div>
        </form>
      )}
      {isWelcome && (
        <div className="welcome-banner" role="region" aria-label="Welcome">
          <div className="welcome-banner-body">
            <div className="welcome-banner-kicker">
              <Icon name="sparkle" size={13} /> Welcome to Emiday
            </div>
            <h2 className="welcome-banner-title">
              Let&apos;s give me your last 6 months of bank statements.
            </h2>
            <p className="welcome-banner-sub">
              I&apos;ll categorise every line, draft your VAT, and surface what
              changed. PDFs, CSVs, or screenshots — whatever you have.
            </p>
          </div>
          <div className="welcome-banner-actions">
            <UploadButton />
            <Link href="/app" className="welcome-banner-skip">
              I&apos;ll do this later
            </Link>
          </div>
        </div>
      )}
      <div className="hero">
        <div>
          <h1>
            {greeting}, {firstName}.{" "}
            <em>
              {isNewWorkspace
                ? "Let's get your books loaded."
                : "Here's where things stand."}
            </em>
          </h1>
          <p className="sub">
            {isNewWorkspace
              ? "Upload a recent bank statement and I'll start categorising. Once your books have data, I'll surface VAT, P&L and what changed each week — right here."
              : "I've gone through your books overnight. One VAT return is ready for your sign-off — everything else is quiet today."}
          </p>
        </div>
        <div className="right">
          <UploadButton />
          {!isNewWorkspace && (
            <>
              <ExportMenu />
              <Link
                href="/reports/monthend"
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary"
              >
                <Icon name="sparkle" size={13} /> Close the month
              </Link>
            </>
          )}
        </div>
      </div>
      {!isNewWorkspace && (
        <>
          <Bento />

          <div className="section-title">
            Recent transactions <em>— what came in &amp; went out</em>
          </div>
          <Transactions preview limit={8} />

          <div className="section-title">
            On the horizon <em>— filings and payments</em>
          </div>
          <Tax items={TAX_ITEMS} />

          <div className="section-title">
            Reports <em>— ready when you are</em>
          </div>
          <Reports reports={REPORTS} />
        </>
      )}
    </>
  );
}
