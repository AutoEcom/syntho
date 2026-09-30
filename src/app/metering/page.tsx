import type { Metadata } from "next";
import { CyclesChart } from "@/components/charts/cycles-chart";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { Container } from "@/components/layout/container";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { CanisterTable } from "@/components/metrics/canister-table";
import { MetricCard } from "@/components/metrics/metric-card";
import { StatList, StatRow } from "@/components/metrics/stat-row";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerChildren } from "@/components/motion/stagger-children";
import { Card } from "@/components/ui/card";
import { data } from "@/lib/data";
import type { ChartTone } from "@/components/charts/chart-theme";
import type { CycleBurnPoint } from "@/lib/types";
import {
  formatCount,
  formatCycles,
  formatDate,
  formatPercent,
  formatRatio,
  formatTimeUtc,
  formatUsd,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Metering",
  description:
    "Cycle burn, runway and the cost of compute across every canister in the Syntho deployment.",
};

const WORKLOADS: {
  key: keyof Omit<CycleBurnPoint, "date">;
  label: string;
  tone: ChartTone;
}[] = [
  { key: "agents", label: "Agent inference", tone: "brand" },
  { key: "marketData", label: "Market data ingest", tone: "info" },
  { key: "orchestration", label: "Orchestration", tone: "gold" },
  { key: "riskAndSettlement", label: "Risk & settlement", tone: "violet" },
];

export default async function MeteringPage() {
  const [metering, burn, canisters, metrics, asOf] = await Promise.all([
    data.getMeteringSummary(),
    data.getCycleBurn(30),
    data.getCanisters(),
    data.getPortfolioMetrics(),
    data.getAsOf(),
  ]);

  const atRisk = canisters.filter((c) => c.runwayDays < 20);
  const totalCalls = canisters.reduce((sum, c) => sum + c.calls24h, 0);
  const costPerTrade =
    (metering.cyclesPerTrade / 1e12) * metering.usdPerTrillionCycles;

  const windowBurn = burn.reduce(
    (sum, p) =>
      sum + p.agents + p.orchestration + p.marketData + p.riskAndSettlement,
    0
  );
  const breakdown = WORKLOADS.map((workload) => {
    const cycles = burn.reduce((sum, p) => sum + p[workload.key], 0);
    return { ...workload, cycles, share: cycles / windowBurn };
  }).sort((a, b) => b.share - a.share);

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <PageHeader
          eyebrow="Compute"
          title="Metering"
          description="On the Internet Computer, compute is paid for in cycles by the canister that performs it. That makes the cost of running this strategy stack a measured quantity with a runway, rather than an infrastructure estimate."
          actions={
            <span className="metric rounded-lg border border-edge bg-surface px-3 py-2 text-[11px] text-muted-foreground">
              Metered {formatDate(asOf)} · {formatTimeUtc(asOf)}
            </span>
          }
        />
      </FadeIn>

      <StaggerChildren
        className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 xl:grid-cols-4"
        delay={0.08}
        itemClassName="h-full min-w-0"
      >
        <MetricCard
            label="Cycle balance"
            value={formatCycles(metering.cycleBalance, false)}
            footnote={`Held across ${metering.canisterCount} canisters`}
            emphasis="brand"
          />
          <MetricCard
            label="Burn, 24 hours"
            value={formatCycles(metering.burn24h, false)}
            footnote={`${formatUsd(
              metering.cost24hUsd,
              true
            )} at ${formatUsd(metering.usdPerTrillionCycles, true)} per 1T cycles`}
          />
          <MetricCard
            label="Cost of compute"
            value={formatPercent(metering.costOfComputeRatio, 3)}
            footnote={`${formatUsd(
              metering.cost30dUsd,
              true
            )} against gross 30-day PnL`}
          />
          <MetricCard
            label="Shortest runway"
            value={formatRatio(metering.minRunwayDays, 1)}
            unit="days"
            footnote={
              atRisk.length > 0
                ? `${atRisk.length} canister${
                    atRisk.length > 1 ? "s" : ""
                  } below the 20-day top-up threshold`
                : "All canisters above the 20-day threshold"
            }
            emphasis={metering.minRunwayDays < 20 ? "gold" : "default"}
          />
      </StaggerChildren>

      <FadeIn inView className="mt-12 sm:mt-14">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Daily burn"
              title="Cycle consumption by workload"
              description="Thirty sessions, stacked. Market-data ingest scales with venue activity; agent inference scales with signal frequency."
            />
            <div className="mt-6">
              <CyclesChart points={burn} />
            </div>
          </Card>

          <div className="grid min-w-0 gap-6">
            <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
              <p className="label-micro">Share of 30-day burn</p>
              <ul className="mt-5 space-y-4">
                {breakdown.map((entry) => (
                  <li key={entry.key}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="flex items-center gap-2.5 text-[13px] text-foreground">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor: CHART_COLORS[entry.tone],
                          }}
                        />
                        {entry.label}
                      </span>
                      <span className="metric text-[13px] text-foreground">
                        {formatPercent(entry.share, 1)}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${entry.share * 100}%`,
                          backgroundColor: CHART_COLORS[entry.tone],
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <p className="metric mt-1.5 text-[11px] text-muted-foreground">
                      {formatCycles(entry.cycles, false)} over 30 days
                    </p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
              <StatList className="mt-4">
                <StatRow
                  label="Cycles per trade"
                  hint="30d mean"
                  value={formatCycles(metering.cyclesPerTrade, false)}
                />
                <StatRow
                  label="Cost per trade"
                  value={formatUsd(costPerTrade, true)}
                />
                <StatRow
                  label="Trades"
                  hint="24h"
                  value={formatCount(metrics.trades24h)}
                />
                <StatRow
                  label="Update calls"
                  hint="24h"
                  value={formatCount(totalCalls)}
                />
                <StatRow
                  label="Burn"
                  hint="30d"
                  value={formatCycles(metering.burn30d, false)}
                />
                <StatRow
                  label="Compute spend"
                  hint="30d"
                  value={formatUsd(metering.cost30dUsd, true)}
                />
                <StatRow
                  label="ICP / XDR"
                  value={formatRatio(metering.xdrPerIcp, 3)}
                  tone="muted"
                />
              </StatList>
              <p className="mt-5 border-t border-edge pt-4 text-xs leading-relaxed text-muted-foreground">
                One trillion cycles is fixed at one XDR by the protocol, so
                compute cost is stable in real terms even when the ICP price
                moves. Only the number of ICP required to top up changes.
              </p>
            </Card>
          </div>
        </div>
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-16">
        <SectionHeading
          eyebrow="Deployment"
          title="Canister inventory"
          description="Every canister in the deployment, with the module hash of the build it is currently running."
        />
        <div className="mt-6">
          <CanisterTable canisters={canisters} />
        </div>
      </FadeIn>
    </Container>
  );
}
