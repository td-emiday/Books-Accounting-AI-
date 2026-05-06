import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout } from "./layout";

export type PaymentFailedProps = {
  firstName: string;
  workspaceName: string;
  planLabel: string;
  priceLabel: string;
  retryUrl: string;
  daysOfDataRetention?: number;   // default 7
};

export function PaymentFailedEmail({
  firstName,
  workspaceName,
  planLabel,
  priceLabel,
  retryUrl,
  daysOfDataRetention = 7,
}: PaymentFailedProps) {
  return (
    <Layout preview="We couldn't charge your card — let's fix that">
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.015em] text-ink">
        Quick payment hiccup, {firstName}.
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
        Your last payment for <strong>{workspaceName}</strong> didn&apos;t
        go through. This usually means the card on file expired or your
        bank declined the charge — both are easy to fix.
      </Text>

      <Section className="my-6 border border-line rounded-[10px] px-5 py-4">
        <Text className="m-0 text-[12px] uppercase tracking-[0.06em] text-muted">
          Plan
        </Text>
        <Text className="m-0 mt-2 text-[18px] font-semibold tracking-[-0.01em] text-ink">
          {planLabel} · {priceLabel}
        </Text>
      </Section>

      <Section className="mb-6">
        <CtaButton href={retryUrl}>Retry payment →</CtaButton>
      </Section>

      <Text className="m-0 mb-3 text-[14px] leading-[1.55] text-ink">
        Your books, transactions and chat history are safe for at least{" "}
        <strong>{daysOfDataRetention} more days</strong> while you sort
        this out — nothing&apos;s deleted.
      </Text>

      <Text className="m-0 text-[14px] leading-[1.55] text-ink2">
        Stuck? Reply to this email and we&apos;ll help you get back on
        plan.
      </Text>
    </Layout>
  );
}

export default PaymentFailedEmail;
