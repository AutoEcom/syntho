"use client";

import { Sparkline } from "@/components/charts/sparkline";
import { Delta } from "@/components/metrics/delta";
import { LiveText } from "@/components/metrics/live-text";
import { MetricCard } from "@/components/metrics/metric-card";
import { MetricStrip } from "@/components/metrics/metric-strip";
import { StaggerChildren } from "@/components/motion/stagger-children";
import { FadeIn } from "@/components/motion/fade-in";
import type { MeteringSummary, PortfolioMetrics, SeriesPoint } from "@/lib/types";
import {
  formatCount,
  formatCycles,
  formatPercent,
  formatRatio,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  formatUsdCompact,
} from "@/lib/format";

export function DashboardHeadlineMetrics({
  metrics,
  metering,
  equitySpark,
  drawdownSpark,
}: {
  metrics: PortfolioMetrics;
  metering: MeteringSummary;
  equitySpark: SeriesPoint[];
  drawdownSpark: SeriesPoint[];
}) {
  return (
    <>
      <StaggerChildren
        className="mt-8 grid items-stretch gap-4 sm:mt-10 sm:grid-cols-2 xl:grid-cols-4"
        delay={0.08}
        itemClassName="flex h-full min-w-0 [&>*]:h-full [&>*]:w-full"
      >
        <MetricCard
          label="Equity under management"
          value={
            <LiveText
              value={metrics.equity}
              kind="usd"
              seed={1}
              format={formatUsdCompact}
            />
          }
          footnote={
            <>
              <LiveText
                value={metrics.equity}
                kind="usd"
                seed={1}
                format={formatUsd}
              />{" "}
              · {formatUsdCompact(metrics.netContributions)} contributed
            </>
          }
          delta={
            <Delta
              value={metrics.return24h}
              label={
                <LiveText
                  value={metrics.return24h}
                  kind="percent"
                  seed={2}
                  format={(n) => formatSignedPercent(n)}
                />
              }
            />
          }
          visual={<Sparkline points={equitySpark} tone="brand" height={56} />}
        />
        <MetricCard
          label="PnL, inception to date"
          value={
            <LiveText
              value={metrics.pnlTotal}
              kind="pnl"
              seed={3}
              format={(n) => formatSignedUsd(n, true)}
            />
          }
          footnote={`${formatSignedPercent(
            metrics.returnTotal
          )} on contributed capital`}
          delta={
            <Delta
              value={metrics.pnl24h}
              label={
                <LiveText
                  value={metrics.pnl24h}
                  kind="pnl"
                  seed={4}
                  format={(n) => formatSignedUsd(n, true)}
                />
              }
            />
          }
        />
        <MetricCard
          label="Current drawdown"
          value={
            <LiveText
              value={metrics.currentDrawdown}
              kind="percent"
              seed={5}
              format={(n) => formatPercent(n)}
            />
          }
          footnote={`Worst in window ${formatPercent(
            metrics.maxDrawdown
          )} · halt at -15.00%`}
          visual={
            <Sparkline points={drawdownSpark} tone="negative" height={56} />
          }
        />
        <MetricCard
          label="Sharpe, 90 days"
          value={
            <LiveText
              value={metrics.sharpe}
              kind="ratio"
              seed={6}
              format={(n) => formatRatio(n)}
            />
          }
          footnote={`Sortino ${formatRatio(
            metrics.sortino
          )} · Calmar ${formatRatio(metrics.calmar)}`}
          emphasis="brand"
        />
      </StaggerChildren>

      <FadeIn delay={0.32}>
        <MetricStrip
          className="mt-4"
          metrics={[
            {
              label: "Annualised return",
              value: (
                <LiveText
                  value={metrics.cagr}
                  kind="percent"
                  seed={7}
                  format={(n) => formatPercent(n)}
                />
              ),
              meta: "From the 90-day series",
              tone: "positive",
            },
            {
              label: "Annualised volatility",
              value: formatPercent(metrics.volatility),
              meta: "Daily returns, 365d scaling",
            },
            {
              label: "Gross leverage",
              value: `${formatRatio(metrics.grossLeverage)}x`,
              meta: "2.50x ceiling",
            },
            {
              label: "Net exposure",
              value: (
                <LiveText
                  value={metrics.netExposure}
                  kind="percent"
                  seed={8}
                  format={(n) => formatSignedPercent(n)}
                />
              ),
              meta: "±25.00% of equity",
            },
            {
              label: "Agents live",
              value: `${metrics.agentsActive} / ${metrics.agentsTotal}`,
              meta: `Mean correlation ${formatRatio(
                metrics.avgAgentCorrelation
              )}`,
            },
            {
              label: "Trades, 24h",
              value: (
                <LiveText
                  value={metrics.trades24h}
                  kind="count"
                  seed={9}
                  format={formatCount}
                />
              ),
              meta: `Win rate ${formatPercent(metrics.winRate, 1)}`,
            },
            {
              label: "Cycle burn, 24h",
              value: (
                <LiveText
                  value={metering.burn24h}
                  kind="cycles"
                  seed={10}
                  format={(n) => formatCycles(n, false)}
                />
              ),
              meta: `${formatUsd(metering.cost24hUsd, true)} of compute`,
              tone: "brand",
            },
          ]}
        />
      </FadeIn>
    </>
  );
}
