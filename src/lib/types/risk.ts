/**
 * Risk telemetry types.
 *
 * Flags are emitted by the risk canister on every evaluation cycle. They are
 * observations, not alerts: severity describes proximity to a hard limit.
 */

export type RiskSeverity = "critical" | "elevated" | "watch" | "nominal";

export type RiskCategory =
  | "drawdown"
  | "exposure"
  | "liquidity"
  | "correlation"
  | "latency"
  | "compute"
  | "venue";

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  category: RiskCategory;
  /** Short operator-facing statement of what was observed. */
  title: string;
  /** One sentence of context, including the action the system took. */
  detail: string;
  /** Agent the flag applies to, or null for portfolio-level flags. */
  agentId: string | null;
  /** Observed value, decimal fraction or raw unit depending on category. */
  value: number;
  /** Limit the observed value is measured against. */
  threshold: number;
  /** How the value should be rendered. */
  unit: "percent" | "ratio" | "usd" | "ms" | "cycles";
  /** ISO-8601 UTC timestamp the flag was raised. */
  raisedAt: string;
  /** Whether the risk canister has already acted on this flag. */
  acknowledged: boolean;
}

export interface RiskBudget {
  label: string;
  /** Current utilisation of the budget, decimal fraction of the limit. */
  utilisation: number;
  /** Human-readable description of the limit itself. */
  limitLabel: string;
  severity: RiskSeverity;
}

export const SEVERITY_LABELS: Record<RiskSeverity, string> = {
  critical: "Critical",
  elevated: "Elevated",
  watch: "Watch",
  nominal: "Nominal",
};

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  drawdown: "Drawdown",
  exposure: "Exposure",
  liquidity: "Liquidity",
  correlation: "Correlation",
  latency: "Latency",
  compute: "Compute",
  venue: "Venue",
};
