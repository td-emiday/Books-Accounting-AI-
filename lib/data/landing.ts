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
  { label: "Product",       href: "#product" },
  { label: "How it works",  href: "#how" },
  { label: "Pricing",       href: "#pricing" },
  { label: "Docs",          href: mail("Docs access — early") },
];

export const HERO_BADGE = {
  tag: "NEW",
  body: "WhatsApp receipts are live — forward, forget, filed.",
};

export const HERO_FOOT =
  "No card required · Cancel anytime · Data stays in Nigeria";

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
    title: "Connect your bank",
    body: "Read-only feeds from GTBank, Zenith, Access, UBA and Paystack. Takes 2 minutes.",
  },
  {
    n: "02",
    title: "Emiday learns your books",
    body: "Ingests 90 days of history, builds your chart of accounts, and proposes categorisation rules.",
  },
  {
    n: "03",
    title: "Daily clean books",
    body: "Every transaction is categorised by 8am. Forward receipts on WhatsApp and they're matched instantly.",
  },
  {
    n: "04",
    title: "File & pay, in-app",
    body: "VAT, PAYE, CIT and pension drafted for you. One click to pay directly to FIRS.",
  },
];

export type Tier = {
  id: string;
  name: string;
  desc: string;
  /** Numeric monthly price in Naira. Formatted at render time. */
  priceNgn: number;
  features: string[];
  cta: string;
  /** href the tier CTA points at — usually /app, but can be a mailto. */
  ctaHref: string;
  tag?: string;
  featured?: boolean;
};

export const PRICING: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "For solo founders & freelancers.",
    priceNgn: 18_000,
    features: [
      "1 bank account, up to 200 txns / mo",
      "VAT, PIT & withholding filings",
      "WhatsApp receipts",
    ],
    cta: "Start free",
    ctaHref: "/app",
  },
  {
    id: "growth",
    name: "Growth",
    desc: "For growing SMEs with payroll.",
    priceNgn: 85_000,
    tag: "Popular",
    featured: true,
    features: [
      "Up to 5 accounts, 2,000 txns / mo",
      "PAYE, Pension, NSITF & CIT",
      "One-click pay from dashboard",
      "CFO chat & live reports",
    ],
    cta: "Start 30-day trial",
    ctaHref: "/app",
  },
  {
    id: "pro",
    name: "Pro",
    desc: "For firms managing clients.",
    priceNgn: 140_000,
    features: [
      "Up to 15 client workspaces",
      "Team seats & role permissions",
      "White-label reports",
      "Priority support",
    ],
    cta: "Talk to us",
    ctaHref: mail("Pro plan — interested"),
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
      { label: "Dashboard",   href: "#product" },
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
  "An AI accountant built in Lagos for Nigerian businesses. Your books, quietly done.";

export const COPYRIGHT = {
  line: "© 2026 Emiday Technologies Ltd · RC 7748210",
  badge: "Made in Lagos",
};
