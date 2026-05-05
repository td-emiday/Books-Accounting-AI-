"use client";

import { useEffect, useState } from "react";
import { Chat } from "./chat";
import { DashboardDataProvider } from "./dashboard-data-context";
import { MobileTabs } from "./mobile-tabs";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { Transaction } from "@/lib/data/transactions";
import type { WorkspaceContext } from "@/lib/queries/workspace";

type Accent = "indigo" | "green" | "amber" | "mono";
type Density = "airy" | "balanced" | "dense";

export function DashboardShell({
  initialTransactions,
  workspaceContext,
  todayIso,
  children,
}: {
  initialTransactions: Transaction[];
  workspaceContext: WorkspaceContext;
  todayIso: string;
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(false);
  const [accent, setAccent] = useState<Accent>("indigo");
  const [density, setDensity] = useState<Density>("balanced");
  const [chatOpen, setChatOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    document.body.classList.toggle("density-airy", density === "airy");
    document.body.classList.toggle("density-dense", density === "dense");
    document.body.dataset.accent = accent;
  }, [dark, accent, density]);

  return (
    <DashboardDataProvider
      initialTransactions={initialTransactions}
      workspaceContext={workspaceContext}
      todayIso={todayIso}
    >
      <div className="app">
        <Sidebar />
        <main className="main">
          <TopBar
            dark={dark}
            setDark={setDark}
            tweaksOpen={tweaksOpen}
            setTweaksOpen={setTweaksOpen}
          />
          {children}
        </main>

        <Chat open={chatOpen} setOpen={setChatOpen} />
        <MobileTabs />

        {tweaksOpen && (
          <div className="tweaks-panel on">
            <h5>Tweaks</h5>
            <div className="tweak-row">
              <span className="lbl">Dark mode</span>
              <div
                className={`tog ${dark ? "on" : ""}`}
                onClick={() => setDark(!dark)}
              />
            </div>
            <div className="tweak-row">
              <span className="lbl">Accent</span>
              <div className="swatches">
                {(
                  [
                    { id: "indigo", c: "#2e2c8a" },
                    { id: "green", c: "#1f6b3a" },
                    { id: "amber", c: "#8a5a18" },
                    { id: "mono", c: dark ? "#f4f3ef" : "#0d0d10" },
                  ] as const
                ).map((s) => (
                  <div
                    key={s.id}
                    className={`sw-btn ${accent === s.id ? "on" : ""}`}
                    style={{ background: s.c }}
                    onClick={() => setAccent(s.id)}
                  />
                ))}
              </div>
            </div>
            <div className="tweak-row">
              <span className="lbl">Density</span>
              <div className="density-seg">
                {(["airy", "balanced", "dense"] as const).map((d) => (
                  <button
                    key={d}
                    className={density === d ? "on" : ""}
                    onClick={() => setDensity(d)}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardDataProvider>
  );
}
