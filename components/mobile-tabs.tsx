"use client";

// iOS-style bottom tab bar — only renders on mobile (CSS hides on >= 768px).
// Five primary tabs + a "More" sheet for everything else, mirroring how
// UIKit apps split UITabBarController + a More navigation controller.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icon";
import { isActive } from "@/lib/routes";

type Tab = { href: string; label: string; icon: IconName; badge?: string };

const PRIMARY: Tab[] = [
  { href: "/app",         label: "Home",    icon: "home" },
  { href: "/app/bank",    label: "Bank",    icon: "bank",   badge: "12" },
  { href: "/app/tax",     label: "Tax",     icon: "shield", badge: "3" },
  { href: "/app/reports", label: "Reports", icon: "chart" },
];

const MORE: Tab[] = [
  { href: "/app/invoices",  label: "Invoices",  icon: "receipt" },
  { href: "/app/documents", label: "Documents", icon: "file" },
  { href: "/app/clients",   label: "Clients",   icon: "users" },
  { href: "/app/settings",  label: "Settings",  icon: "settings" },
];

export function MobileTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((t) => isActive(pathname, t.href));

  return (
    <>
      <nav className="mob-tabs" aria-label="Primary">
        {PRIMARY.map((t) => {
          const on = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`mob-tab${on ? " on" : ""}`}
              aria-current={on ? "page" : undefined}
            >
              <span className="mob-tab-ic">
                <Icon name={t.icon} size={22} />
                {t.badge && <span className="mob-tab-badge">{t.badge}</span>}
              </span>
              <span className="mob-tab-l">{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`mob-tab${moreActive ? " on" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="mob-tab-ic">
            <Icon name="dots" size={22} />
          </span>
          <span className="mob-tab-l">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="mob-sheet-scrim"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="mob-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mob-sheet-grab" aria-hidden />
            <h3>More</h3>
            <ul>
              {MORE.map((t) => {
                const on = isActive(pathname, t.href);
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      onClick={() => setMoreOpen(false)}
                      className={on ? "on" : undefined}
                    >
                      <Icon name={t.icon} size={18} />
                      <span>{t.label}</span>
                      <Icon name="chev" size={16} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
