import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { EquityChart } from "@/components/charts/equity-chart";
import { DashboardHeadlineMetrics } from "@/components/dashboard/headline-metrics";
import { Container } from "@/components/layout/container";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { AgentTable } from "@/components/agents/agent-table";
import { RiskBudgetBars } from "@/components/metrics/risk-budget-bars";
import { RiskFlagList } from "@/components/metrics/risk-flag-list";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Portfolio equity, risk posture, capital allocation and agent roster for the Syntho deployment.",
};

export default async function DashboardPage() {
  const [metrics, equity, allocations, agents, budgets, flags, metering, asOf] =
    await Promise.all([
      data.getPortfolioMetrics(),
      data.getEquityCurve(90),
      data.getAllocations(),
      data.getAgents(),
      data.getRiskBudgets(),
      data.getRiskFlags(),
      data.getMeteringSummary(),
      data.getAsOf(),
    ]);

  const equitySpark = equity.map((p) => ({ t: p.date, v: p.equity }));
  const drawdownSpark = equity.map((p) => ({ t: p.date, v: p.drawdown }));

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <PageHeader
          eyebrow="Portfolio"
          title="Live telemetry"
          description="Aggregate state of the Syntho deployment: equity, risk posture, capital allocation and the agents responsible for each. Limits are shown beside the values they constrain."
          actions={
            <Button asChild variant="outline" className="min-h-11 sm:min-h-8">
              <Link href="/telemetry">
                Risk telemetry
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          }
        />
      </FadeIn>

      <DashboardHeadlineMetrics
        metrics={metrics}
        metering={metering}
        equitySpark={equitySpark}
        drawdownSpark={drawdownSpark}
      />

      <FadeIn inView className="mt-12 sm:mt-16">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.75fr_1fr]">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Equity curve"
              title="Portfolio equity against high-water mark"
              description="Daily close. The dashed step line is the running high-water mark that drawdown is measured against."
            />
            <div className="mt-6">
              <EquityChart points={equity} />
            </div>
          </Card>

          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Capital allocation"
              title="Deployed by agent"
              description="Weights are set by the orchestrator, capped per agent and per venue."
            />
            <div className="mt-8">
              <AllocationChart
                slices={allocations}
                totalEquity={metrics.equity}
              />
            </div>
          </Card>
        </div>
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-16">
        <SectionHeading
          eyebrow="Agent roster"
          title="Per-agent performance and compute"
          description="Sort any column. Capital, PnL and cycle burn are reported for the same window."
          actions={
            <Button asChild variant="outline" className="min-h-11 sm:min-h-8">
              <Link href="/agents">
                Full registry
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          }
        />
        <div className="mt-6">
          <AgentTable agents={agents} asOf={asOf} />
        </div>
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-16">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_1.4fr]">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Risk budgets"
              title="Utilisation against hard limits"
              description="A budget at 100% halts the relevant book automatically."
            />
            <RiskBudgetBars budgets={budgets} className="mt-7" />
          </Card>

          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Risk flags"
              title="Most recent observations"
              description="Raised by the risk canister on every evaluation cycle."
              actions={
                <Button asChild variant="ghost" className="min-h-11 sm:min-h-8">
                  <Link href="/telemetry">
                    All flags
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              }
            />
            <RiskFlagList
              flags={flags.slice(0, 4)}
              asOf={asOf}
              className="mt-6"
            />
          </Card>
        </div>
      </FadeIn>
    </Container>
  );
}
