import type { RiskBudget, RiskFlag } from "@/lib/types";
import { AGENTS } from "./agents";
import { PORTFOLIO_METRICS } from "./portfolio";
import { isoTimeBefore, round } from "./seed";

/** Tightest single-agent concentration budget currently in use. */
const CONCENTRATION_UTILISATION = Math.max(
  ...AGENTS.map((a) => a.allocation / a.limits.maxAllocation)
);

/**
 * Risk flags are observations with an explicit threshold, not alerts. Each one
 * states what was measured, what limit it was measured against, and whether
 * the risk canister has already acted.
 */
export const RISK_FLAGS: RiskFlag[] = [
  {
    id: "rf-1041",
    severity: "elevated",
    category: "drawdown",
    title: "Verge-09 within 78% of its drawdown limit",
    detail:
      "Notional was cut to 40% of mandate and new entries are blocked until the agent recovers above -5%.",
    agentId: "verge-09",
    value: -0.0781,
    threshold: -0.1,
    unit: "percent",
    raisedAt: isoTimeBefore(214),
    acknowledged: true,
  },
  {
    id: "rf-1039",
    severity: "elevated",
    category: "latency",
    title: "Verge-09 inference-to-order latency above tolerance",
    detail:
      "Median latency of 784ms breaches the 500ms synthetic-venue budget; the agent is marked degraded and excluded from new allocation.",
    agentId: "verge-09",
    value: 784,
    threshold: 500,
    unit: "ms",
    raisedAt: isoTimeBefore(286),
    acknowledged: true,
  },
  {
    id: "rf-1036",
    severity: "watch",
    category: "compute",
    title: "Lattice-05 cycle runway below 20 days",
    detail:
      "Projected 15.0 days at the trailing 24h burn rate. Top-up is queued from the treasury canister.",
    agentId: "lattice-05",
    value: 15,
    threshold: 20,
    unit: "ratio",
    raisedAt: isoTimeBefore(512),
    acknowledged: true,
  },
  {
    id: "rf-1034",
    severity: "watch",
    category: "drawdown",
    title: "Lattice-05 throttled after 30-day underperformance",
    detail:
      "Allocation reduced from 9.8% to 7.4% while the mean-reversion band is re-estimated on post-episode data.",
    agentId: "lattice-05",
    value: -0.0421,
    threshold: -0.09,
    unit: "percent",
    raisedAt: isoTimeBefore(1_180),
    acknowledged: true,
  },
  {
    id: "rf-1030",
    severity: "watch",
    category: "correlation",
    title: "Cadence-07 and Verge-09 correlation rose to 0.41",
    detail:
      "Both books carry short volatility exposure. Combined notional is capped at 18% of equity until correlation falls below 0.30.",
    agentId: null,
    value: 0.41,
    threshold: 0.3,
    unit: "ratio",
    raisedAt: isoTimeBefore(1_640),
    acknowledged: true,
  },
  {
    id: "rf-1027",
    severity: "nominal",
    category: "liquidity",
    title: "SNS basket depth thinned during the Asia session",
    detail:
      "Top-of-book depth fell 22% below the 30-day median. Order sizing on affected pairs was reduced automatically.",
    agentId: "lattice-05",
    value: -0.22,
    threshold: -0.35,
    unit: "percent",
    raisedAt: isoTimeBefore(2_260),
    acknowledged: true,
  },
  {
    id: "rf-1024",
    severity: "nominal",
    category: "exposure",
    title: "Gross leverage inside mandate",
    detail:
      "Gross leverage stayed below the 2.50x ceiling throughout the drawdown episode, including the period when exposure was cut.",
    agentId: null,
    value: PORTFOLIO_METRICS.grossLeverage,
    threshold: 2.5,
    unit: "ratio",
    raisedAt: isoTimeBefore(3_120),
    acknowledged: true,
  },
];

/**
 * Portfolio-level risk budgets. `utilisation` is the fraction of each hard
 * limit currently consumed — the single number an allocator wants to see.
 */
export const RISK_BUDGETS: RiskBudget[] = [
  {
    label: "Portfolio drawdown",
    utilisation: round(
      Math.abs(PORTFOLIO_METRICS.currentDrawdown) / 0.15,
      4
    ),
    limitLabel: "-15.00% hard halt",
    severity: "nominal",
  },
  {
    label: "Gross leverage",
    utilisation: round(PORTFOLIO_METRICS.grossLeverage / 2.5, 4),
    limitLabel: "2.50x ceiling",
    severity: "watch",
  },
  {
    label: "Net directional exposure",
    utilisation: round(Math.abs(PORTFOLIO_METRICS.netExposure) / 0.25, 4),
    limitLabel: "±25.00% of equity",
    severity: "nominal",
  },
  {
    label: "Single-agent concentration",
    utilisation: round(CONCENTRATION_UTILISATION, 4),
    limitLabel: "per-agent allocation cap",
    severity: "watch",
  },
  {
    label: "Mean agent correlation",
    utilisation: round(PORTFOLIO_METRICS.avgAgentCorrelation / 0.4, 4),
    limitLabel: "0.40 pairwise mean",
    severity: "nominal",
  },
  {
    label: "Venue concentration",
    utilisation: 0.512,
    limitLabel: "60.00% on any one venue",
    severity: "nominal",
  },
];
