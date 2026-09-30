/**
 * Agent domain types.
 *
 * These mirror the shape we expect back from the Syntho registry canister.
 * All monetary values are USD, all ratios are decimal fractions (0.62 = 62%),
 * and all timestamps are ISO-8601 UTC strings.
 */

export type AgentStatus =
  | "active"
  | "paused"
  | "throttled"
  | "degraded"
  | "retired";

export type StrategyType =
  | "statistical-arbitrage"
  | "market-making"
  | "trend-following"
  | "mean-reversion"
  | "funding-basis"
  | "volatility-carry"
  | "cross-venue-arbitrage"
  | "liquidity-provision";

export type Venue = "ICPSwap" | "KongSwap" | "Sonic" | "ICDex" | "Synthetic";

/** Deterministic, ordered point used for agent sparklines. */
export interface SeriesPoint {
  /** ISO-8601 UTC date. */
  t: string;
  v: number;
}

export interface AgentRiskLimits {
  /** Hard stop on peak-to-trough equity decline before the agent halts. */
  readonly maxDrawdown: number;
  /** Maximum notional the agent may hold at once, in USD. */
  readonly maxNotional: number;
  /** Maximum share of portfolio equity the agent may be allocated. */
  readonly maxAllocation: number;
}

export interface AgentPerformance {
  /** Realised + unrealised PnL since inception, USD. */
  pnlTotal: number;
  /** PnL over the trailing 24h, USD. */
  pnl24h: number;
  /** PnL over the trailing 30d, USD. */
  pnl30d: number;
  /** Return since inception, decimal fraction. */
  returnTotal: number;
  /** Worst peak-to-trough decline observed, decimal fraction (negative). */
  maxDrawdown: number;
  /** Current distance below the equity high-water mark, decimal fraction. */
  currentDrawdown: number;
  /** Fraction of closed positions that were profitable. */
  winRate: number;
  /** Annualised Sharpe ratio. */
  sharpe: number;
  /** Annualised Sortino ratio. */
  sortino: number;
  /** Gross profit divided by gross loss. */
  profitFactor: number;
  /** Closed positions over the trailing 24h. */
  trades24h: number;
  /** Closed positions since inception. */
  tradesTotal: number;
  /** Mean holding period in minutes. */
  avgHoldMinutes: number;
}

export interface AgentCompute {
  /** Canister principal the agent executes in. */
  canisterId: string;
  /** Cycles consumed over the trailing 24h. */
  cycles24h: number;
  /** Cycles consumed since inception. */
  cyclesTotal: number;
  /** Cycles currently held by the canister. */
  cycleBalance: number;
  /** Projected days of runway at the trailing 24h burn rate. */
  runwayDays: number;
  /** Mean inference-to-order latency in milliseconds. */
  latencyMs: number;
}

export interface Agent {
  id: string;
  /** Short operator-facing name, e.g. "Helix-04". */
  name: string;
  /** Single-sentence description of the edge being harvested. */
  mandate: string;
  strategy: StrategyType;
  status: AgentStatus;
  venues: Venue[];
  /** Fraction of portfolio equity currently allocated to this agent. */
  allocation: number;
  /** Capital currently deployed, USD. */
  deployedCapital: number;
  /** ISO-8601 UTC timestamp of first deployment. */
  inceptionAt: string;
  /** ISO-8601 UTC timestamp of the most recent heartbeat. */
  updatedAt: string;
  performance: AgentPerformance;
  compute: AgentCompute;
  limits: AgentRiskLimits;
  /** Trailing 30-day equity index, normalised to 100 at the start. */
  equityIndex: SeriesPoint[];
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  "statistical-arbitrage": "Statistical Arbitrage",
  "market-making": "Market Making",
  "trend-following": "Trend Following",
  "mean-reversion": "Mean Reversion",
  "funding-basis": "Funding Basis",
  "volatility-carry": "Volatility Carry",
  "cross-venue-arbitrage": "Cross-Venue Arbitrage",
  "liquidity-provision": "Liquidity Provision",
};

export const STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Active",
  paused: "Paused",
  throttled: "Throttled",
  degraded: "Degraded",
  retired: "Retired",
};
