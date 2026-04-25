import Image from "next/image";
import Link from "next/link";
import { LandingPreview } from "@/components/landing-preview";
import { MobileMenu } from "@/components/mobile-menu";
import {
  COPYRIGHT,
  CUSTOMER_LOGOS,
  FOOTER_COLUMNS,
  FOOTER_TAGLINE,
  HERO_BADGE,
  HERO_FOOT,
  NAV_LINKS,
  PRICING,
  STEPS,
  WHATSAPP_NUMBER,
  formatPrice,
} from "@/lib/data/landing";
import "./landing.css";

const Check = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m5 12 5 5 9-12" />
  </svg>
);

const Arrow = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const Play = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    aria-hidden
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="lp-root">
      <nav className="lp-nav" aria-label="Primary">
        <div className="brand">
          <Image
            src="/assets/emiday-logo.png"
            alt="Emiday"
            width={88}
            height={18}
            priority
          />
        </div>
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
        <Link className="login" href="/app">
          Sign in
        </Link>
        <Link className="cta" href="/app">
          Open app →
        </Link>
        <MobileMenu links={NAV_LINKS} />
      </nav>

      <div className="lp-glow" aria-hidden />

      <main className="lp">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-badge">
            <span className="tag">{HERO_BADGE.tag}</span>
            {HERO_BADGE.body}
          </div>
          <h1>
            Your books, <span>quietly done.</span>
          </h1>
          <p>
            Emiday is an AI accountant for Nigerian SMEs. It reads your bank
            statement, categorises every Naira, prepares your FIRS returns and
            pays them; so you can run the business.
          </p>
          <div className="lp-ctas">
            <Link className="lp-cta-primary" href="/app">
              Start free for 30 days <Arrow />
            </Link>
            <a className="lp-cta-ghost" href="#product">
              <Play /> Watch 90s demo
            </a>
          </div>
          <div className="lp-hero-foot">{HERO_FOOT}</div>

          <LandingPreview />
        </section>

        {/* LOGOS */}
        <section className="lp-logos">
          <p>Trusted by operators at</p>
          <div className="lp-logos-row">
            {CUSTOMER_LOGOS.map((l) => (
              <span key={l.name}>{l.name}</span>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-section">
          <span className="lp-eyebrow">Built for your books</span>
          <h2>
            Everything an accountant does. <span>None of the waiting.</span>
          </h2>
          <p className="lead">
            Bank feeds, categorisation, VAT, PAYE, CIT, reports — Emiday handles
            the whole cycle and hands you clean books every morning.
          </p>

          <div className="lp-features">
            <Feature
              title="Bank feeds, auto-categorised"
              body="Connect GTBank, Zenith, Access and Paystack. Every transaction lands categorised with an explainable confidence score — you just confirm."
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10 12 4l9 6" />
                  <path d="M4 10h16" />
                  <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
                  <path d="M3 20h18" />
                </svg>
              }
              demo={
                <div className="mini-card">
                  <div className="mini-row">
                    <span>Shoprite · POS</span>
                    <span className="mini-cat">
                      <span className="sw" style={{ background: "#8a5a18" }} />
                      COGS
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>Paystack settlement</span>
                    <span className="mini-cat">
                      <span className="sw" style={{ background: "#1f6b3a" }} />
                      Revenue
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>Payroll · 42 staff</span>
                    <span className="mini-cat">
                      <span className="sw" style={{ background: "#2e2c8a" }} />
                      Payroll
                    </span>
                  </div>
                </div>
              }
            />

            <Feature
              title="FIRS-ready filings, drafted for you"
              body="VAT, CIT, PAYE, Pension, WHT — Emiday prepares every return the night before it's due and walks you through the numbers."
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
              demo={
                <div className="mini-card">
                  <div className="mini-row">
                    <span style={{ color: "var(--muted)" }}>VAT · March</span>
                    <span style={{ fontWeight: 600 }}>₦3,241,500</span>
                  </div>
                  <div className="mini-row">
                    <span style={{ color: "var(--muted)" }}>PAYE · April</span>
                    <span style={{ fontWeight: 600 }}>₦1,051,000</span>
                  </div>
                  <div className="mini-row">
                    <span style={{ color: "var(--muted)" }}>CIT · Q2 est.</span>
                    <span style={{ fontWeight: 600 }}>₦2,120,400</span>
                  </div>
                </div>
              }
            />

            <Feature
              title="Pay taxes in one click"
              body="Authorise from any connected account. NIBSS-secured, settled in seconds, receipts filed to your books automatically."
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m13 2-9 12h7l-2 8 9-12h-7z" />
                </svg>
              }
              demo={
                <div
                  className="mini-card"
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: "var(--positive-soft)",
                      color: "var(--positive)",
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5 9-12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      VAT paid · ₦3.24M
                    </div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 10.5,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Ref EMD-418304 · 0.8s
                    </div>
                  </div>
                </div>
              }
            />

            <Feature
              title="Live reports, not month-end"
              body="P&L, Balance Sheet and Cashflow regenerate as your books update. Export to PDF or share with your external accountant."
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 20h16" />
                  <path d="M6 16V9" />
                  <path d="M11 16V5" />
                  <path d="M16 16v-8" />
                  <path d="M21 16V11" />
                </svg>
              }
              demo={
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 50,
                  }}
                >
                  {[40, 65, 45, 80, 55, 90, 70, 100].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        background:
                          i === 7 ? "var(--accent)" : "var(--ink)",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  ))}
                </div>
              }
            />

            <Feature
              title="A CFO in your pocket"
              body={`Ask "what's my runway?" or "why did expenses spike?" — and get a numbers-first answer, not a chatbot paragraph.`}
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 5h16v11H9l-5 4z" />
                </svg>
              }
              demo={
                <div
                  className="mini-card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      background: "#fff",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    You ·{" "}
                    <span style={{ color: "var(--ink)" }}>
                      How much runway do we have?
                    </span>
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: 11 }}>
                    <div style={{ marginBottom: 4 }}>
                      14.2 months at current burn. Payroll is 63% of opex.
                    </div>
                  </div>
                </div>
              }
            />

            <Feature
              title="Made for accountants too"
              body="Manage multiple client books from one workspace. Emiday does the heavy lifting; you review, advise and bill for the hours you got back."
              icon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={9} cy={8} r={3} />
                  <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
                  <circle cx={17} cy={9} r={2.5} />
                  <path d="M15 20c0-2.5 2-4 4-4s3 1 3 3" />
                </svg>
              }
              demo={
                <div className="mini-card">
                  <div className="mini-row">
                    <span>Kadara Foods Ltd</span>
                    <span
                      style={{
                        color: "var(--positive)",
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      98% reconciled
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>Flux Labs</span>
                    <span
                      style={{
                        color: "var(--positive)",
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      100%
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>Orin &amp; Co</span>
                    <span
                      style={{
                        color: "var(--warn)",
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      2 to review
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section" id="how" style={{ paddingTop: 0 }}>
          <span className="lp-eyebrow">How it works</span>
          <h2>
            From bank feed to filed, <span>in four quiet steps.</span>
          </h2>

          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHATSAPP + CFO TWO-UP */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-twoup">
            <div className="lp-panel">
              <span className="lp-eyebrow">WhatsApp-first</span>
              <h3>Snap a receipt. It&apos;s booked before you lock your phone.</h3>
              <p className="lead">
                Forward any receipt, invoice or question to{" "}
                <b
                  style={{
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {WHATSAPP_NUMBER}
                </b>
                . Emiday reads it, matches it to a transaction, and files it.
              </p>
              <div className="lp-panel-art">
                <div className="mini-wa" style={{ width: 280 }}>
                  <div className="b me">📸 Receipt_Terra_Kulture.jpg</div>
                  <div className="b">
                    Got it — ₦18,400 at Terra Kulture. Filed under Travel &amp;
                    entertainment. OK?
                  </div>
                  <div className="b me">👍</div>
                  <div className="b">
                    Done. Your CIT estimate is now ₦2.10M.
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-panel dark">
              <span className="lp-eyebrow">Ask anything</span>
              <h3>The CFO who remembers every line item.</h3>
              <p className="lead">
                Ask in plain English. Emiday answers with your actual numbers,
                the source transactions, and what to do next.
              </p>
              <div
                className="lp-panel-art"
                style={{ width: "100%", maxWidth: 340 }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                    }}
                  >
                    You
                  </div>
                  <div style={{ fontSize: 13.5, marginBottom: 14 }}>
                    Can we afford two new hires this month?
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                    }}
                  >
                    Emiday
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                    Yes — at ₦420k/mo blended, two hires add ₦840k to payroll.
                    Runway dips from 14.2 to 12.8 months, still above your
                    9-month floor.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="lp-section" id="pricing" style={{ paddingTop: 0 }}>
          <span className="lp-eyebrow">Pricing</span>
          <h2>
            One flat fee. <span>No per-transaction surprises.</span>
          </h2>
          <p className="lead">
            All tiers include bank feeds, filings, payments and WhatsApp. Cancel
            anytime.
          </p>

          <div className="lp-pricing">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`lp-tier${tier.featured ? " featured" : ""}`}
              >
                <div className="lp-tier-head">
                  <div>
                    <div className="lp-tier-name">{tier.name}</div>
                    <div className="lp-tier-desc" style={{ marginTop: 6 }}>
                      {tier.desc}
                    </div>
                  </div>
                  {tier.tag && <span className="lp-tier-tag">{tier.tag}</span>}
                </div>
                <div className="lp-tier-price">
                  {formatPrice(tier.priceNgn)}
                  <span>/month</span>
                </div>
                <ul>
                  {tier.features.map((f) => (
                    <li key={f}>
                      <Check />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link className="lp-tier-cta" href={tier.ctaHref}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* BIG CTA */}
        <section className="lp-bigcta">
          <h2>
            Start tonight. <span>Wake up to clean books.</span>
          </h2>
          <p>
            Connect your first bank in 2 minutes. We&apos;ll have April
            categorised by morning.
          </p>
          <div className="lp-ctas">
            <Link className="lp-cta-primary" href="/app">
              Open the app
            </Link>
            <a className="lp-cta-ghost" href="#pricing">
              See pricing
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <Image
              src="/assets/emiday-logo.png"
              alt="Emiday"
              width={108}
              height={22}
            />
            <p>{FOOTER_TAGLINE}</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h5>{col.title}</h5>
              <ul>
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </footer>
        <div className="lp-copy">
          <span>{COPYRIGHT.line}</span>
          <span>{COPYRIGHT.badge}</span>
        </div>
      </main>
    </div>
  );
}

function Feature({
  title,
  body,
  icon,
  demo,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  demo: React.ReactNode;
}) {
  return (
    <div className="lp-feat">
      <div className="lp-feat-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="lp-feat-demo">{demo}</div>
    </div>
  );
}

