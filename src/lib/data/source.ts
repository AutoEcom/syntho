import type {
  Agent,
  AllocationSlice,
  CanisterInfo,
  CycleBurnPoint,
  EquityPoint,
  ExposureBucket,
  MeteringSummary,
  PortfolioMetrics,
  RiskBudget,
  RiskFlag,
} from "@/lib/types";

/**
 * The single read surface the UI is allowed to depend on.
 *
 * Every method is async and returns plain domain types, so the mock
 * implementation and a future canister-backed implementation are
 * interchangeable without touching a component. When the real canisters land,
 * add an `IcpDataSource` that satisfies this interface and select it in
 * `./index.ts` — nothing in `src/app` or `src/components` should change.
 */
export interface SynthoDataSource {
  readonly kind: "mock" | "icp";

  /** Reference timestamp all relative times are computed against. */
  getAsOf(): Promise<string>;

  getPortfolioMetrics(): Promise<PortfolioMetrics>;
  getEquityCurve(days?: number): Promise<EquityPoint[]>;
  getAllocations(): Promise<AllocationSlice[]>;
  getExposureBuckets(): Promise<ExposureBucket[]>;

  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;

  getRiskFlags(): Promise<RiskFlag[]>;
  getRiskBudgets(): Promise<RiskBudget[]>;

  getMeteringSummary(): Promise<MeteringSummary>;
  getCycleBurn(days?: number): Promise<CycleBurnPoint[]>;
  getCanisters(): Promise<CanisterInfo[]>;
}
