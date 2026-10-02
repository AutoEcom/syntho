import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { EquityChart } from "@/components/charts/equity-chart";
import { EarlyAccessSection } from "@/components/landing/early-access";
import { HeroNetworkAnimation } from "@/components/landing/hero-network-animation";
import { Container } from "@/components/layout/container";
import {
  FeatureIcon3D,
  type FeatureIcon3DType,
} from "@/components/three/feature-icon-3d";
import { SectionHeading } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/metrics/metric-strip";
import { StatList, StatRow } from "@/components/metrics/stat-row";
import { Enter } from "@/components/motion/enter";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerChildren } from "@/components/motion/stagger-children";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { data } from "@/lib/data";
import {
  formatCycles,
  formatPercent,
  formatRatio,
  formatSignedPercent,
  formatUsd,
  formatUsdCompact,
  truncatePrincipal,
} from "@/lib/format";

const VALUE_PROPS: {
  icon: FeatureIcon3DType;
  title: string;
  body: string;
  footer: string;
}[] = [
  {
    icon: "intelligence",
    title: "Autonomous intelligence",
    body: "Each agent researches, sizes and executes without a human in the loop. Mandates, risk limits and kill conditions are encoded in the canister, not in an operator's discretion.",
    footer: "No discretionary override path",
  },
  {
    icon: "settlement",
    title: "ICP-native cycles metering",
    body: "Compute is paid for in cycles by the canister that performs it, so the true cost of running a strategy is measured rather than estimated — and it is quoted in a unit that does not move with token prices.",
    footer: "1T cycles = 1 XDR, fixed by protocol",
  },
  {
    icon: "risk",
    title: "Transparent performance & risk telemetry",
    body: "Equity, drawdown, exposure and every risk flag are published from the same state the agents execute against. Limits are shown next to the values they constrain.",
    footer: "Observations, not marketing numbers",
  },
  {
    icon: "orchestration",
    title: "Multi-agent orchestration",
    body: "Capital is allocated across independent strategies by an orchestrator that monitors correlation, concentration and compute runway, and reduces allocation before limits are reached.",
    footer: "Correlation-aware capital routing",
  },
];

const ICP_PILLARS = [
  {
    title: "Canister-resident execution",
    body: "Every agent is a canister. Strategy logic, state and order flow live on-chain, replicated across a subnet, with no off-chain execution server to trust or to fail.",
  },
  {
    title: "Cycles as a metered cost of compute",
    body: "Canisters burn cycles to run. That makes compute a line item with a runway, not an opaque infrastructure bill — and it makes cost per trade a first-class risk metric.",
  },
  {
    title: "State you can verify",
    body: "Balances and telemetry are read from certified state, and each canister publishes the module hash of the build it is running, so the code being audited is the code being executed.",
  },
] as const;

export default async function LandingPage() {
  const [metrics, equity, agents, metering, canisters] =
    await Promise.all([
      data.getPortfolioMetrics(),
      data.getEquityCurve(90),
      data.getAgents(),
      data.getMeteringSummary(),
      data.getCanisters(),
    ]);

  const heroMetrics = [
    {
      label: "Equity under management",
      value: formatUsdCompact(metrics.equity),
      meta: `${formatUsd(metrics.equity)} settled`,
    },
    {
      label: "Return, 30 days",
      value: formatSignedPercent(metrics.return30d),
      meta: `${formatSignedPercent(metrics.returnTotal)} inception to date`,
      tone: metrics.return30d >= 0 ? ("positive" as const) : ("negative" as const),
    },
    {
      label: "Sharpe, 90 days",
      value: formatRatio(metrics.sharpe),
      meta: `Sortino ${formatRatio(metrics.sortino)}`,
    },
    {
      label: "Max drawdown",
      value: formatPercent(metrics.maxDrawdown),
      meta: `Currently ${formatPercent(metrics.currentDrawdown)}`,
    },
    {
      label: "Agents live",
      value: `${metrics.agentsActive} / ${metrics.agentsTotal}`,
      meta: `${formatRatio(metrics.avgAgentCorrelation)} mean correlation`,
    },
    {
      label: "Cycle burn, 24h",
      value: formatCycles(metering.burn24h, false),
      meta: `${formatUsd(metering.cost24hUsd, true)} of compute`,
      tone: "brand" as const,
    },
    {
      label: "Cost of compute",
      value: formatPercent(metering.costOfComputeRatio, 3),
      meta: "of gross 30-day PnL",
    },
  ];

  const infraCanisters = canisters.filter((c) => c.role !== "agent");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-edge">
        <div
          aria-hidden="true"
          className="grid-field grid-field-live pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="brand-wash pointer-events-none absolute inset-0"
        />

        <Container className="relative">
          <div className="pt-12 pb-12 sm:pt-24 sm:pb-20 lg:pt-28">
            <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-stretch lg:gap-8 xl:gap-12">
              <div className="min-w-0">
                <Enter>
                  <div className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-edge bg-surface/60 py-1.5 pr-3.5 pl-2.5 backdrop-blur-sm">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                    </span>
                    <span className="metric text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                      {metrics.agentsActive} agents live
                    </span>
                  </div>
                </Enter>

                <Enter delay={0.07}>
                  <h1 className="mt-7 max-w-3xl text-[2.125rem] leading-[1.1] font-medium tracking-[-0.03em] text-foreground sm:mt-8 sm:text-[3.5rem] sm:leading-[1.08] lg:text-[4rem]">
                    Autonomous trading intelligence.
                    <span className="block text-muted-foreground">
                      Native to the Internet Computer.
                    </span>
                  </h1>
                </Enter>

                <Enter delay={0.14}>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/90 sm:mt-7 sm:text-lg">
                    Transparent performance. Predictable compute.
                    Institutional-grade risk telemetry.
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-[0.9375rem]">
                    Syntho operates a portfolio of independent trading agents as
                    canister software on the Internet Computer. Every allocation,
                    risk limit and unit of compute is measured on-chain and
                    published as it happens — including the periods that did not
                    work.
                  </p>
                </Enter>

                <Enter delay={0.21}>
                  <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link href="/dashboard">
                        View live telemetry
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <Link href="/agents">Agent registry</Link>
                    </Button>
                  </div>
                </Enter>
              </div>

              <div className="relative hidden h-full min-h-[24rem] w-full lg:block">
                <Enter delay={0.18} className="h-full">
                  <HeroNetworkAnimation />
                </Enter>
              </div>
            </div>
          </div>

          <div className="relative -mb-px">
            <MetricStrip metrics={heroMetrics} stagger staggerFrom={0.28} />
          </div>
        </Container>
      </section>

      <EarlyAccessSection />

      {/* Value props */}
      <section className="py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="What the platform does"
              title="Four commitments, measured rather than claimed"
              description="Syntho is built for readers who check the denominator. Each commitment below maps to a surface in the product where the underlying number is published."
            />
          </FadeIn>

          <StaggerChildren
            inView
            stagger={0.07}
            itemClassName="h-full min-h-0"
            className="mt-10 grid gap-px overflow-hidden rounded-xl border border-edge bg-edge sm:mt-12 sm:grid-cols-2"
          >
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="flex h-full min-h-0 flex-col bg-surface p-6 transition-colors duration-200 hover:bg-surface-2/70 sm:p-7 lg:p-8"
              >
                <FeatureIcon3D type={prop.icon} />
                <h3 className="mt-5 text-base font-medium tracking-[-0.01em] text-foreground">
                  {prop.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {prop.body}
                </p>
                <p className="metric mt-6 border-t border-edge pt-4 text-[11px] text-muted-foreground">
                  {prop.footer}
                </p>
              </div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* Live telemetry preview */}
      <section className="border-y border-edge bg-surface/30 py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Live telemetry"
              title="Portfolio equity, 90 days"
              description="The same series the orchestrator allocates against, including the drawdown episode in the second half of the window."
              actions={
                    <Button asChild variant="outline" size="sm" className="min-h-11 sm:min-h-8">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              }
            />
          </FadeIn>

          <FadeIn inView delay={0.08}>
            <div className="mt-8 grid min-w-0 gap-6 lg:mt-10 lg:grid-cols-[1.9fr_1fr]">
              <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
                <EquityChart points={equity} />
              </Card>

              <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
                <p className="label-micro">Risk-adjusted profile</p>
                <StatList className="mt-4">
                  <StatRow
                    label="Annualised return"
                    value={formatPercent(metrics.cagr)}
                    tone="positive"
                  />
                  <StatRow
                    label="Annualised volatility"
                    value={formatPercent(metrics.volatility)}
                  />
                  <StatRow
                    label="Sharpe"
                    value={formatRatio(metrics.sharpe)}
                  />
                  <StatRow
                    label="Sortino"
                    value={formatRatio(metrics.sortino)}
                  />
                  <StatRow
                    label="Calmar"
                    value={formatRatio(metrics.calmar)}
                  />
                  <StatRow
                    label="Max drawdown"
                    value={formatPercent(metrics.maxDrawdown)}
                    tone="negative"
                  />
                  <StatRow
                    label="Winning days"
                    value={formatPercent(metrics.winRate, 1)}
                  />
                  <StatRow
                    label="Gross leverage"
                    value={`${formatRatio(metrics.grossLeverage)}x`}
                  />
                  <StatRow
                    label="Net exposure"
                    value={formatPercent(metrics.netExposure)}
                  />
                </StatList>
                <p className="mt-5 border-t border-edge pt-4 text-xs leading-relaxed text-muted-foreground">
                  Statistics are computed from the 90-day daily series shown
                  alongside, at a 0% risk-free rate.
                </p>
              </Card>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Built on the Internet Computer */}
      <section className="py-16 sm:py-24">
        <Container>
          <FadeIn inView>
            <SectionHeading
              eyebrow="Built on the Internet Computer"
              title="Execution, accounting and compute in one verifiable place"
              description="Syntho is not a web application with a chain integration. The strategies themselves are canisters, which is what makes the telemetry on this site auditable rather than reported."
            />
          </FadeIn>

          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-stretch lg:gap-6">
            <FadeIn inView delay={0.06} className="flex h-full min-h-0">
              <Card className="h-full w-full gap-0 border-0 bg-surface/45 py-0 ring-1 ring-brand/15 backdrop-blur-xl">
                <div className="flex h-full w-full flex-col divide-y divide-edge/80 px-6 sm:px-7">
                  {ICP_PILLARS.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="flex flex-1 flex-col justify-center py-7"
                    >
                      <h3 className="text-base font-medium tracking-[-0.01em] text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {pillar.body}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>

            <FadeIn inView delay={0.12} className="flex h-full min-w-0">
              <Card className="h-full w-full gap-0 py-0">
                <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4">
                  <p className="label-micro">Deployment</p>
                  <p className="metric text-[11px] text-muted-foreground">
                    {metering.canisterCount} canisters
                  </p>
                </div>

                <ul className="divide-y divide-edge">
                  {infraCanisters.map((canister) => (
                    <li
                      key={canister.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] text-foreground">
                          {canister.name}
                        </p>
                        <p className="metric mt-1 text-[11px] text-muted-foreground">
                          {truncatePrincipal(canister.id)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="metric text-[12px] text-foreground">
                          {formatCycles(canister.burn24h, false)}
                        </p>
                        <p className="metric mt-1 text-[11px] text-muted-foreground">
                          module {canister.moduleHash}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-edge bg-surface-2/40 px-5 py-4">
                  <StatRow
                    label="Total cycle balance"
                    value={formatCycles(metering.cycleBalance, false)}
                    className="py-1"
                  />
                  <StatRow
                    label="Shortest runway"
                    value={`${formatRatio(metering.minRunwayDays, 1)} days`}
                    className="py-1"
                    tone="brand"
                  />
                  <StatRow
                    label="Cycles per trade, 30d"
                    value={formatCycles(metering.cyclesPerTrade, false)}
                    className="py-1"
                  />
                </div>
              </Card>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Closing */}
      <section className="border-t border-edge">
        <Container>
          <FadeIn inView>
            <div className="flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl leading-snug font-medium tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
                  Read the telemetry before you read the pitch.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Every figure on this site is reproducible from the published
                  series. The dashboard is the product;{" "}
                  {agents.length} agents, their limits and their compute cost
                  are all there.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    View live telemetry
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/metering">Cycles & metering</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </>
  );
}
