/**
 * Cycles metering types.
 *
 * On the Internet Computer, compute is paid for in cycles by the canister that
 * performs it. Metering is therefore a first-class operational metric: it is
 * the true, auditable cost of running the strategy stack.
 */

export type CanisterRole =
  | "agent"
  | "orchestrator"
  | "risk"
  | "market-data"
  | "treasury"
  | "settlement";

export interface CanisterInfo {
  id: string;
  name: string;
  role: CanisterRole;
  /** Cycles currently held. */
  cycleBalance: number;
  /** Cycles consumed over the trailing 24h. */
  burn24h: number;
  /** Projected days of runway at the trailing 24h burn rate. */
  runwayDays: number;
  /** Heap + stable memory in bytes. */
  memoryBytes: number;
  /** Update calls served over the trailing 24h. */
  calls24h: number;
  /** Mean update-call duration in milliseconds. */
  latencyMs: number;
  /** Subnet the canister is deployed on. */
  subnet: string;
  /** Module hash prefix, shown so operators can verify the running build. */
  moduleHash: string;
}

export interface CycleBurnPoint {
  /** ISO-8601 UTC date (daily aggregate). */
  date: string;
  /** Cycles burned by agent canisters. */
  agents: number;
  /** Cycles burned by the orchestrator. */
  orchestration: number;
  /** Cycles burned ingesting and normalising market data. */
  marketData: number;
  /** Cycles burned by risk evaluation and settlement. */
  riskAndSettlement: number;
}

export interface MeteringSummary {
  /** Total cycles held across the deployment. */
  cycleBalance: number;
  /** Total cycles burned over the trailing 24h. */
  burn24h: number;
  /** Total cycles burned over the trailing 30d. */
  burn30d: number;
  /** Trailing 24h burn converted to USD at the current XDR rate. */
  cost24hUsd: number;
  /** Trailing 30d burn converted to USD at the current XDR rate. */
  cost30dUsd: number;
  /** Compute cost as a fraction of trailing 30d gross PnL. */
  costOfComputeRatio: number;
  /** Mean cycles consumed per closed trade over the trailing 30d. */
  cyclesPerTrade: number;
  /** Shortest runway across all canisters, in days. */
  minRunwayDays: number;
  /** Number of canisters in the deployment. */
  canisterCount: number;
  /** USD cost of one trillion cycles (1T cycles = 1 XDR by protocol). */
  usdPerTrillionCycles: number;
  /** Spot ICP price in XDR, used to price cycle top-ups. */
  xdrPerIcp: number;
}

export const ROLE_LABELS: Record<CanisterRole, string> = {
  agent: "Agent",
  orchestrator: "Orchestrator",
  risk: "Risk",
  "market-data": "Market Data",
  treasury: "Treasury",
  settlement: "Settlement",
};
