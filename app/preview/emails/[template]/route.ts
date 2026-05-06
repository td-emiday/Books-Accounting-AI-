// GET /preview/emails/[template]
//
// Server-side renders any of the five transactional templates with
// realistic sample props and returns the HTML so a designer can
// inspect it in any browser tab. Auth-gated to signed-in users only
// so the staging URL never leaks design preview to crawlers.
//
// Available: welcome | trial_midpoint | trial_ending | receipt | payment_failed

import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { createClient } from "@/lib/supabase/server";
import { WelcomeEmail } from "@/lib/emails/welcome";
import { TrialMidpointEmail } from "@/lib/emails/trial-midpoint";
import { TrialEndingEmail } from "@/lib/emails/trial-ending";
import { ReceiptEmail } from "@/lib/emails/receipt";
import { PaymentFailedEmail } from "@/lib/emails/payment-failed";

export const dynamic = "force-dynamic";

const SAMPLES = {
  welcome: () =>
    WelcomeEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      appUrl: "https://www.emiday.io/app",
      telegramBot: "EmidayBot",
    }),
  trial_midpoint: () =>
    TrialMidpointEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      daysLeft: 5,
      txnsLogged: 47,
      topCategory: "Office Rent",
      topCategoryAmount: 450_000,
      appUrl: "https://www.emiday.io/app",
    }),
  trial_midpoint_empty: () =>
    TrialMidpointEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      daysLeft: 5,
      txnsLogged: 0,
      appUrl: "https://www.emiday.io/app",
    }),
  trial_ending: () =>
    TrialEndingEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      hoursLeft: 23,
      txnsLogged: 47,
      planLabel: "Growth",
      priceLabel: "₦85,000/mo",
      billingUrl: "https://www.emiday.io/app/settings?tab=billing",
    }),
  receipt: () =>
    ReceiptEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      amountKobo: 8_500_000,
      currency: "NGN",
      reference: "ps_2x9f8a7c3b1e",
      paidAt: new Date().toISOString(),
      planLabel: "Growth",
      cycleLabel: "Monthly",
      nextBillingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      billingUrl: "https://www.emiday.io/app/settings?tab=billing",
    }),
  payment_failed: () =>
    PaymentFailedEmail({
      firstName: "Adaeze",
      workspaceName: "Kadara Foods Ltd",
      planLabel: "Growth",
      priceLabel: "₦85,000/mo",
      retryUrl: "https://www.emiday.io/app/settings?tab=billing",
      daysOfDataRetention: 7,
    }),
} as const;

type TemplateKey = keyof typeof SAMPLES;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ template: string }> },
) {
  // Auth-gate the preview so we don't leak design WIP publicly.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      "https://www.emiday.io/sign-in?next=/preview/emails",
      303,
    );
  }

  const { template } = await params;
  const fn = SAMPLES[template as TemplateKey];
  if (!fn) {
    const list = Object.keys(SAMPLES)
      .map((k) => `<li><a href="/preview/emails/${k}">${k}</a></li>`)
      .join("");
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Email previews</title>` +
        `<style>body{font:14px/1.5 -apple-system,Inter,sans-serif;padding:40px;color:#15151a}a{color:#2e2c8a}</style>` +
        `<h1 style="font-weight:600;letter-spacing:-0.018em">Email previews</h1>` +
        `<ul>${list}</ul>`,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const html = await render(fn());
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
