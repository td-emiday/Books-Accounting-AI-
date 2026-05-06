import { Heading, Section, Text } from "@react-email/components";
import { CtaButton, Layout, s } from "./layout";

export type WelcomeProps = {
  firstName: string;
  workspaceName: string;
  appUrl: string;
  telegramBot?: string;
};

export function WelcomeEmail({
  firstName,
  workspaceName,
  appUrl,
  telegramBot,
}: WelcomeProps) {
  const items = [
    {
      title: "Upload a bank statement",
      body: "I'll have a P&L for you in about four minutes.",
    },
    {
      title: "Connect Telegram",
      body: telegramBot
        ? `Snap any receipt to @${telegramBot} — I'll OCR and log it as a draft transaction.`
        : "Snap any receipt to the bot — I'll OCR and log it as a draft transaction.",
    },
    {
      title: "Ask me anything",
      body:
        "“Net this month?” · “Owe VAT?” · “Biggest expense last week?” — answers from your real numbers.",
    },
  ];

  return (
    <Layout
      preview={`Welcome to Emiday, ${firstName} — your 10 days starts now`}
    >
      <Text style={s.kicker}>Welcome · 10 days free</Text>
      <Heading as="h1" style={s.h1}>
        Welcome, {firstName}.
      </Heading>

      <Text style={s.lead}>
        Your workspace <strong style={{ color: "#15151a", fontWeight: 600 }}>{workspaceName}</strong>{" "}
        is live and your 10-day free trial just started. Use everything Emiday
        does, no card needed.
      </Text>

      <Text
        style={{
          margin: "28px 0 14px",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#15151a",
        }}
      >
        What to try first
      </Text>

      {items.map((it, i) => (
        <Section key={it.title} style={s.itemRow}>
          <Text style={s.itemIndex}>{String(i + 1).padStart(2, "0")}</Text>
          <Text style={s.itemTitle}>{it.title}</Text>
          <Text style={s.itemBody}>{it.body}</Text>
        </Section>
      ))}

      <CtaButton href={appUrl}>Open my dashboard →</CtaButton>

      <Text style={{ ...s.smallMuted, marginTop: "28px" }}>
        If anything looks off, hit reply — a real person reads it.
      </Text>
    </Layout>
  );
}

export default WelcomeEmail;
