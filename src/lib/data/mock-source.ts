import {
  AGENTS,
  AGENTS_BY_ID,
  ALLOCATIONS,
  AS_OF,
  CANISTERS,
  CYCLE_BURN,
  EQUITY_CURVE,
  EXPOSURE_BUCKETS,
  METERING_SUMMARY,
  PORTFOLIO_METRICS,
  RISK_BUDGETS,
  RISK_FLAGS,
} from "@/lib/mock";
import type { SynthoDataSource } from "./source";

/**
 * Mock implementation of the read surface.
 *
 * Resolved immediately and synchronously-seeded: the dataset is deterministic,
 * so server prerender and client hydration agree and no loading states flicker.
 */
export const mockDataSource: SynthoDataSource = {
  kind: "mock",

  async getAsOf() {
    return AS_OF;
  },

  async getPortfolioMetrics() {
    return PORTFOLIO_METRICS;
  },

  async getEquityCurve(days) {
    return days ? EQUITY_CURVE.slice(-days) : EQUITY_CURVE;
  },

  async getAllocations() {
    return ALLOCATIONS;
  },

  async getExposureBuckets() {
    return EXPOSURE_BUCKETS;
  },

  async getAgents() {
    return AGENTS;
  },

  async getAgent(id) {
    return AGENTS_BY_ID[id] ?? null;
  },

  async getRiskFlags() {
    return RISK_FLAGS;
  },

  async getRiskBudgets() {
    return RISK_BUDGETS;
  },

  async getMeteringSummary() {
    return METERING_SUMMARY;
  },

  async getCycleBurn(days) {
    return days ? CYCLE_BURN.slice(-days) : CYCLE_BURN;
  },

  async getCanisters() {
    return CANISTERS;
  },
};
