// Single source of truth for our origin in server-side redirects and
// outbound URLs. Cookies are scoped to www.emiday.io, so we must
// always redirect users to the www subdomain — never to the apex —
// or their session disappears mid-flow.
//
// Order of preference:
//   1. NEXT_PUBLIC_SITE_URL when set to a non-empty value
//   2. The request origin, normalised to www if it's the apex
//   3. Hard-coded www.emiday.io as the last-resort default

const APEX = "https://emiday.io";
const WWW = "https://www.emiday.io";

export function getSiteOrigin(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env && env.length > 0 && env !== '""') {
    return canonical(env);
  }
  if (req) {
    try {
      return canonical(new URL(req.url).origin);
    } catch {
      /* fall through */
    }
  }
  return WWW;
}

function canonical(origin: string): string {
  const trimmed = origin.replace(/\/$/, "");
  if (trimmed === APEX) return WWW;
  return trimmed;
}
