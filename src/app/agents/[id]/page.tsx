import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { StatusDot } from "@/components/agents/status-dot";
import { StrategyBadge, VenueList } from "@/components/agents/strategy-badge";
import { IndexChart } from "@/components/charts/index-chart";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/page-header";
import { AgentHeadlineMetrics } from "@/components/agents/headline-metrics";
import { AgentRiskLimitsPanel } from "@/components/agents/risk-limit-controls";
import { TopUpCyclesDialog } from "@/components/agents/top-up-cycles-dialog";
import { RiskFlagList } from "@/components/metrics/risk-flag-list";
import { StatList, StatRow } from "@/components/metrics/stat-row";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { data } from "@/lib/data";
import {
  formatBytes,
  formatCount,
  formatCycles,
  formatMs,
  formatPercent,
  formatRatio,
  formatSignedUsd,
  formatSince,
  toneOf,
} from "@/lib/format";

export async function generateStaticParams() {
  const agents = await data.getAgents();
  return agents.map((agent) => ({ id: agent.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = await data.getAgent(id);
  if (!agent) return { title: "Agent not found" };

  return {
    title: agent.name,
    description: agent.mandate,
  };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [agent, flags, canisters, asOf, metering] = await Promise.all([
    data.getAgent(id),
    data.getRiskFlags(),
    data.getCanisters(),
    data.getAsOf(),
    data.getMeteringSummary(),
  ]);

  if (!agent) notFound();

  const { performance, compute, limits } = agent;
  const agentFlags = flags.filter((flag) => flag.agentId === agent.id);
  const canister = canisters.find((c) => c.id === compute.canisterId);
  const return30d = performance.pnl30d / agent.deployedCapital;

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <Link
          href="/agents"
          className="inline-flex min-h-11 items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          All agents
        </Link>

        <div className="mt-6 flex flex-col gap-6 border-b border-edge pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <StatusDot status={agent.status} />
              <StrategyBadge strategy={agent.strategy} />
              <VenueList venues={agent.venues} />
            </div>
            <h1 className="metric mt-4 text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-foreground sm:text-[2.125rem]">
              {agent.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              {agent.mandate}
            </p>
          </div>

          <div className="shrink-0 rounded-lg border border-edge bg-surface px-4 py-3">
            <p className="label-micro">Canister</p>
            <p className="metric mt-1.5 text-[13px] break-all text-foreground">
              {compute.canisterId}
            </p>
            <p className="metric mt-1.5 text-[11px] text-muted-foreground">
              {canister
                ? `${canister.subnet} · module ${canister.moduleHash}`
                : "subnet pending"}
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <AgentHeadlineMetrics agent={agent} />
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-14">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Performance index"
              title="Thirty-day equity index"
              description="Normalised to 100 at the start of the window. The dashed line marks the starting level."
            />
            <div className="mt-6">
              <IndexChart
                points={agent.equityIndex}
                tone={toneOf(return30d) === "negative" ? "negative" : "brand"}
              />
            </div>
          </Card>

          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Risk limits"
              title="Budget utilisation"
              description="Each budget is enforced in the canister. Drag a limit to preview utilisation, then apply."
            />
            <AgentRiskLimitsPanel
              agentName={agent.name}
              currentDrawdown={performance.currentDrawdown}
              deployedCapital={agent.deployedCapital}
              allocation={agent.allocation}
              maxDrawdown={limits.maxDrawdown}
              maxNotional={limits.maxNotional}
              maxAllocation={limits.maxAllocation}
              runwayDays={compute.runwayDays}
            />
          </Card>
        </div>
      </FadeIn>

      <FadeIn inView className="mt-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <p className="label-micro">Performance</p>
            <StatList className="mt-4">
              <StatRow
                label="Return"
                hint="inception to date"
                value={formatPercent(performance.returnTotal)}
                tone={
                  performance.returnTotal >= 0 ? "positive" : "negative"
                }
              />
              <StatRow
                label="PnL"
                hint="30d"
                value={formatSignedUsd(performance.pnl30d, true)}
                tone={performance.pnl30d >= 0 ? "positive" : "negative"}
              />
              <StatRow
                label="Win rate"
                value={formatPercent(performance.winRate, 1)}
              />
              <StatRow
                label="Profit factor"
                value={formatRatio(performance.profitFactor)}
              />
              <StatRow
                label="Max drawdown"
                value={formatPercent(performance.maxDrawdown)}
                tone="negative"
              />
              <StatRow
                label="Trades"
                hint="24h"
                value={formatCount(performance.trades24h)}
              />
              <StatRow
                label="Trades"
                hint="total"
                value={formatCount(performance.tradesTotal)}
              />
              <StatRow
                label="Mean hold"
                value={`${formatCount(performance.avgHoldMinutes)} min`}
              />
            </StatList>
          </Card>

          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="label-micro">Compute</p>
              <TopUpCyclesDialog
                agentName={agent.name}
                canisterId={compute.canisterId}
                cycleBalance={compute.cycleBalance}
                runwayDays={compute.runwayDays}
                burn24h={compute.cycles24h}
                usdPerTrillionCycles={metering.usdPerTrillionCycles}
                xdrPerIcp={metering.xdrPerIcp}
              />
            </div>
            <StatList className="mt-4">
              <StatRow
                label="Cycle balance"
                value={formatCycles(compute.cycleBalance, false)}
              />
              <StatRow
                label="Burn"
                hint="24h"
                value={formatCycles(compute.cycles24h, false)}
              />
              <StatRow
                label="Burn"
                hint="total"
                value={formatCycles(compute.cyclesTotal, false)}
              />
              <StatRow
                label="Runway"
                value={`${formatRatio(compute.runwayDays, 1)} days`}
                tone={compute.runwayDays < 20 ? "negative" : "brand"}
              />
              <StatRow
                label="Order latency"
                hint="median"
                value={formatMs(compute.latencyMs)}
              />
              {canister ? (
                <>
                  <StatRow
                    label="Memory"
                    value={formatBytes(canister.memoryBytes)}
                  />
                  <StatRow
                    label="Update calls"
                    hint="24h"
                    value={formatCount(canister.calls24h)}
                  />
                </>
              ) : null}
              <StatRow
                label="Last heartbeat"
                value={formatSince(agent.updatedAt, asOf)}
                tone="muted"
              />
            </StatList>
          </Card>

          <Card className="min-w-0 p-4 sm:p-6 lg:col-span-2 lg:p-7 xl:col-span-1">
            <p className="label-micro">Risk flags</p>
            {agentFlags.length > 0 ? (
              <RiskFlagList flags={agentFlags} asOf={asOf} className="mt-5" />
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                No open flags. The agent is operating inside every limit in its
                mandate, and the risk canister has taken no automated action in
                the current window.
              </p>
            )}
          </Card>
        </div>
      </FadeIn>
    </Container>
  );
}
