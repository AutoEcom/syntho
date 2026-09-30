/**
 * Portfolio-level aggregates, as returned by the Syntho treasury canister.
 */

export interface EquityPoint {
  /** ISO-8601 UTC date (daily close). */
  date: string;
  /** Total portfolio equity at close, USD. */
  equity: number;
  /** Equity high-water mark up to and including this date, USD. */
  highWaterMark: number;
  /** Distance below the high-water mark, decimal fraction (<= 0). */
  drawdown: number;
  /** Daily return, decimal fraction. */
  dailyReturn: number;
  /** Notional exposure held at close, USD. */
  exposure: number;
}

export interface PortfolioMetrics {
  /** Total equity under management, USD. */
  equity: number;
  /** Capital contributed by allocators, USD. */
  netContributions: number;
  pnlTotal: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  return24h: number;
  return30d: number;
  returnTotal: number;
  /** Annualised return since inception, decimal fraction. */
  cagr: number;
  /** Annualised standard deviation of daily returns, decimal fraction. */
  volatility: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  currentDrawdown: number;
  /** Annualised return divided by absolute max drawdown. */
  calmar: number;
  winRate: number;
  /** Gross notional exposure as a multiple of equity. */
  grossLeverage: number;
  /** Net directional exposure as a fraction of equity. */
  netExposure: number;
  agentsActive: number;
  agentsTotal: number;
  trades24h: number;
  /** Mean pairwise correlation of agent daily returns. */
  avgAgentCorrelation: number;
  /** ISO-8601 UTC timestamp of the last on-chain state commit. */
  lastSettlementAt: string;
}

export interface AllocationSlice {
  agentId: string;
  label: string;
  /** Fraction of portfolio equity, decimal. */
  weight: number;
  /** Capital deployed, USD. */
  capital: number;
  /** Token used to colour the slice, resolves to a chart CSS variable. */
  tone: "brand" | "gold" | "info" | "positive" | "violet" | "neutral";
}

export interface ExposureBucket {
  label: string;
  /** Long notional, USD. */
  long: number;
  /** Short notional, USD, stored as a negative number. */
  short: number;
}
