import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout, s, tokens } from "./layout";

export type TrialEndingProps = {
  firstName: string;
  workspaceName: string;
  hoursLeft: number;
  txnsLogged: number;
  planLabel: string;
  priceLabel: string;
  billingUrl: string;
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
  const hours = Math.max(1, Math.round(hoursLeft));
  return (
    <Layout
      preview={`Your trial ends in about ${hours} hours`}
    >
      <Text style={s.kicker}>Trial ends in ~{hours} hours</Text>
      <Heading as="h1" style={s.h1}>
        Your trial ends tomorrow.
      </Heading>

      <Text style={s.lead}>
        {firstName}, in roughly{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>{hours} hours</strong>{" "}
        your access to{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>{workspaceName}</strong>{" "}
        drops to read-only until billing is active.
      </Text>

      <Section
        style={{
          margin: "8px 0 22px",
          padding: "16px 20px",
          border: `1px solid ${tokens.line}`,
          borderRadius: "12px",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tokens.muted,
          }}
        >
          Your trial so far
        </Text>
        <Text
          style={{
            margin: "8px 0 0",
            fontSize: "32px",
            lineHeight: "36px",
            fontWeight: 600,
            letterSpacing: "-0.022em",
            color: tokens.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {txnsLogged.toLocaleString("en-NG")}{" "}
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0",
              color: tokens.muted,
            }}
          >
            transactions logged
          </span>
        </Text>
      </Section>

      {txnsLogged > 0 ? (
        <Text style={s.body}>
          The categorisation and reports are yours either way — activating
          just keeps the lights on going forward.
        </Text>
      ) : (
        <Text style={s.body}>
          You haven&apos;t uploaded data yet, but the trial doesn&apos;t
          extend and your workspace is set up. Activate to keep it.
        </Text>
      )}

      <Text style={s.body}>
        You&apos;re on{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>
          {planLabel}
        </strong>{" "}
        at{" "}
        <strong style={{ color: tokens.ink, fontWeight: 600 }}>
          {priceLabel}
        </strong>
        . Cancel any time from Settings.
      </Text>

      <CtaButton href={billingUrl}>Activate {planLabel} →</CtaButton>

      <Text style={{ ...s.smallMuted, marginTop: "28px" }}>
        Want to switch plans or chat first? Reply to this email.
      </Text>
    </Layout>
  );
}

export default TrialEndingEmail;
