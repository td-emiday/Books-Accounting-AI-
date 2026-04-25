# Emiday (Final)

A consolidated record of the work completed on the Emiday AI Accountant dashboard
(`emiday-next`, Next.js 16.2.4 / React 19.2.4 / TypeScript). This document captures
the mobile design pass, the bug fixes that landed along the way, and the file-level
changes that make up the final state.

---

## 1. Scope

Deliver a polished iPhone-style mobile rendering of the existing desktop design
across all primary routes:

| # | Route | Path |
|---|-------|------|
| 1 | Landing | `/` |
| 2 | Dashboard | `/app` |
| 3 | Bank | `/app/bank` |
| 4 | Tax | `/app/tax` |
| 5 | Invoices | `/app/invoices` |
| 6 | Documents | `/app/documents` |
| 7 | Clients | `/app/clients` |
| 8 | Reports | `/app/reports` |
| 9 | Settings | `/app/settings` |

Target device: iPhone 14 Pro (390×844 CSS px, DPR 2, mobile UA).

---

## 2. Final state

- Horizontal overflow eliminated on every route (body capped at 390px,
  `.main` has `overflow-x: hidden`, long headlines wrap via
  `overflow-wrap: anywhere`).
- Desktop sidebar hidden on mobile, replaced by a bottom tab bar
  (Home / Bank / Tax / Reports / More) with safe-area padding for the
  iPhone home indicator.
- Chat FAB is a compact 48×48 right-anchored circle with pulse-only
  dot, sitting above the tab bar.
- Settings page collapses to a single column on mobile via a new
  `.settings-shell` class; the section nav row scrolls horizontally
  rather than wrapping.
- Bento sparklines render correctly (the earlier `height: auto`
  regression that squished them into vertical spikes was reverted).
- Filter pill rows on Invoices/Clients scroll horizontally without
  breaking page layout.
- `viewport-fit=cover` + `env(safe-area-inset-*)` honored across
  top and bottom of the dashboard chrome.

The black "N" circle that occasionally appears above the tab bar in
dev screenshots is the `NEXTJS-PORTAL` dev-mode indicator — it does
not appear in production builds.

---

## 3. File-level changes

### `.claude/launch.json`
Updated dev port from 3000 to 3004 to match the running dev server.

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "emiday",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3004
    }
  ]
}
```

### `app/globals.css`
Mobile rules added inside `@media (max-width: 768px)`:

```css
html, body {
  overscroll-behavior-y: none;
  overflow-x: hidden;
  max-width: 100vw;
}
.app {
  grid-template-columns: 1fr;
  min-height: 100dvh;
  overflow-x: hidden;
}
.sidebar { display: none !important; }
.main {
  padding: calc(64px + env(safe-area-inset-top, 0px)) 16px
           calc(96px + env(safe-area-inset-bottom, 0px));
  max-width: 100%;
  overflow-x: hidden;
  min-width: 0;
}
.main > * { min-width: 0; }
.hero { min-width: 0; }
.hero h1, .hero .sub {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.card svg, .bento .card svg { max-width: 100%; }
.card { min-width: 0; overflow: hidden; }
```

Compact chat FAB (right-anchored, icon-only):

```css
.chat-fab {
  left: auto;
  right: 16px;
  width: auto;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  align-items: flex-end;
}
.chat-bubble { font-size: 0; }
.chat-bubble .pulse { width: 10px; height: 10px; margin: 0; }
```

Settings shell base + mobile override:

```css
.settings-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .settings-shell {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

Horizontally scrollable filter rows on Invoices/Clients:

```css
.seg:not(.pill .seg) {
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: none;
  max-width: 100%;
  min-width: 0;
}
.seg:not(.pill .seg)::-webkit-scrollbar { display: none; }
.seg:not(.pill .seg) > * { flex-shrink: 0; }
```

### `app/landing.css`
Mobile rules added inside `@media (max-width: 720px)`:

```css
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
.lp { padding: 0 18px; min-width: 0; }
.lp-hero, .lp-section, .lp-footer { min-width: 0; }
.lp-hero h1 {
  overflow-wrap: anywhere;
  word-break: break-word;
}
```

### `components/settings.tsx`
Replaced an inline-style grid with a class so the media-query override
can apply:

```diff
- <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "flex-start" }}>
+ <div className="settings-shell">
```

---

## 4. Tooling (scratch)

`/tmp/ppshot/shoot.js` — puppeteer script that screenshots all 9 routes
at iPhone 14 Pro emulation. Key bits:

```js
await page.setViewport({
  width: 390, height: 844,
  deviceScaleFactor: 2,
  isMobile: true, hasTouch: true,
});
await page.setUserAgent(
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
);
```

Screenshots land in `/tmp/emiday-mobile/<route>.png`.

`/tmp/ppshot/probe.js` — DOM probe used to verify layout
(`document.elementFromPoint`, computed widths, sidebar visibility,
chat-fab position).

---

## 5. Bugs encountered and fixed

| Bug | Root cause | Fix |
|---|---|---|
| `localhost:3004` returning HTTP 500 | Stale `.next/dev` cache referencing pre-refactor errors | `kill <pid>; rm -rf .next; PORT=3004 npm run dev` |
| Headless Chrome wrong CSS viewport | `--window-size` + `--force-device-scale-factor` don't set CSS viewport in `--headless=new` | Switched to puppeteer with `setViewport({ isMobile: true })` |
| Turbopack HMR not picking up CSS edits | Stale chunk cache | Full server restart with `.next` deletion |
| Bento sparklines squished into vertical spikes | `height: auto` overrode explicit `height={44}` on SVGs using `preserveAspectRatio="none"` | Removed `height: auto`; kept only `max-width: 100%` |
| "N" black circle at bottom-left | `NEXTJS-PORTAL` dev indicator (not workspace avatar) | No fix needed — absent in production |
| Settings page broken (nav next to content on mobile) | Inline `style` couldn't be overridden by media query | Refactored to `className="settings-shell"` |
| Chat FAB stacking "Ask / your / CFO" across 3 lines | 48×48 bubble couldn't fit text | `.chat-bubble { font-size: 0 }`; pulse-only dot visible |

---

## 6. Notes for future work

- Per `AGENTS.md`: this Next.js install has breaking changes vs. the
  publicly known APIs. Always consult `node_modules/next/dist/docs/`
  before making framework-level changes.
- The mobile CSS lives entirely in `globals.css` and `landing.css`
  inside their respective media queries — no per-component mobile
  styling required for the routes covered here.
- If new dashboard pages are added, give their root container
  `min-width: 0` and any embedded SVG `max-width: 100%` to keep
  the overflow guarantees intact.
