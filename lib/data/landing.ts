// Landing-page copy + link map.
//
// Pulled out of `app/page.tsx` so pricing, footer nav and customer logos
// can be edited without touching JSX. Anything dead-link gets a real
// target (internal route, mailto:, or wa.me) — no `#` stubs.
//
// Update marketing copy here; the page is just a renderer.

export const CONTACT_EMAIL = "hello@emiday.io";
export const WHATSAPP_NUMBER = "+234 700 EMIDAY"; // display
export const WHATSAPP_URL = "https://wa.me/2347003634329"; // click target

/** mailto: helper that prefills a subject. */
export const mail = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export type NavLink = { label: string; href: string; external?: boolean };

export const NAV_LINKS: NavLink[] = [
  { label: "Product",       href: "#how" },
  { label: "How it works",  href: "#how" },
  { label: "Pricing",       href: "#pricing" },
];

export const HERO_FOOT =
  "Setup in 2 minutes · Cancel anytime · Data in Nigeria";

export type Logo = { name: string };

export const CUSTOMER_LOGOS: Logo[] = [
  { name: "Kadara Foods" },
  { name: "Orin & Co" },
  { name: "Flux Labs" },
  { name: "Amaiya" },
  { name: "Sote Logistics" },
  { name: "Nkem Textiles" },
];

export type Step = { n: string; title: string; body: string };

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Tell me about the business",
    body: "Two-minute setup. Industry, jurisdiction, primary bank.",
  },
  {
    n: "02",
    title: "I learn your books",
    body: "I read 90 days of history and start categorising.",
  },
  {
    n: "03",
    title: "Clean books by 8am",
    body: "Every transaction sorted overnight. Receipts match on the spot.",
  },
  {
    n: "04",
    title: "Filings, ready to pay",
    body: "VAT, PAYE, CIT drafted before they're due. One-click FIRS.",
  },
];

/** Feature line. Plain string renders as-is; object form lets us flag
 *  roadmap items with a small inline pill (e.g. "soon"). */
export type TierFeature = string | { label: string; tag?: "soon" };

export type Tier = {
  id: string;
  name: string;
  desc: string;
  /** Numeric monthly price in Naira. Formatted at render time. */
  priceNgn: number;
  /**
   * Optional override for tiers whose price isn't a fixed monthly number
   * (e.g. "Custom"). When set, takes precedence over priceNgn and the
   * "/month" suffix is suppressed.
   */
  priceLabel?: string;
  features: TierFeature[];
  cta: string;
  /** href the tier CTA points at — usually /app, but can be a mailto. */
  ctaHref: string;
  tag?: string;
  featured?: boolean;
};

export const PRICING: Tier[] = [
  {
    id: "growth",
    name: "Growth",
    desc: "For SMEs running their own books.",
    priceNgn: 85_000,
    features: [
      "1 business · 5 bank/wallet accounts",
      "2,000 transactions / month",
      "2 seats (founder + accountant)",
      { label: "WhatsApp receipts", tag: "soon" },
      "VAT, PAYE, Pension, NSITF, CIT",
      "One-click FIRS pay",
      "Every report: P&L, BS, Cashflow, VAT, Payroll",
      "CFO chat in plain English (web + Telegram)",
      "Email support",
    ],
    cta: "Get started",
    ctaHref: "/sign-up?plan=growth",
  },
  {
    id: "pro",
    name: "Pro",
    desc: "For SMEs with a finance team.",
    priceNgn: 150_000,
    tag: "Popular",
    featured: true,
    features: [
      "Everything in Growth, plus:",
      "Unlimited bank accounts",
      "10,000 transactions / month",
      "Unlimited seats with roles",
      "White-label PDF reports",
      "Audit log + change history",
      "Priority support · 24h response",
    ],
    cta: "Get started",
    ctaHref: "/sign-up?plan=pro",
  },
  {
    id: "custom",
    name: "Custom",
    desc: "Firms, multi-entity, enterprise.",
    priceNgn: 0,
    priceLabel: "Custom",
    features: [
      "Everything in Pro, plus:",
      "Unlimited client workspaces",
      "Multi-entity consolidation",
      "Bespoke integrations (ERP, payroll)",
      "SSO + advanced audit",
      "Dedicated success manager + SLA",
      "Migration from QuickBooks / Sage",
    ],
    cta: "Request a quote",
    ctaHref: mail("Custom plan — request"),
  },
];

/** Format ₦85,000 → "₦85,000". */
export function formatPrice(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export type FooterColumn = {
  title: string;
  items: Array<{ label: string; href: string; external?: boolean }>;
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Dashboard",   href: "#how" },
      { label: "WhatsApp",    href: WHATSAPP_URL, external: true },
      { label: "Tax filing",  href: "/app/tax" },
      { label: "Reports",     href: "/app/reports" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About",     href: mail("About Emiday") },
      { label: "Careers",   href: mail("Careers at Emiday") },
      { label: "Security",  href: mail("Security & data handling") },
      { label: "Contact",   href: mail("Hello") },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms",            href: mail("Terms request") },
      { label: "Privacy",          href: mail("Privacy policy") },
      { label: "NDPR compliance",  href: mail("NDPR compliance") },
    ],
  },
];

export const FOOTER_TAGLINE =
  "The AI accountant for Nigerian SMEs. Built in Lagos.";

export const COPYRIGHT = {
  line: "© 2026 Emiday Technologies Ltd · RC 7748210",
  badge: "Made in Lagos",
};
