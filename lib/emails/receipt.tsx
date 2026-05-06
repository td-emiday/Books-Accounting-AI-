import { Heading, Hr, Row, Section, Text } from "@react-email/components";
import { Layout } from "./layout";

export type ReceiptProps = {
  firstName: string;
  workspaceName: string;
  amountKobo: number;
  currency: string;          // ISO, e.g. "NGN"
  reference: string;
  paidAt: string;            // ISO
  planLabel: string;         // "Growth" | "Pro"
  cycleLabel: string;        // "Monthly" | "Annual"
  nextBillingDate?: string | null;  // ISO
  billingUrl: string;
};

const fmt = (currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function ReceiptEmail({
  firstName,
  workspaceName,
  amountKobo,
  currency,
  reference,
  paidAt,
  planLabel,
  cycleLabel,
  nextBillingDate,
  billingUrl,
}: ReceiptProps) {
  const amount = (amountKobo / 100);
  return (
    <Layout
      preview={`Receipt — ${fmt(currency).format(amount)} · Emiday ${planLabel}`}
    >
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.015em] text-ink">
        Payment received.
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
        Thanks, {firstName}. Your <strong>{workspaceName}</strong>{" "}
        workspace is on <strong>{planLabel}</strong> · {cycleLabel.toLowerCase()}.
      </Text>

      <Section className="my-6 border border-line rounded-[10px] px-5 py-4">
        <Row>
          <Text className="m-0 text-[12px] uppercase tracking-[0.06em] text-muted">
            Receipt
          </Text>
        </Row>
        <Row>
          <Text className="m-0 mt-2 text-[28px] font-semibold tracking-[-0.02em] text-ink">
            {fmt(currency).format(amount)}
          </Text>
        </Row>
        <Hr className="border-line my-3" />
        <ReceiptRow label="Plan" value={`${planLabel} · ${cycleLabel}`} />
        <ReceiptRow label="Date" value={date(paidAt)} />
        <ReceiptRow label="Reference" value={reference} mono />
        {nextBillingDate ? (
          <ReceiptRow label="Next billing" value={date(nextBillingDate)} />
        ) : null}
      </Section>

      <Text className="m-0 mb-2 text-[14px] leading-[1.55] text-ink2">
        Manage your subscription, switch plans, or cancel anytime from{" "}
        <a href={billingUrl} className="text-ink underline">
          Settings → Billing
        </a>
        .
      </Text>
    </Layout>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Row className="mt-2">
      <Text
        className="m-0 text-[13px] text-muted"
        style={{ width: "120px", display: "inline-block" }}
      >
        {label}
      </Text>
      <Text
        className="m-0 text-[13px] text-ink"
        style={{
          display: "inline-block",
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : undefined,
          fontWeight: 500,
        }}
      >
        {value}
      </Text>
    </Row>
  );
}

export default ReceiptEmail;
