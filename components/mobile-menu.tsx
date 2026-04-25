"use client";

// Hamburger + slide-down menu for the landing page on phones.
// On desktop the regular pill nav handles everything; this only shows
// when the inline links collapse out (< 820px).

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavLink } from "@/lib/data/landing";

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="lp-burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`bar ${open ? "x1" : ""}`} />
        <span className={`bar ${open ? "x2" : ""}`} />
        <span className={`bar ${open ? "x3" : ""}`} />
      </button>

      {open && (
        <div className="lp-menu-scrim" onClick={() => setOpen(false)}>
          <div
            className="lp-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <ul>
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={() => setOpen(false)}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="div" />
              <li>
                <Link
                  className="login"
                  href="/app"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  className="cta"
                  href="/app"
                  onClick={() => setOpen(false)}
                >
                  Open app →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
