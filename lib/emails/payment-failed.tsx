import { Heading, Text } from "@react-email/components";
import { CtaButton, Layout, StatBlock, s, tokens } from "./layout";

export type PaymentFailedProps = {
  firstName: string;
  workspaceName: string;
  planLabel: string;
  priceLabel: string;
  retryUrl: string;
  daysOfDataRetention?: number;
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
      <Text style={s.kicker}>Action needed</Text>
      <Heading as="h1" style={s.h1}>
        Quick payment hiccup, {firstName}.
      </Heading>

      <Text style={s.lead}>
        Your last payment for{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>
          {workspaceName}
        </strong>{" "}
        didn&apos;t go through. Usually that&apos;s an expired card or a
        bank decline — both easy to fix.
      </Text>

      <StatBlock label="Plan" value={`${planLabel} · ${priceLabel}`} />

      <CtaButton href={retryUrl}>Retry payment →</CtaButton>

      <Text style={{ ...s.body, marginTop: "28px" }}>
        Your books, transactions and chat history are safe for at least{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>
          {daysOfDataRetention} more days
        </strong>{" "}
        while you sort this. Nothing&apos;s deleted.
      </Text>

      <Text style={s.smallMuted}>
        Stuck? Reply to this email and we&apos;ll help you get back on plan.
      </Text>
    </Layout>
  );
}

export default PaymentFailedEmail;
