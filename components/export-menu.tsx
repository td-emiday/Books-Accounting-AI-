"use client";

// Export menu — dropdown launcher attached to the overview hero.
// Each option opens the corresponding /reports/<shape> route in a new
// tab so the user can review and print the document.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./icon";

type Item = {
  shape: string;
  title: string;
  hint: string;
};

const ITEMS: Item[] = [
  { shape: "monthend", title: "Month-end pack",       hint: "Everything bundled · P&L + BS + CF + VAT" },
  { shape: "pl",       title: "Profit & Loss",        hint: "Revenue, costs, net profit for the period" },
  { shape: "bs",       title: "Balance Sheet",        hint: "Assets, liabilities, equity snapshot" },
  { shape: "cf",       title: "Cashflow Statement",   hint: "Operating, investing, financing flows" },
  { shape: "vat",      title: "VAT Return",           hint: "Output, input, net due to FIRS" },
  { shape: "pay",      title: "Payroll Summary",      hint: "Gross-to-net + employer remittances" },
  { shape: "tb",       title: "Trial Balance",        hint: "Account-level debit/credit totals" },
  { shape: "daybook",  title: "Daybook",              hint: "All transactions in date order" },
];

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="export-menu" ref={ref}>
      <button
        type="button"
        className="btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="download" size={13} /> Export
        <span className="export-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="export-menu-pop" role="menu">
          <div className="export-menu-h">Export a report</div>
          {ITEMS.map((it) => (
            <Link
              key={it.shape}
              href={`/reports/${it.shape}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="export-menu-item"
              onClick={() => setOpen(false)}
            >
              <div className="export-menu-item-l">
                <div className="export-menu-item-t">{it.title}</div>
                <div className="export-menu-item-d">{it.hint}</div>
              </div>
              <Icon name="download" size={13} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
