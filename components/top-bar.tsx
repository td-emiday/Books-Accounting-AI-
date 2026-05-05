"use client";

import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { titleFor } from "@/lib/routes";
import { useDashboardData } from "./dashboard-data-context";
import { windowFor } from "@/lib/period";

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const PERIODS = ["Today", "Week", "Month", "Quarter", "Year"] as const;
export type Period = (typeof PERIODS)[number];

type Props = {
  dark: boolean;
  setDark: (v: boolean) => void;
  tweaksOpen: boolean;
  setTweaksOpen: (v: boolean) => void;
};

export function TopBar({ dark, setDark, tweaksOpen, setTweaksOpen }: Props) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const { period, setPeriod, todayIso } = useDashboardData();
  const win = windowFor(period, parseIso(todayIso));

  return (
    <div className="topbar">
      <div className="pill">
        <div className="crumbs">
          <span className="page">{title}</span>
          <span className="period">{win.label}</span>
        </div>
      </div>

      <div className="pill" style={{ marginLeft: "auto" }}>
        <div className="seg">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={period === p ? "on" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        {/* iOS shows a sheet-style wheel picker for native selects;
            desktop hides this and uses the segmented buttons above. */}
        <select
          className="period-native"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          aria-label="Period"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div className="pill-icon" onClick={() => setDark(!dark)}>
          <Icon name={dark ? "sun" : "moon"} size={15} />
        </div>
        <div className="pill-icon">
          <Icon name="bell" size={15} />
        </div>
        <div
          className="pill-icon"
          onClick={() => setTweaksOpen(!tweaksOpen)}
          title="Tweaks"
        >
          <Icon name="sparkle" size={15} />
        </div>
      </div>
    </div>
  );
}
