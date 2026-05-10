// Landing-style footer + copyright row, reused on /blog and any
// other marketing surface. Same structure as the original footer
// inside app/page.tsx — extracted here so we don't fork copy.

import Image from "next/image";
import {
  COPYRIGHT,
  FOOTER_COLUMNS,
  FOOTER_TAGLINE,
} from "@/lib/data/landing";

export function Footer() {
  return (
    <>
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
    </>
  );
}
