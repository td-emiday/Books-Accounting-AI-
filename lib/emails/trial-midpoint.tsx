import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout } from "./layout";

export type TrialMidpointProps = {
  firstName: string;
  workspaceName: string;
  daysLeft: number;
  txnsLogged: number;        // total transactions this trial
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

  return (
    <Layout
      preview={
        hasData
          ? `Halfway through your trial — here's what's working`
          : `${daysLeft} days left in your trial`
      }
    >
      <Heading className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.015em] text-ink">
        {hasData
          ? `Halfway there, ${firstName}.`
          : `${daysLeft} days left, ${firstName}.`}
      </Heading>

      {hasData ? (
        <>
          <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
            Quick check-in on <strong>{workspaceName}</strong> — you&apos;ve
            logged <strong>{txnsLogged}</strong> transaction
            {txnsLogged === 1 ? "" : "s"} so far this trial.
          </Text>

          {topCategory && topCategoryAmount ? (
            <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
              Your biggest expense category is{" "}
              <strong>{topCategory}</strong> at{" "}
              <strong>{ngn(topCategoryAmount)}</strong>. That&apos;s the
              kind of insight you&apos;d normally pay an accountant a
              week to surface.
            </Text>
          ) : null}

          <Text className="m-0 mb-6 text-[15px] leading-[1.55] text-ink">
            Five days left. If you haven&apos;t tried asking me a
            question yet, give it a go: &quot;what&apos;s my net so
            far?&quot; or &quot;biggest expense this week?&quot; — in
            the chat panel or on Telegram.
          </Text>
        </>
      ) : (
        <>
          <Text className="m-0 mb-4 text-[15px] leading-[1.55] text-ink">
            Your workspace <strong>{workspaceName}</strong> hasn&apos;t
            seen a transaction yet — and that&apos;s where Emiday earns
            its keep.
          </Text>
          <Text className="m-0 mb-6 text-[15px] leading-[1.55] text-ink">
            One bank statement is enough to unlock everything: live P&amp;L,
            VAT drafts, monthly reports, plain-English answers. Drop one
            in and I&apos;ll have your books mapped in about 4 minutes.
          </Text>
        </>
      )}

      <Section className="mb-2">
        <CtaButton href={appUrl}>
          {hasData ? "See your numbers" : "Upload a statement"} →
        </CtaButton>
      </Section>
    </Layout>
  );
}

export default TrialMidpointEmail;
