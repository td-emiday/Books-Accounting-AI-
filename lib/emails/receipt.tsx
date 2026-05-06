import { Hr, Section, Text } from "@react-email/components";
import { Layout, s, tokens } from "./layout";

export type ReceiptProps = {
  firstName: string;
  workspaceName: string;
  amountKobo: number;
  currency: string;
  reference: string;
  paidAt: string;
  planLabel: string;
  cycleLabel: string;
  nextBillingDate?: string | null;
  billingUrl: string;
};

const fmtCurrency = (currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const fmtDate = (iso: string) =>
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
  const amount = amountKobo / 100;
  const amountStr = fmtCurrency(currency).format(amount);

  return (
    <Layout preview={`Receipt — ${amountStr} · Emiday ${planLabel}`}>
      <Text style={s.kicker}>Payment received</Text>

      {/* Hero amount — the moment that matters */}
      <Text
        style={{
          margin: "0 0 6px",
          fontSize: "44px",
          lineHeight: "48px",
          fontWeight: 600,
          letterSpacing: "-0.024em",
          color: tokens.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {amountStr}
      </Text>
      <Text
        style={{
          margin: "0 0 28px",
          fontSize: "14px",
          color: tokens.muted,
        }}
      >
        Thanks, {firstName}. {workspaceName} is on{" "}
        <span style={{ color: tokens.ink, fontWeight: 500 }}>{planLabel}</span>.
      </Text>

      {/* Detail rows — quiet two-column layout, no boxes */}
      <Section
        style={{
          margin: "0 0 24px",
          paddingTop: "20px",
          paddingBottom: "4px",
          borderTop: `1px solid ${tokens.line}`,
        }}
      >
        <ReceiptRow label="Plan" value={`${planLabel} · ${cycleLabel}`} />
        <ReceiptRow label="Date" value={fmtDate(paidAt)} />
        <ReceiptRow label="Reference" value={reference} mono />
        {nextBillingDate ? (
          <ReceiptRow label="Next billing" value={fmtDate(nextBillingDate)} />
        ) : null}
      </Section>

      <Hr
        style={{
          borderTop: `1px solid ${tokens.line}`,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          margin: "0 0 18px",
        }}
      />

      <Text style={{ ...s.smallMuted, color: tokens.ink2 }}>
        Manage, switch plans or cancel any time from{" "}
        <a
          href={billingUrl}
          style={{
            color: tokens.ink,
            fontWeight: 500,
            textDecoration: "underline",
          }}
        >
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
  // Two-column row using table for Outlook reliability — divs with
  // flex don't work in Outlook 2016/2019/365.
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      style={{
        width: "100%",
        margin: "0 0 10px",
        borderCollapse: "collapse",
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              fontSize: "13px",
              color: tokens.muted,
              width: "120px",
              verticalAlign: "top",
              paddingRight: "16px",
            }}
          >
            {label}
          </td>
          <td
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: tokens.ink,
              verticalAlign: "top",
              fontFamily: mono
                ? "ui-monospace, SFMono-Regular, Menlo, monospace"
                : tokens.font,
              fontVariantNumeric: "tabular-nums",
              wordBreak: "break-all",
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default ReceiptEmail;
