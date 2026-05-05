// Registers the Telegram Bot webhook URL + secret. Run once after
// you've set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and
// NEXT_PUBLIC_SITE_URL in env.
//
//   npx tsx scripts/telegram-set-webhook.ts
//
// Re-run after deploying to a new domain or rotating the secret.

import { setWebhook } from "../lib/telegram";

async function main() {
  const site =
    process.env.WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.emiday.io";
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Missing TELEGRAM_WEBHOOK_SECRET in env");
    process.exit(1);
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN in env");
    process.exit(1);
  }
  const url = `${site.replace(/\/$/, "")}/api/inbound/telegram`;
  console.log(`Registering Telegram webhook: ${url}`);
  await setWebhook({ url, secret_token: secret });
  console.log("✔ Webhook set. Test by messaging the bot.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
