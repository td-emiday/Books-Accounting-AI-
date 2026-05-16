// Fires a single transactional email through the same `sendMail`
// path the production code uses. Useful for:
//   - confirming Resend DNS + API key are wired (inbox vs spam)
//   - inspecting a template in a real inbox before signup
//
//   npx tsx scripts/send-test-email.ts <template> <to> [extra flag]
//
// Examples:
//   npx tsx scripts/send-test-email.ts welcome td@emiday.io
//   npx tsx scripts/send-test-email.ts trial_ending td@emiday.io
//   npx tsx scripts/send-test-email.ts trial_midpoint td@emiday.io --empty
//   npx tsx scripts/send-test-email.ts receipt td@emiday.io
//   npx tsx scripts/send-test-email.ts payment_failed td@emiday.io
//
// Reads env from .env.local (RESEND_API_KEY, MAIL_FROM, SERVICE_ROLE_KEY).

import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

import { sendMail } from "../lib/mail";

const [, , templateArg, toArg, ...flagArgs] = process.argv;

if (!templateArg || !toArg) {
  console.error(
    "usage: npx tsx scripts/send-test-email.ts <template> <to> [--empty]",
  );
  process.exit(1);
}

const flags = new Set(flagArgs);

async function main() {
  const to = toArg;
  const appUrl = "https://www.emiday.io/app";
  const billingUrl = "https://www.emiday.io/app/settings?tab=billing";

  switch (templateArg) {
    case "welcome": {
      await sendMail({
        template: "welcome",
        to,
        subject: "Welcome to Emiday, Temidayo — your 10 days starts now",
        props: {
          firstName: "Temidayo",
          workspaceName: "Emiday Test",
          appUrl,
          telegramBot: "EmidayBot",
        },
      });
      break;
    }
    case "trial_midpoint": {
      const empty = flags.has("--empty");
      await sendMail({
        template: "trial_midpoint",
        to,
        subject: empty
          ? "5 days left in your Emiday trial"
          : "Halfway through your trial — here's what's working",
        props: {
          firstName: "Temidayo",
          workspaceName: "Emiday Test",
          daysLeft: 5,
          txnsLogged: empty ? 0 : 47,
          topCategory: empty ? null : "Office Rent",
          topCategoryAmount: empty ? null : 450_000,
          appUrl,
        },
      });
      break;
    }
    case "trial_ending": {
      await sendMail({
        template: "trial_ending",
        to,
        subject: "Your trial ends tomorrow",
        props: {
          firstName: "Temidayo",
          workspaceName: "Emiday Test",
          hoursLeft: 23,
          txnsLogged: 47,
          planLabel: "Growth",
          priceLabel: "₦85,000/mo",
          billingUrl,
        },
      });
      break;
    }
    case "receipt": {
      await sendMail({
        template: "receipt",
        to,
        subject: "Receipt — ₦85,000 · Emiday Growth",
        props: {
          firstName: "Temidayo",
          workspaceName: "Emiday Test",
          amountKobo: 8_500_000,
          currency: "NGN",
          reference: "ps_2x9f8a7c3b1e",
          paidAt: new Date().toISOString(),
          planLabel: "Growth",
          cycleLabel: "Monthly",
          nextBillingDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          billingUrl,
        },
      });
      break;
    }
    case "payment_failed": {
      await sendMail({
        template: "payment_failed",
        to,
        subject: "We couldn't charge your card — let's fix that",
        props: {
          firstName: "Temidayo",
          workspaceName: "Emiday Test",
          planLabel: "Growth",
          priceLabel: "₦85,000/mo",
          retryUrl: billingUrl,
          daysOfDataRetention: 7,
        },
      });
      break;
    }
    default:
      console.error(
        `unknown template "${templateArg}". use: welcome | trial_midpoint | trial_ending | receipt | payment_failed`,
      );
      process.exit(1);
  }

  console.log(`✔ Sent "${templateArg}" to ${to}`);
}

main().catch((e) => {
  console.error("send failed:", e);
  process.exit(1);
});
