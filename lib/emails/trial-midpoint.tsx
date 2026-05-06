import { Heading, Text } from "@react-email/components";
import { CtaButton, Layout, s, tokens } from "./layout";

export type TrialMidpointProps = {
  firstName: string;
  workspaceName: string;
  daysLeft: number;
  txnsLogged: number;
  topCategory?: string | null;
  topCategoryAmount?: number | null;
  appUrl: string;
};

const ngn = (n: number) =>
  `₦${Math.round(n).toLocaleString("en-NG")}`;

export function TrialMidpointEmail({
  firstName,
  workspaceName,
  daysLeft,
  txnsLogged,
  topCategory,
  topCategoryAmount,
  appUrl,
}: TrialMidpointProps) {
  const hasData = txnsLogged > 0;
  const dayLabel = `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;

  return (
    <Layout
      preview={
        hasData
          ? `Halfway through your trial — here's what's working`
          : `${daysLeft} days left in your trial`
      }
    >
      <Text style={s.kicker}>Trial · {dayLabel}</Text>
      <Heading as="h1" style={s.h1}>
        {hasData
          ? `Halfway there, ${firstName}.`
          : `${daysLeft} days left, ${firstName}.`}
      </Heading>

      {hasData ? (
        <>
          <Text style={s.lead}>
            Quick check-in on{" "}
            <strong style={{ color: tokens.ink, fontWeight: 600 }}>
              {workspaceName}
            </strong>
            . You&apos;ve logged{" "}
            <strong style={{ color: tokens.ink, fontWeight: 600 }}>
              {txnsLogged}
            </strong>{" "}
            transaction{txnsLogged === 1 ? "" : "s"} on this trial.
          </Text>

          {topCategory && topCategoryAmount ? (
            <Text style={s.body}>
              Your biggest expense category is{" "}
              <strong style={{ color: tokens.ink, fontWeight: 600 }}>
                {topCategory}
              </strong>{" "}
              at{" "}
              <strong style={{ color: tokens.ink, fontWeight: 600 }}>
                {ngn(topCategoryAmount)}
              </strong>
              .
            </Text>
          ) : null}

          <Text style={s.body}>
            Five days left. Try asking me a question if you haven&apos;t —{" "}
            &ldquo;what&apos;s my net so far?&rdquo; or &ldquo;biggest expense
            this week?&rdquo; — in the chat panel or on Telegram.
          </Text>
        </>
      ) : (
        <>
          <Text style={s.lead}>
            Your workspace{" "}
            <strong style={{ color: tokens.ink, fontWeight: 600 }}>
              {workspaceName}
            </strong>{" "}
            hasn&apos;t seen a transaction yet — and that&apos;s where Emiday
            earns its keep.
          </Text>
          <Text style={s.body}>
            One bank statement is enough to unlock everything: live P&amp;L,
            VAT drafts, monthly reports, plain-English answers. Drop one in
            and I&apos;ll have your books mapped in about four minutes.
          </Text>
        </>
      )}

      <CtaButton href={appUrl}>
        {hasData ? "See your numbers" : "Upload a statement"} →
      </CtaButton>
    </Layout>
  );
}

export default TrialMidpointEmail;
