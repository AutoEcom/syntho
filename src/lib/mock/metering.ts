import type {
  CanisterInfo,
  CycleBurnPoint,
  MeteringSummary,
} from "@/lib/types";
import { AGENTS } from "./agents";
import { PORTFOLIO_METRICS } from "./portfolio";
import { createGaussian, createRng, isoDateBefore, round } from "./seed";

/** 1T cycles = 1 XDR by protocol; this is the XDR/USD rate in effect. */
export const USD_PER_TRILLION_CYCLES = 1.34;

const BURN_WINDOW_DAYS = 30;

const SUBNETS = [
  "pzp6e-ekpqu-3c5vg",
  "nl6hn-ja4yw-wvmpy",
  "k44fs-gm4pv-afozh",
] as const;

const MODULE_HASHES = [
  "e4f2a1c9",
  "b7d0348e",
  "5a9c61fb",
  "1c48de07",
  "9f3ba2d5",
  "2e70c4a8",
  "c081f63b",
  "74adb18f",
] as const;

/** Infrastructure canisters that sit alongside the agent fleet. */
const INFRA_CANISTERS: CanisterInfo[] = [
  {
    id: "rdmx6-jaaaa-aaaaa-aaadq-cai",
    name: "Orchestrator",
    role: "orchestrator",
    cycleBalance: 3.14e14,
    burn24h: 5.82e12,
    runwayDays: round(3.14e14 / 5.82e12, 1),
    memoryBytes: 431_620_096,
    calls24h: 184_240,
    latencyMs: 86,
    subnet: SUBNETS[0],
    moduleHash: "a13f7c02",
  },
  {
    id: "renrk-eyaaa-aaaaa-aaada-cai",
    name: "Market Data",
    role: "market-data",
    cycleBalance: 4.21e14,
    burn24h: 9.18e12,
    runwayDays: round(4.21e14 / 9.18e12, 1),
    memoryBytes: 1_246_195_712,
    calls24h: 1_241_800,
    latencyMs: 64,
    subnet: SUBNETS[1],
    moduleHash: "6b20de94",
  },
  {
    id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    name: "Risk Engine",
    role: "risk",
    cycleBalance: 1.92e14,
    burn24h: 2.41e12,
    runwayDays: round(1.92e14 / 2.41e12, 1),
    memoryBytes: 268_435_456,
    calls24h: 86_400,
    latencyMs: 112,
    subnet: SUBNETS[0],
    moduleHash: "d5c8014a",
  },
  {
    id: "rno2w-sqaaa-aaaaa-aaacq-cai",
    name: "Settlement",
    role: "settlement",
    cycleBalance: 2.18e14,
    burn24h: 1.72e12,
    runwayDays: round(2.18e14 / 1.72e12, 1),
    memoryBytes: 184_549_376,
    calls24h: 42_180,
    latencyMs: 148,
    subnet: SUBNETS[2],
    moduleHash: "3e9b57cf",
  },
  {
    id: "r7inp-6aaaa-aaaaa-aaabq-cai",
    name: "Treasury",
    role: "treasury",
    cycleBalance: 2.04e14,
    burn24h: 6.8e11,
    runwayDays: round(2.04e14 / 6.8e11, 1),
    memoryBytes: 92_274_688,
    calls24h: 8_640,
    latencyMs: 174,
    subnet: SUBNETS[2],
    moduleHash: "80fa2d61",
  },
];

const AGENT_CANISTERS: CanisterInfo[] = AGENTS.map((agent, i) => ({
  id: agent.compute.canisterId,
  name: agent.name,
  role: "agent" as const,
  cycleBalance: agent.compute.cycleBalance,
  burn24h: agent.compute.cycles24h,
  runwayDays: agent.compute.runwayDays,
  memoryBytes: 134_217_728 + i * 27_262_976,
  calls24h: agent.performance.trades24h * 18 + 2_400,
  latencyMs: agent.compute.latencyMs,
  subnet: SUBNETS[i % SUBNETS.length],
  moduleHash: MODULE_HASHES[i % MODULE_HASHES.length],
}));

export const CANISTERS: CanisterInfo[] = [
  ...INFRA_CANISTERS,
  ...AGENT_CANISTERS,
];

const AGENT_BURN_24H = AGENTS.reduce((s, a) => s + a.compute.cycles24h, 0);
const ORCHESTRATION_BURN_24H = 5.82e12;
const MARKET_DATA_BURN_24H = 9.18e12;
const RISK_SETTLEMENT_BURN_24H = 2.41e12 + 1.72e12 + 6.8e11;

/**
 * Daily cycle burn broken out by workload. Day-to-day variation tracks market
 * activity, so the series is generated rather than flat.
 */
function buildCycleBurn(): CycleBurnPoint[] {
  const gauss = createGaussian(createRng(0x2f81b305));
  const jitter = () => 1 + gauss() * 0.11;

  return Array.from({ length: BURN_WINDOW_DAYS }, (_, i) => ({
    date: isoDateBefore(BURN_WINDOW_DAYS - 1 - i),
    agents: round(AGENT_BURN_24H * jitter()),
    orchestration: round(ORCHESTRATION_BURN_24H * jitter()),
    marketData: round(MARKET_DATA_BURN_24H * jitter()),
    riskAndSettlement: round(RISK_SETTLEMENT_BURN_24H * jitter()),
  }));
}

export const CYCLE_BURN: CycleBurnPoint[] = buildCycleBurn();

function pointTotal(p: CycleBurnPoint): number {
  return p.agents + p.orchestration + p.marketData + p.riskAndSettlement;
}

const burn24h = pointTotal(CYCLE_BURN[CYCLE_BURN.length - 1]);
const burn30d = CYCLE_BURN.reduce((sum, p) => sum + pointTotal(p), 0);
const cost30dUsd = (burn30d / 1e12) * USD_PER_TRILLION_CYCLES;

/** Gross 30-day PnL across agents, used as the denominator for compute cost. */
const grossPnl30d = AGENTS.reduce(
  (sum, a) => sum + Math.abs(a.performance.pnl30d),
  0
);

export const METERING_SUMMARY: MeteringSummary = {
  cycleBalance: CANISTERS.reduce((sum, c) => sum + c.cycleBalance, 0),
  burn24h: round(burn24h),
  burn30d: round(burn30d),
  cost24hUsd: round((burn24h / 1e12) * USD_PER_TRILLION_CYCLES, 2),
  cost30dUsd: round(cost30dUsd, 2),
  costOfComputeRatio: round(cost30dUsd / grossPnl30d, 6),
  cyclesPerTrade: round(burn30d / (PORTFOLIO_METRICS.trades24h * 30)),
  minRunwayDays: Math.min(...CANISTERS.map((c) => c.runwayDays)),
  canisterCount: CANISTERS.length,
  usdPerTrillionCycles: USD_PER_TRILLION_CYCLES,
  xdrPerIcp: 3.412,
};