import type {
  AllocationSlice,
  ExposureBucket,
  PortfolioMetrics,
} from "@/lib/types";
import { AGENTS } from "./agents";
import {
  DAILY_RETURNS,
  EQUITY_CURVE,
  EQUITY_LATEST,
  EQUITY_START,
  EQUITY_WINDOW_DAYS,
  NET_CONTRIBUTIONS,
  PORTFOLIO_EQUITY,
  equityDaysAgo,
} from "./equity";
import { AS_OF, round, sharpeOf, sortinoOf, volatilityOf } from "./seed";

/**
 * Exposure book. Each underlying is authored as a share of gross notional plus
 * a directional tilt in [-1, 1], then scaled to the gross exposure implied by
 * the equity series. Net exposure is therefore derived from the book rather
 * than asserted next to it.
 */
const BUCKET_SPECS: { label: string; share: number; tilt: number }[] = [
  { label: "ICP", share: 0.24, tilt: 0.18 },
  { label: "ckBTC", share: 0.21, tilt: 0.08 },
  { label: "ckETH", share: 0.17, tilt: -0.07 },
  { label: "ckUSDC", share: 0.15, tilt: 0.03 },
  { label: "CHAT", share: 0.11, tilt: -0.14 },
  { label: "SNS basket", share: 0.12, tilt: 0 },
];

const GROSS_NOTIONAL = EQUITY_LATEST.exposure;

/** Long/short notional by underlying, used by the telemetry exposure chart. */
export const EXPOSURE_BUCKETS: ExposureBucket[] = BUCKET_SPECS.map((spec) => {
  const gross = GROSS_NOTIONAL * spec.share;
  return {
    label: spec.label,
    long: round((gross * (1 + spec.tilt)) / 2, 2),
    short: round((-gross * (1 - spec.tilt)) / 2, 2),
  };
});

const netNotional = EXPOSURE_BUCKETS.reduce(
  (sum, b) => sum + b.long + b.short,
  0
);

const pnlTotal = PORTFOLIO_EQUITY - NET_CONTRIBUTIONS;
const maxDrawdown = Math.min(...EQUITY_CURVE.map((p) => p.drawdown));
const cagr =
  (PORTFOLIO_EQUITY / EQUITY_START.equity) ** (365 / EQUITY_WINDOW_DAYS) - 1;
const winningDays = DAILY_RETURNS.filter((r) => r > 0).length;
const deployedTotal = AGENTS.reduce((sum, a) => sum + a.deployedCapital, 0);

export const PORTFOLIO_METRICS: PortfolioMetrics = {
  equity: PORTFOLIO_EQUITY,
  netContributions: NET_CONTRIBUTIONS,
  pnlTotal: round(pnlTotal, 2),
  pnl24h: round(PORTFOLIO_EQUITY - equityDaysAgo(1), 2),
  pnl7d: round(PORTFOLIO_EQUITY - equityDaysAgo(7), 2),
  pnl30d: round(PORTFOLIO_EQUITY - equityDaysAgo(30), 2),
  return24h: round(PORTFOLIO_EQUITY / equityDaysAgo(1) - 1, 6),
  return30d: round(PORTFOLIO_EQUITY / equityDaysAgo(30) - 1, 6),
  returnTotal: round(pnlTotal / NET_CONTRIBUTIONS, 6),
  cagr: round(cagr, 6),
  volatility: round(volatilityOf(DAILY_RETURNS), 6),
  sharpe: round(sharpeOf(DAILY_RETURNS), 2),
  sortino: round(sortinoOf(DAILY_RETURNS), 2),
  maxDrawdown: round(maxDrawdown, 6),
  currentDrawdown: round(EQUITY_LATEST.drawdown, 6),
  calmar: round(cagr / Math.abs(maxDrawdown), 2),
  winRate: round(winningDays / DAILY_RETURNS.length, 4),
  grossLeverage: round(GROSS_NOTIONAL / PORTFOLIO_EQUITY, 2),
  netExposure: round(netNotional / PORTFOLIO_EQUITY, 6),
  agentsActive: AGENTS.filter((a) => a.status === "active").length,
  agentsTotal: AGENTS.length,
  trades24h: AGENTS.reduce((sum, a) => sum + a.performance.trades24h, 0),
  avgAgentCorrelation: 0.187,
  lastSettlementAt: AS_OF,
};

const TONES: AllocationSlice["tone"][] = [
  "brand",
  "gold",
  "info",
  "positive",
  "violet",
  "brand",
  "gold",
  "info",
];

export const ALLOCATIONS: AllocationSlice[] = [
  ...AGENTS.map((agent, i) => ({
    agentId: agent.id,
    label: agent.name,
    weight: agent.allocation,
    capital: agent.deployedCapital,
    tone: TONES[i % TONES.length],
  })),
  {
    agentId: "reserve",
    label: "Unallocated reserve",
    weight: round(1 - AGENTS.reduce((sum, a) => sum + a.allocation, 0), 4),
    capital: round(PORTFOLIO_EQUITY - deployedTotal, 2),
    tone: "neutral" as const,
  },
];

export { EQUITY_CURVE, NET_CONTRIBUTIONS, PORTFOLIO_EQUITY };
