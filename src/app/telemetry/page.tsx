import type { Metadata } from "next";
import { DrawdownChart } from "@/components/charts/drawdown-chart";
import { ExposureChart } from "@/components/charts/exposure-chart";
import { Container } from "@/components/layout/container";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/metrics/metric-strip";
import { RiskBudgetBars } from "@/components/metrics/risk-budget-bars";
import { RiskFlagList } from "@/components/metrics/risk-flag-list";
import { StatList, StatRow } from "@/components/metrics/stat-row";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { data } from "@/lib/data";
import {
  formatDate,
  formatPercent,
  formatRatio,
  formatSignedPercent,
  formatTimeUtc,
  formatUsd,
  formatUsdCompact,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Telemetry",
  description:
    "Drawdown, exposure, risk budgets and the full risk flag log for the Syntho deployment.",
};

export default async function TelemetryPage() {
  const [metrics, equity, buckets, budgets, flags, asOf] = await Promise.all([
    data.getPortfolioMetrics(),
    data.getEquityCurve(90),
    data.getExposureBuckets(),
    data.getRiskBudgets(),
    data.getRiskFlags(),
    data.getAsOf(),
  ]);

  const grossLong = buckets.reduce((sum, b) => sum + b.long, 0);
  const grossShort = buckets.reduce((sum, b) => sum + b.short, 0);
  const netNotional = grossLong + grossShort;
  const activeFlags = flags.filter((f) => f.severity !== "nominal").length;
  const trough = equity.reduce(
    (worst, p) => (p.drawdown < worst.drawdown ? p : worst),
    equity[0]
  );
  const daysUnderwater = equity.filter((p) => p.drawdown < -0.001).length;

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <FadeIn>
        <PageHeader
          eyebrow="Risk"
          title="Telemetry"
          description="Drawdown, exposure and every observation the risk canister has raised. Nothing here is smoothed or restated: the drawdown episode in the middle of the window is shown exactly as it occurred."
          actions={
            <span className="metric rounded-lg border border-edge bg-surface px-3 py-2 text-[11px] text-muted-foreground">
              Evaluated {formatDate(asOf)} · {formatTimeUtc(asOf)}
            </span>
          }
        />
      </FadeIn>

      <FadeIn delay={0.06}>
        <MetricStrip
          className="mt-8 sm:mt-10"
          metrics={[
            {
              label: "Current drawdown",
              value: formatPercent(metrics.currentDrawdown),
              meta: "Halt at -15.00%",
            },
            {
              label: "Max drawdown, 90d",
              value: formatPercent(metrics.maxDrawdown),
              meta: `Trough ${formatDate(trough.date)}`,
              tone: "negative",
            },
            {
              label: "Days underwater",
              value: `${daysUnderwater}`,
              meta: "Of 90 sessions",
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
              value: formatSignedPercent(metrics.netExposure),
              meta: `${formatUsdCompact(netNotional)} net notional`,
            },
            {
              label: "Open flags",
              value: `${activeFlags}`,
              meta: `${flags.length} in window`,
              tone: activeFlags > 0 ? "gold" : "default",
            },
          ]}
        />
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-14">
        <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
          <SectionHeading
            eyebrow="Underwater curve"
            title="Distance below the high-water mark"
            description="Drawdown is measured against the running high-water mark, so a flat line at zero means the portfolio is at a new peak."
          />
          <div className="mt-6">
            <DrawdownChart points={equity} />
          </div>
        </Card>
      </FadeIn>

      <FadeIn inView className="mt-6">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
            <SectionHeading
              eyebrow="Exposure"
              title="Long and short notional by underlying"
              description="Most books are close to delta-flat by construction; the residual is the net directional exposure below."
            />
            <div className="mt-6">
              <ExposureChart buckets={buckets} />
            </div>
          </Card>

          <div className="grid min-w-0 gap-6">
            <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
              <p className="label-micro">Exposure summary</p>
              <StatList className="mt-4">
                <StatRow
                  label="Gross long"
                  value={formatUsd(grossLong)}
                  tone="brand"
                />
                <StatRow
                  label="Gross short"
                  value={formatUsd(grossShort)}
                  tone="negative"
                />
                <StatRow
                  label="Gross notional"
                  value={formatUsd(grossLong - grossShort)}
                />
                <StatRow label="Net notional" value={formatUsd(netNotional)} />
                <StatRow
                  label="Net exposure"
                  hint="of equity"
                  value={formatSignedPercent(metrics.netExposure)}
                />
                <StatRow
                  label="Mean agent correlation"
                  value={formatRatio(metrics.avgAgentCorrelation)}
                />
              </StatList>
            </Card>

            <Card className="min-w-0 p-4 sm:p-6 lg:p-7">
              <RiskBudgetBars budgets={budgets} className="mt-6" />
            </Card>
          </div>
        </div>
      </FadeIn>

      <FadeIn inView className="mt-12 sm:mt-16">
        <SectionHeading
          eyebrow="Flag log"
          title="Every observation in the current window"
          description="Each entry records the observed value, the limit it was measured against, and whether the risk canister acted without human input."
        />
        <Card className="mt-6 min-w-0 p-4 sm:p-6 lg:p-7">
          <RiskFlagList flags={flags} asOf={asOf} />
        </Card>
      </FadeIn>
    </Container>
  );
}
