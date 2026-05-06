// Shared shell. Restraint over decoration: a single white card on a
// warm paper page, one kicker per email as the only purple moment,
// hairline rule, two-line footer. Inline styles for everything that
// needs to render identically in Outlook / Gmail / Apple Mail —
// Tailwind only handles layout where inline isn't enough.

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export const tokens = {
  ink: "#15151a",
  ink2: "#3f3f47",
  muted: "#8b8b93",
  line: "#e8e6df",
  surface: "#ffffff",
  paper: "#f7f5f0",
  accent: "#2e2c8a",
  accentSoft: "#eceaff",
  font:
    "Inter, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

export type LayoutProps = {
  preview: string;
  children: ReactNode;
};

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          style={{
            margin: 0,
            padding: 0,
            backgroundColor: tokens.paper,
            fontFamily: tokens.font,
            color: tokens.ink,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          <Container
            style={{
              margin: "0 auto",
              padding: "40px 16px",
              maxWidth: "600px",
            }}
          >
            <Container
              style={{
                margin: 0,
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.line}`,
                borderRadius: "16px",
                padding: "44px 40px 36px",
              }}
            >
              {/* Wordmark — flat, lowercase, intentional */}
              <Text
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: tokens.ink,
                }}
              >
                emiday
              </Text>

              <div style={{ height: "32px" }} />

              {children}

              <Hr
                style={{
                  borderTop: `1px solid ${tokens.line}`,
                  borderBottom: 0,
                  borderLeft: 0,
                  borderRight: 0,
                  margin: "40px 0 18px",
                }}
              />

              <Text style={s.footer}>
                Emiday · Lagos.{" "}
                <span style={{ color: tokens.muted }}>
                  Reply to this email to talk to a human.
                </span>
              </Text>
            </Container>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// ─── Shared typography building blocks ─────────────────────────────

export const s: Record<string, CSSProperties> = {
  kicker: {
    margin: "0 0 14px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.accent,
  },
  h1: {
    margin: "0 0 20px",
    fontSize: "26px",
    lineHeight: "32px",
    fontWeight: 600,
    letterSpacing: "-0.018em",
    color: tokens.ink,
  },
  lead: {
    margin: "0 0 18px",
    fontSize: "16px",
    lineHeight: "26px",
    color: tokens.ink2,
  },
  body: {
    margin: "0 0 14px",
    fontSize: "15px",
    lineHeight: "24px",
    color: tokens.ink2,
  },
  bodyTight: {
    margin: "0 0 6px",
    fontSize: "15px",
    lineHeight: "24px",
    color: tokens.ink2,
  },
  smallMuted: {
    margin: "0",
    fontSize: "13px",
    lineHeight: "20px",
    color: tokens.muted,
  },
  footer: {
    margin: "0",
    fontSize: "12px",
    lineHeight: "18px",
    color: tokens.ink2,
  },
  // Numbered list item — used in the welcome "what to try first" list.
  // Two columns: a small uppercase index, then content. No bullets.
  itemRow: {
    margin: "0 0 18px",
  },
  itemIndex: {
    margin: "0 0 4px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: tokens.muted,
    textTransform: "uppercase",
  },
  itemTitle: {
    margin: "0 0 2px",
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "-0.005em",
    color: tokens.ink,
  },
  itemBody: {
    margin: "0",
    fontSize: "14px",
    lineHeight: "22px",
    color: tokens.ink2,
  },
};

// Minimal CTA — solid ink, pill, scale-on-active not possible in
// email clients so we keep it visually crisp at rest. Used sparingly.
export function CtaButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ margin: "28px 0 0" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: tokens.ink,
          color: "#ffffff",
          textDecoration: "none",
          padding: "13px 22px",
          borderRadius: "999px",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "-0.005em",
          fontFamily: tokens.font,
        }}
      >
        {children}
      </a>
    </Section>
  );
}

// Stat block — used by trial-ending + payment-failed to anchor the
// most important number/fact. Hairline border, no shadow, no fill.
export function StatBlock({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Section
      style={{
        margin: "8px 0 24px",
        padding: "18px 20px",
        border: `1px solid ${tokens.line}`,
        borderRadius: "12px",
      }}
    >
      <Text style={s.kicker}>{label}</Text>
      <Text
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: "28px",
          fontWeight: 600,
          letterSpacing: "-0.012em",
          color: tokens.ink,
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text style={{ ...s.smallMuted, marginTop: "6px" }}>{helper}</Text>
      ) : null}
    </Section>
  );
}
