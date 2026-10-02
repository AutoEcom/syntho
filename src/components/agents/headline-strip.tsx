"use client";

import { LiveText } from "@/components/metrics/live-text";
import { MetricStrip } from "@/components/metrics/metric-strip";
import {
  formatCount,
  formatCycles,
  formatPercent,
  formatRatio,
  formatUsdCompact,
} from "@/lib/format";

export function AgentsHeadlineStrip({
  agentsActive,
  agentsTotal,
  deployed,
  equity,
  weightedSharpe,
  correlation,
  trades24h,
  burn24h,
  shortestRunway,
}: {
  agentsActive: number;
  agentsTotal: number;
  deployed: number;
  equity: number;
  weightedSharpe: number;
  correlation: number;
  trades24h: number;
  burn24h: number;
  shortestRunway: number;
}) {
  return (
    <MetricStrip
      className="mt-10"
      metrics={[
        {
          label: "Agents",
          value: `${agentsActive} / ${agentsTotal}`,
          meta: "Active of total",
        },
        {
          label: "Capital deployed",
          value: (
            <LiveText
              value={deployed}
              kind="usd"
              seed={11}
              format={formatUsdCompact}
            />
          ),
          meta: `${formatPercent(deployed / equity, 1)} of equity`,
        },
        {
          label: "Allocation-weighted Sharpe",
          value: (
            <LiveText
              value={weightedSharpe}
              kind="ratio"
              seed={12}
              format={(n) => formatRatio(n)}
            />
          ),
          meta: "Across the live roster",
        },
        {
          label: "Mean pairwise correlation",
          value: formatRatio(correlation),
          meta: "0.40 ceiling",
        },
        {
          label: "Trades, 24h",
          value: (
            <LiveText
              value={trades24h}
              kind="count"
              seed={13}
              format={formatCount}
            />
          ),
          meta: "All agents",
        },
        {
          label: "Cycle burn, 24h",
          value: (
            <LiveText
              value={burn24h}
              kind="cycles"
              seed={14}
              format={(n) => formatCycles(n, false)}
            />
          ),
          meta: "Agent canisters only",
          tone: "brand",
        },
        {
          label: "Shortest runway",
          value: `${formatRatio(shortestRunway, 1)}d`,
          meta: "Top-up threshold 20d",
          tone: shortestRunway < 20 ? "gold" : "default",
        },
      ]}
    />
  );
}
