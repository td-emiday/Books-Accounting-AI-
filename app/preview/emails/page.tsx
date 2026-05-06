import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TEMPLATES = [
  { key: "welcome", label: "Welcome" },
  { key: "trial_midpoint", label: "Trial midpoint (5 days, has data)" },
  { key: "trial_midpoint_empty", label: "Trial midpoint (no data)" },
  { key: "trial_ending", label: "Trial ending (~23h)" },
  { key: "receipt", label: "Payment receipt" },
  { key: "payment_failed", label: "Payment failed" },
];

export default async function EmailPreviewIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/preview/emails");

  return (
    <main
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#15151a",
        padding: "60px 32px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#2e2c8a",
        }}
      >
        Internal · email previews
      </p>
      <h1
        style={{
          margin: "0 0 24px",
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        Transactional emails
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: 15,
          lineHeight: 1.6,
          color: "#3f3f47",
        }}
      >
        Each link below opens that template rendered with sample data.
        Use a desktop browser at 600-1000px width to see how the email
        looks in a typical inbox.
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          borderTop: "1px solid #e8e6df",
        }}
      >
        {TEMPLATES.map((t) => (
          <li
            key={t.key}
            style={{ borderBottom: "1px solid #e8e6df" }}
          >
            <a
              href={`/preview/emails/${t.key}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "16px 0",
                textDecoration: "none",
                color: "#15151a",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {t.label}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: "#8b8b93",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                /preview/emails/{t.key}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
