"use client";

import { useEffect, useRef } from "react";

const DESIGN_W = 1600;

/**
 * Scales an iframe of the live dashboard so it fills the preview frame
 * regardless of viewport width. Falls back to a static screenshot until
 * the iframe loads (lazy).
 */
export function LandingPreview() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    if (!wrap || !frame) return;

    // On phones, scaling a 1600px design down to ~360px renders dashboard
    // text at ~3px — unreadable and a heavy paint cost. We let the static
    // fallback image (.lp-preview-fallback) do the work instead, and skip
    // wiring the iframe entirely.
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 720px)").matches;
    if (isMobile) {
      // Detach so the browser doesn't even fetch /app on small screens.
      frame.removeAttribute("src");
      return;
    }

    const fit = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      const s = w / DESIGN_W;
      frame.style.transform = `scale(${s})`;
      // Make the iframe tall enough so the scaled content fills the box.
      frame.style.height = h / s + "px";
    };

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    fit();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="lp-preview" id="product" ref={wrapRef}>
      <div className="lp-preview-fallback" aria-hidden />
      <div className="lp-preview-inner">
        <iframe
          ref={frameRef}
          src="/app"
          title="Emiday dashboard preview"
          loading="lazy"
          // Keep keyboard focus from getting trapped in the preview.
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
