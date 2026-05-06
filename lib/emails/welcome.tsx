import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout } from "./layout";

export type WelcomeProps = {
  firstName: string;
  workspaceName: string;
  appUrl: string;          // e.g. https://www.emiday.io/app
  telegramBot?: string;    // e.g. EmidayBot
};

export function WelcomeEmail({
  firstName,
  workspaceName,
  appUrl,
  telegramBot,
}: WelcomeProps) {
  return (
    <Layout
      preview={`Welcome to Emiday, ${firstName} — your 10 days starts now`}
    >
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.015em] text-ink">
        Welcome, {firstName}.
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
        Your workspace <strong>{workspaceName}</strong> is live, and your
        10-day free trial just started. Use everything Emiday does, no
        card needed.
      </Text>

      <Text className="m-0 mb-3 text-[15px] leading-[1.55] text-ink">
        Three things that get you the most out of the next ten days:
      </Text>

      <Section className="mb-6">
        <Text className="m-0 mb-2 text-[14px] leading-[1.5] text-ink">
          <strong>1. Upload a bank statement.</strong> I&apos;ll have a
          P&amp;L for you in about 4 minutes.
        </Text>
        <Text className="m-0 mb-2 text-[14px] leading-[1.5] text-ink">
          <strong>2. Connect Telegram.</strong> Snap any receipt to{" "}
          {telegramBot ? `@${telegramBot}` : "the bot"} — I&apos;ll OCR
          and log it as a draft transaction.
        </Text>
        <Text className="m-0 mb-2 text-[14px] leading-[1.5] text-ink">
          <strong>3. Ask me anything.</strong> &quot;What&apos;s my net
          this month?&quot; · &quot;Biggest expense last week?&quot; ·
          &quot;Do I owe VAT?&quot; — answers from your real numbers.
        </Text>
      </Section>

      <Section className="mb-2">
        <CtaButton href={appUrl}>Open my dashboard →</CtaButton>
      </Section>

      <Text className="m-0 mt-6 text-[14px] leading-[1.55] text-ink2">
        If anything looks off, hit reply — a real person reads it.
      </Text>
    </Layout>
  );
}

export default WelcomeEmail;
