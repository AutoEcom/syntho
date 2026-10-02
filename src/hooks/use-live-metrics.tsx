"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const LiveClockContext = createContext(0);

/** Shared clock so every live metric on the page ticks from one rAF loop. */
export function LiveClockProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    let raf = 0;
    let lastPublish = 0;
    const origin = performance.now();

    const loop = (now: number) => {
      if (document.visibilityState === "visible" && now - lastPublish >= 200) {
        lastPublish = now;
        setT((now - origin) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <LiveClockContext.Provider value={t}>{children}</LiveClockContext.Provider>
  );
}

export type LiveKind = "usd" | "pnl" | "percent" | "ratio" | "cycles" | "count";

const AMPLITUDE: Record<Exclude<LiveKind, "count">, number> = {
  usd: 0.00006,
  pnl: 0.00022,
  percent: 0.0035,
  ratio: 0.0012,
  cycles: 0.00018,
};

function drift(t: number, seed: number): number {
  return (
    Math.sin(t * 0.31 + seed) * 0.5 +
    Math.sin(t * 0.67 + seed * 1.37) * 0.32 +
    Math.sin(t * 0.14 + seed * 0.51) * 0.18
  );
}

/**
 * Smooth, sub-basis-point wander around a published canister reading.
 * Hydration always returns `base`; motion starts after mount.
 */
export function useLiveMetric(
  base: number,
  kind: LiveKind,
  seed = 1
): number {
  const t = useContext(LiveClockContext);
  if (t === 0) return base;

  if (kind === "count") {
    const w = drift(t, seed);
    return Math.max(0, Math.round(base + w * 1.15));
  }

  return base * (1 + AMPLITUDE[kind] * drift(t, seed));
}
