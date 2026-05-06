import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout } from "./layout";

export type TrialEndingProps = {
  firstName: string;
  workspaceName: string;
  hoursLeft: number;
  txnsLogged: number;
  planLabel: string;        // "Growth" | "Pro"
  priceLabel: string;       // "₦85,000/mo"
  billingUrl: string;       // /api/paystack/checkout-style URL OR /app/settings?tab=billing
};

export function TrialEndingEmail({
  firstName,
  workspaceName,
  hoursLeft,
  txnsLogged,
  planLabel,
  priceLabel,
  billingUrl,
}: TrialEndingProps) {
  return (
    <Layout
      preview={`Your trial ends in about ${Math.round(hoursLeft)} hours`}
    >
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.015em] text-ink">
        Your trial ends tomorrow.
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
        {firstName}, in roughly <strong>{Math.round(hoursLeft)} hours</strong>{" "}
        your access to <strong>{workspaceName}</strong> drops to read-only
        until billing is active.
      </Text>

      {txnsLogged > 0 ? (
        <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
          You&apos;ve logged <strong>{txnsLogged}</strong> transactions
          on this trial. The categorisation and reports are yours either
          way — activating just keeps the lights on going forward.
        </Text>
      ) : (
        <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
          You haven&apos;t uploaded data yet — but the trial doesn&apos;t
          extend, and your workspace is set up. Activate to keep it.
        </Text>
      )}

      <Text className="m-0 mb-6 text-[15px] leading-[1.55] text-ink">
        Your plan is <strong>{planLabel}</strong> at{" "}
        <strong>{priceLabel}</strong>. Cancel anytime from Settings.
      </Text>

      <Section className="mb-2">
        <CtaButton href={billingUrl}>Activate {planLabel} →</CtaButton>
      </Section>

      <Text className="m-0 mt-6 text-[14px] leading-[1.55] text-ink2">
        Want to switch plans or chat first? Reply to this email.
      </Text>
    </Layout>
  );
}

export default TrialEndingEmail;
