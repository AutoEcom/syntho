"use client";

import { Delta } from "@/components/metrics/delta";
import { LiveText } from "@/components/metrics/live-text";
import { MetricCard } from "@/components/metrics/metric-card";
import type { Agent } from "@/lib/types";
import {
  formatDate,
  formatPercent,
  formatRatio,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  toneOf,
} from "@/lib/format";

export function AgentHeadlineMetrics({ agent }: { agent: Agent }) {
  const { performance, limits } = agent;
  const return30d = performance.pnl30d / agent.deployedCapital;

  return (
    <div className="mt-10 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Return, 30 days"
        value={
          <LiveText
            value={return30d}
            kind="percent"
            seed={21}
            format={(n) => formatSignedPercent(n)}
          />
        }
        footnote={
          <>
            <LiveText
              value={performance.pnl30d}
              kind="pnl"
              seed={22}
              format={(n) => formatSignedUsd(n)}
            />{" "}
            on {formatUsd(agent.deployedCapital)} deployed
          </>
        }
        delta={
          <Delta
            value={performance.pnl24h}
            label={
              <LiveText
                value={performance.pnl24h}
                kind="pnl"
                seed={23}
                format={(n) => formatSignedUsd(n, true)}
              />
            }
          />
        }
        emphasis={toneOf(return30d) === "negative" ? "default" : "brand"}
      />
      <MetricCard
        label="PnL, inception to date"
        value={
          <LiveText
            value={performance.pnlTotal}
            kind="pnl"
            seed={24}
            format={(n) => formatSignedUsd(n, true)}
          />
        }
        footnote={`${formatSignedPercent(
          performance.returnTotal
        )} since ${formatDate(agent.inceptionAt)}`}
      />
      <MetricCard
        label="Sharpe"
        value={
          <LiveText
            value={performance.sharpe}
            kind="ratio"
            seed={25}
            format={(n) => formatRatio(n)}
          />
        }
        footnote={`Sortino ${formatRatio(
          performance.sortino
        )} · profit factor ${formatRatio(performance.profitFactor)}`}
      />
      <MetricCard
        label="Current drawdown"
        value={
          <LiveText
            value={performance.currentDrawdown}
            kind="percent"
            seed={26}
            format={(n) => formatPercent(n)}
          />
        }
        footnote={`Worst ${formatPercent(
          performance.maxDrawdown
        )} · halt ${formatPercent(limits.maxDrawdown)}`}
      />
    </div>
  );
}
