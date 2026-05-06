// Shared shell for every transactional email Emiday sends.
// Restrained palette (matches the in-app brand): warm off-white
// surface, deep ink text, subtle purple accent. Inter for body, no
// fancy serif here — email clients handle web fonts unevenly so we
// stick with system stacks.

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
import type { ReactNode } from "react";

export type LayoutProps = {
  preview: string;       // shown in inbox preview pane
  children: ReactNode;
};

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                ink: "#15151a",
                ink2: "#5a5a66",
                muted: "#6b6b72",
                line: "#e8e6df",
                surface: "#ffffff",
                paper: "#fafaf6",
                accent: "#2e2c8a",
                accentSoft: "#eceaff",
              },
              fontFamily: {
                sans: [
                  "Inter",
                  "-apple-system",
                  "BlinkMacSystemFont",
                  "Helvetica Neue",
                  "sans-serif",
                ],
              },
            },
          },
        }}
      >
        <Body className="bg-paper font-sans text-ink m-0 p-0">
          <Container className="mx-auto my-0 max-w-[560px] bg-surface border border-line rounded-xl px-8 py-10">
            {/* Wordmark */}
            <Section className="mb-8">
              <Text className="m-0 text-[15px] font-semibold tracking-tight text-ink">
                emiday
              </Text>
            </Section>

            {children}

            <Hr className="border-line my-8" />

            <Section>
              <Text className="m-0 text-[12px] leading-[1.5] text-muted">
                Emiday — your AI accountant.
                <br />
                Built in Lagos · Replies to this email reach support.
              </Text>
              <Text className="m-0 mt-3 text-[11px] text-muted">
                You&apos;re receiving this because you have an active
                Emiday workspace.{" "}
                <a
                  href="https://www.emiday.io/app/settings?tab=profile"
                  className="text-muted underline"
                >
                  Email preferences
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Reusable button — used in welcome / dunning / trial-ending CTAs.
export function CtaButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: "#15151a",
        color: "#ffffff",
        textDecoration: "none",
        padding: "12px 22px",
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </a>
  );
}
