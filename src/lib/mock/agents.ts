import type { Agent, SeriesPoint } from "@/lib/types";
import { PORTFOLIO_EQUITY } from "./equity";
import {
  isoDateBefore,
  isoTimeBefore,
  round,
  standardizedShocks,
} from "./seed";

/** Trailing window rendered in every agent sparkline. */
const SPARK_DAYS = 30;

/**
 * Trailing equity index for an agent, normalised to 100 at the window start.
 *
 * Volatility is inferred from the agent's own return and Sharpe rather than
 * authored separately, so a high-Sharpe agent visibly produces a smoother line
 * than a trend follower with the same return.
 */
function buildEquityIndex(
  seed: number,
  return30d: number,
  sharpe: number
): SeriesPoint[] {
  const mean = return30d / SPARK_DAYS;
  const impliedVol = (Math.abs(mean) * Math.sqrt(365)) / Math.max(sharpe, 0.5);
  const vol = Math.min(Math.max(impliedVol, 0.0022), 0.0155);

  const shocks = standardizedShocks(seed, SPARK_DAYS - 1);
  const points: SeriesPoint[] = [];
  let index = 100;

  for (let i = 0; i < SPARK_DAYS; i += 1) {
    if (i > 0) index *= 1 + mean + shocks[i - 1] * vol;
    points.push({ t: isoDateBefore(SPARK_DAYS - 1 - i), v: round(index, 4) });
  }

  return points;
}

/**
 * Authored agent roster. `allocation` drives deployed capital, and the return
 * fields drive PnL, so a single edit stays consistent everywhere it surfaces.
 */
interface AgentSpec {
  id: string;
  name: string;
  mandate: string;
  strategy: Agent["strategy"];
  status: Agent["status"];
  venues: Agent["venues"];
  allocation: number;
  inceptionAt: string;
  updatedMinutesAgo: number;
  returnTotal: number;
  return30d: number;
  return24h: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  sharpe: number;
  sortino: number;
  profitFactor: number;
  trades24h: number;
  tradesTotal: number;
  avgHoldMinutes: number;
  canisterId: string;
  cycles24h: number;
  cyclesTotal: number;
  cycleBalance: number;
  latencyMs: number;
  limits: Agent["limits"];
  seed: number;
}

const SPECS: AgentSpec[] = [
  {
    id: "helix-04",
    name: "Helix-04",
    mandate:
      "Harvests transient price dislocation between correlated ckToken pairs on ICP-native venues.",
    strategy: "statistical-arbitrage",
    status: "active",
    venues: ["ICPSwap", "KongSwap"],
    allocation: 0.182,
    inceptionAt: "2025-11-18T09:00:00.000Z",
    updatedMinutesAgo: 1,
    returnTotal: 0.2841,
    return30d: 0.0412,
    return24h: 0.0021,
    maxDrawdown: -0.0384,
    currentDrawdown: -0.0061,
    winRate: 0.6312,
    sharpe: 2.14,
    sortino: 3.02,
    profitFactor: 1.62,
    trades24h: 412,
    tradesTotal: 68_940,
    avgHoldMinutes: 34,
    canisterId: "e3mmv-5qaaa-aaaah-aduha-cai",
    cycles24h: 4.24e12,
    cyclesTotal: 3.11e14,
    cycleBalance: 1.84e14,
    latencyMs: 241,
    limits: { maxDrawdown: -0.08, maxNotional: 9_000_000, maxAllocation: 0.22 },
    seed: 0x1a2b3c4d,
  },
  {
    id: "meridian-02",
    name: "Meridian-02",
    mandate:
      "Two-sided quoting on ICDex order books with inventory-aware skew and hard inventory caps.",
    strategy: "market-making",
    status: "active",
    venues: ["ICDex"],
    allocation: 0.156,
    inceptionAt: "2025-09-02T09:00:00.000Z",
    updatedMinutesAgo: 1,
    returnTotal: 0.1964,
    return30d: 0.0281,
    return24h: 0.0014,
    maxDrawdown: -0.0241,
    currentDrawdown: -0.0018,
    winRate: 0.7141,
    sharpe: 2.58,
    sortino: 3.61,
    profitFactor: 1.38,
    trades24h: 2_184,
    tradesTotal: 412_600,
    avgHoldMinutes: 6,
    canisterId: "3dkbw-dyaaa-aaaah-qcwzq-cai",
    cycles24h: 7.82e12,
    cyclesTotal: 5.44e14,
    cycleBalance: 2.41e14,
    latencyMs: 118,
    limits: { maxDrawdown: -0.05, maxNotional: 7_500_000, maxAllocation: 0.18 },
    seed: 0x2b3c4d5e,
  },
  {
    id: "cadence-07",
    name: "Cadence-07",
    mandate:
      "Medium-horizon momentum on synthetic ICP majors, sized by realised volatility.",
    strategy: "trend-following",
    status: "active",
    venues: ["Synthetic"],
    allocation: 0.141,
    inceptionAt: "2025-07-14T09:00:00.000Z",
    updatedMinutesAgo: 2,
    returnTotal: 0.4118,
    return30d: 0.0624,
    return24h: -0.0038,
    maxDrawdown: -0.1182,
    currentDrawdown: -0.0314,
    winRate: 0.4182,
    sharpe: 1.31,
    sortino: 1.94,
    profitFactor: 2.21,
    trades24h: 46,
    tradesTotal: 4_120,
    avgHoldMinutes: 1_860,
    canisterId: "xkbqi-2qaaa-aaaah-qbpqq-cai",
    cycles24h: 2.14e12,
    cyclesTotal: 1.42e14,
    cycleBalance: 1.12e14,
    latencyMs: 312,
    limits: { maxDrawdown: -0.18, maxNotional: 6_000_000, maxAllocation: 0.16 },
    seed: 0x3c4d5e6f,
  },
  {
    id: "atlas-03",
    name: "Atlas-03",
    mandate:
      "Captures funding and basis spread between spot ckTokens and synthetic perpetuals.",
    strategy: "funding-basis",
    status: "active",
    venues: ["ICPSwap", "Synthetic"],
    allocation: 0.124,
    inceptionAt: "2025-12-05T09:00:00.000Z",
    updatedMinutesAgo: 1,
    returnTotal: 0.1642,
    return30d: 0.0194,
    return24h: 0.0009,
    maxDrawdown: -0.0172,
    currentDrawdown: -0.0009,
    winRate: 0.8124,
    sharpe: 2.84,
    sortino: 4.12,
    profitFactor: 1.91,
    trades24h: 128,
    tradesTotal: 21_480,
    avgHoldMinutes: 480,
    canisterId: "zfcdd-tqaaa-aaaaq-aaaga-cai",
    cycles24h: 1.92e12,
    cyclesTotal: 1.08e14,
    cycleBalance: 9.62e13,
    latencyMs: 196,
    limits: { maxDrawdown: -0.04, maxNotional: 5_500_000, maxAllocation: 0.15 },
    seed: 0x4d5e6f70,
  },
  {
    id: "quanta-11",
    name: "Quanta-11",
    mandate:
      "Sub-second cross-venue price reconciliation, fully collateralised and delta-flat on close.",
    strategy: "cross-venue-arbitrage",
    status: "active",
    venues: ["ICPSwap", "KongSwap", "Sonic", "ICDex"],
    allocation: 0.098,
    inceptionAt: "2026-01-22T09:00:00.000Z",
    updatedMinutesAgo: 1,
    returnTotal: 0.2312,
    return30d: 0.0341,
    return24h: 0.0027,
    maxDrawdown: -0.0138,
    currentDrawdown: 0,
    winRate: 0.8642,
    sharpe: 3.12,
    sortino: 4.88,
    profitFactor: 1.44,
    trades24h: 1_642,
    tradesTotal: 298_400,
    avgHoldMinutes: 3,
    canisterId: "gvbup-jyaaa-aaaah-qcdwa-cai",
    cycles24h: 6.41e12,
    cyclesTotal: 4.12e14,
    cycleBalance: 1.98e14,
    latencyMs: 92,
    limits: { maxDrawdown: -0.03, maxNotional: 4_500_000, maxAllocation: 0.12 },
    seed: 0x5e6f7081,
  },
  {
    id: "lattice-05",
    name: "Lattice-05",
    mandate:
      "Reverts short-horizon overextension in mid-cap SNS pairs against a rolling fair-value band.",
    strategy: "mean-reversion",
    status: "throttled",
    venues: ["KongSwap", "Sonic"],
    allocation: 0.074,
    inceptionAt: "2025-10-09T09:00:00.000Z",
    updatedMinutesAgo: 4,
    returnTotal: 0.1418,
    return30d: -0.0082,
    return24h: 0.0004,
    maxDrawdown: -0.0612,
    currentDrawdown: -0.0421,
    winRate: 0.6784,
    sharpe: 1.58,
    sortino: 2.11,
    profitFactor: 1.52,
    trades24h: 214,
    tradesTotal: 39_720,
    avgHoldMinutes: 96,
    canisterId: "qoctq-giaaa-aaaaa-aaaea-cai",
    cycles24h: 2.81e12,
    cyclesTotal: 1.74e14,
    cycleBalance: 4.21e13,
    latencyMs: 268,
    limits: { maxDrawdown: -0.09, maxNotional: 3_500_000, maxAllocation: 0.1 },
    seed: 0x6f708192,
  },
  {
    id: "verge-09",
    name: "Verge-09",
    mandate:
      "Sells rich short-dated implied volatility against a delta-hedged synthetic book.",
    strategy: "volatility-carry",
    status: "degraded",
    venues: ["Synthetic"],
    allocation: 0.052,
    inceptionAt: "2026-03-17T09:00:00.000Z",
    updatedMinutesAgo: 46,
    returnTotal: 0.0714,
    return30d: -0.0238,
    return24h: -0.0019,
    maxDrawdown: -0.0942,
    currentDrawdown: -0.0781,
    winRate: 0.7418,
    sharpe: 0.88,
    sortino: 1.02,
    profitFactor: 1.14,
    trades24h: 18,
    tradesTotal: 2_940,
    avgHoldMinutes: 2_640,
    canisterId: "un4fu-tqaaa-aaaab-qadjq-cai",
    cycles24h: 1.41e12,
    cyclesTotal: 8.24e13,
    cycleBalance: 6.12e13,
    latencyMs: 784,
    limits: { maxDrawdown: -0.1, maxNotional: 2_500_000, maxAllocation: 0.08 },
    seed: 0x708192a3,
  },
  {
    id: "ledger-06",
    name: "Ledger-06",
    mandate:
      "Concentrated liquidity provision on ckToken pools with impermanent-loss guardrails.",
    strategy: "liquidity-provision",
    status: "paused",
    venues: ["ICPSwap"],
    allocation: 0.031,
    inceptionAt: "2025-08-21T09:00:00.000Z",
    updatedMinutesAgo: 4_320,
    returnTotal: 0.0482,
    return30d: -0.0114,
    return24h: 0,
    maxDrawdown: -0.0521,
    currentDrawdown: -0.0384,
    winRate: 0.5842,
    sharpe: 0.72,
    sortino: 0.91,
    profitFactor: 1.08,
    trades24h: 0,
    tradesTotal: 8_640,
    avgHoldMinutes: 5_760,
    canisterId: "4hi2c-liaaa-aaaah-qcwmq-cai",
    cycles24h: 2.1e11,
    cyclesTotal: 4.41e13,
    cycleBalance: 3.84e13,
    latencyMs: 204,
    limits: { maxDrawdown: -0.06, maxNotional: 1_800_000, maxAllocation: 0.06 },
    seed: 0x8192a3b4,
  },
];

function toAgent(spec: AgentSpec): Agent {
  const deployedCapital = round(spec.allocation * PORTFOLIO_EQUITY, 2);
  const costBasis = deployedCapital / (1 + spec.returnTotal);

  return {
    id: spec.id,
    name: spec.name,
    mandate: spec.mandate,
    strategy: spec.strategy,
    status: spec.status,
    venues: spec.venues,
    allocation: spec.allocation,
    deployedCapital,
    inceptionAt: spec.inceptionAt,
    updatedAt: isoTimeBefore(spec.updatedMinutesAgo),
    performance: {
      pnlTotal: round(costBasis * spec.returnTotal, 2),
      pnl24h: round(deployedCapital * spec.return24h, 2),
      pnl30d: round(deployedCapital * spec.return30d, 2),
      returnTotal: spec.returnTotal,
      maxDrawdown: spec.maxDrawdown,
      currentDrawdown: spec.currentDrawdown,
      winRate: spec.winRate,
      sharpe: spec.sharpe,
      sortino: spec.sortino,
      profitFactor: spec.profitFactor,
      trades24h: spec.trades24h,
      tradesTotal: spec.tradesTotal,
      avgHoldMinutes: spec.avgHoldMinutes,
    },
    compute: {
      canisterId: spec.canisterId,
      cycles24h: spec.cycles24h,
      cyclesTotal: spec.cyclesTotal,
      cycleBalance: spec.cycleBalance,
      runwayDays: round(spec.cycleBalance / spec.cycles24h, 1),
      latencyMs: spec.latencyMs,
    },
    limits: spec.limits,
    equityIndex: buildEquityIndex(spec.seed, spec.return30d, spec.sharpe),
  };
}

export const AGENTS: Agent[] = SPECS.map(toAgent);

export const AGENTS_BY_ID: Record<string, Agent> = Object.fromEntries(
  AGENTS.map((agent) => [agent.id, agent])
);
