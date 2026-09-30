import type { Metadata } from "next";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentTable } from "@/components/agents/agent-table";
import { Container } from "@/components/layout/container";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/metrics/metric-strip";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerChildren } from "@/components/motion/stagger-children";
import { data } from "@/lib/data";
import {
  formatCount,
  formatCycles,
  formatPercent,
  formatRatio,
  formatUsdCompact,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Agents",
  description:
    "Mandate, performance, risk limits and compute cost for every agent in the Syntho deployment.",
};

export default async function AgentsPage() {
  const [agents, metrics, asOf] = await Promise.all([
    data.getAgents(),
    data.getPortfolioMetrics(),
    data.getAsOf(),
  ]);

  const deployed = agents.reduce((sum, a) => sum + a.deployedCapital, 0);
  const weightedSharpe =
    agents.reduce((sum, a) => sum + a.performance.sharpe * a.allocation, 0) /
    agents.reduce((sum, a) => sum + a.allocation, 0);
  const burn24h = agents.reduce((sum, a) => sum + a.compute.cycles24h, 0);
  const shortestRunway = Math.min(...agents.map((a) => a.compute.runwayDays));

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <PageHeader
          eyebrow="Registry"
          title="Agents"
          description="Each agent is an independent canister with its own mandate, risk limits and cycle budget. Allocation is set by the orchestrator and is reduced automatically as limits are approached."
        />
      </FadeIn>

      <FadeIn delay={0.06}>
        <MetricStrip
          className="mt-10"
          metrics={[
            {
              label: "Agents",
              value: `${metrics.agentsActive} / ${agents.length}`,
              meta: "Active of total",
            },
            {
              label: "Capital deployed",
              value: formatUsdCompact(deployed),
              meta: `${formatPercent(deployed / metrics.equity, 1)} of equity`,
            },
            {
              label: "Allocation-weighted Sharpe",
              value: formatRatio(weightedSharpe),
              meta: "Across the live roster",
            },
            {
              label: "Mean pairwise correlation",
              value: formatRatio(metrics.avgAgentCorrelation),
              meta: "0.40 ceiling",
            },
            {
              label: "Trades, 24h",
              value: formatCount(metrics.trades24h),
              meta: "All agents",
            },
            {
              label: "Cycle burn, 24h",
              value: formatCycles(burn24h, false),
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
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-14">
        <SectionHeading
          eyebrow="Roster"
          title="Live agents"
          description="Thirty-day equity index shown per agent, normalised to 100 at the start of the window."
        />
        <StaggerChildren
          inView
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          itemClassName="h-full min-w-0"
        >
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} asOf={asOf} />
          ))}
        </StaggerChildren>
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-16">
        <SectionHeading
          eyebrow="Comparison"
          title="Side-by-side metrics"
          description="Sort any column to compare risk-adjusted performance and compute cost on the same basis."
        />
        <div className="mt-6">
          <AgentTable agents={agents} asOf={asOf} />
        </div>
      </FadeIn>
    </Container>
  );
}
