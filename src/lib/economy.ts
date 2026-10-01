/**
 * Protocol economy — single source of truth for figures shown on /economy.
 *
 * Edit numbers here. Allocation `share` values are fractions of `hardCap`
 * and must sum to 1. This page is informational; there is no purchase flow.
 */

export const SYNTHO_TOKEN = {
  symbol: "$SYN",
  name: "SYN",
  hardCap: 250_000_000,
} as const;

export type SettlementRole = "native" | "protocol" | "coordination" | "external";

export interface SettlementAsset {
  id: string;
  ticker: string;
  role: SettlementRole;
  roleLabel: string;
  title: string;
  body: string;
  mapsTo: string;
}

export const SETTLEMENT_ASSETS: readonly SettlementAsset[] = [
  {
    id: "cycles",
    ticker: "Cycles",
    role: "native",
    roleLabel: "Native compute",
    title: "Internet Computer fuel",
    body: "Cycles are what the replica burns to execute canisters. Agent inference, telemetry and orchestration settle in cycles at the protocol layer, regardless of how an operator pays at the product edge.",
    mapsTo: "Execution · telemetry · orchestration",
  },
  {
    id: "icp",
    ticker: "ICP",
    role: "protocol",
    roleLabel: "Protocol settlement",
    title: "Native ledger settlement",
    body: "ICP is accepted as protocol-native settlement and can be converted into cycles for canister operation. It does not replace cycle accounting; it funds it.",
    mapsTo: "Settlement → cycle conversion → compute runway",
  },
  {
    id: "syn",
    ticker: "$SYN",
    role: "coordination",
    roleLabel: "Coordination",
    title: "Access and incentive layer",
    body: "$SYN coordinates who may run which agents, at what allocation limits, and on what compute terms. It complements cycles. It does not pay the replica.",
    mapsTo: "Access · limits · discount · priority · authority",
  },
  {
    id: "usdc",
    ticker: "USDC",
    role: "external",
    roleLabel: "External settlement",
    title: "Stable-value settlement",
    body: "Accepted so operators can settle access and compute without holding ICP. Converted at the protocol edge into the same access map and cycle provisioning as other assets.",
    mapsTo: "Settlement → access / cycle provisioning",
  },
] as const;

export interface UtilityStage {
  id: string;
  index: string;
  title: string;
  body: string;
  note: string;
}

export const UTILITY_STAGES: readonly UtilityStage[] = [
  {
    id: "access",
    index: "01",
    title: "Access",
    body: "Unlock additional agents and higher allocation limits. Capacity is a product constraint, not an emissions schedule.",
    note: "Agents · allocation envelope",
  },
  {
    id: "compute",
    index: "02",
    title: "Compute discount",
    body: "Settlement in $SYN reduces the cycles billed for equivalent compute. The replica still burns cycles; the discount is applied at the product edge.",
    note: "Cycles cost · product edge",
  },
  {
    id: "priority",
    index: "03",
    title: "Priority",
    body: "Preferential orchestration and multi-agent slots when capacity is scarce. Ordering is explicit and inspectable, not discretionary.",
    note: "Orchestration · multi-agent slots",
  },
  {
    id: "authority",
    index: "04",
    title: "Staking & authority",
    body: "Committed $SYN improves an operator's risk parameters and network authority — wider envelopes only where the mandate and telemetry already support them.",
    note: "Risk parameters · authority",
  },
  {
    id: "governance",
    index: "05",
    title: "Future governance",
    body: "A later path for setting strategy-marketplace parameters. Not active in this version. Governance is scoped to product rules, not to monetary policy.",
    note: "Marketplace parameters · later",
  },
] as const;

export interface AccrualStep {
  id: string;
  index: string;
  title: string;
  body: string;
}

export const ACCRUAL_STEPS: readonly AccrualStep[] = [
  {
    id: "activity",
    index: "01",
    title: "Protocol activity",
    body: "Agents run. Operators pay for access, allocation and compute in accepted settlement assets. Without this step the rest of the loop does not exist.",
  },
  {
    id: "inflows",
    index: "02",
    title: "Treasury inflows",
    body: "A defined share of settlement lands in the protocol treasury. Inflows are a function of usage, not of new supply.",
  },
  {
    id: "support",
    index: "03",
    title: "Network support",
    body: "Treasury provisions cycles, sustains canisters and supports operators. The default path is earned inflow — not perpetual inflationary emissions.",
  },
] as const;

export type AllocationTone = "brand" | "gold" | "info" | "violet" | "muted";

export interface AllocationBucket {
  id: string;
  label: string;
  /** Fraction of hard cap. All shares must sum to 1. */
  share: number;
  purpose: string;
  terms?: string;
  tone: AllocationTone;
}

export const ALLOCATIONS: readonly AllocationBucket[] = [
  {
    id: "treasury",
    label: "Treasury & Protocol",
    share: 0.4,
    purpose:
      "Protocol-owned inventory, cycle provisioning and operating reserves tied to measured network activity.",
    tone: "brand",
  },
  {
    id: "early",
    label: "Early Access",
    share: 0.12,
    purpose:
      "Operators admitted while the product was in closed access. Aligned to usage of the platform, not to a distribution event.",
    tone: "gold",
  },
  {
    id: "contributors",
    label: "Core Contributors",
    share: 0.18,
    purpose:
      "Team and long-horizon builders responsible for the canister stack, research and operations.",
    terms: "12-month cliff · 36-month vest",
    tone: "info",
  },
  {
    id: "ecosystem",
    label: "Ecosystem",
    share: 0.18,
    purpose:
      "Integrations, agent-builder programs and protocol tooling, released against delivered work.",
    tone: "violet",
  },
  {
    id: "reserve",
    label: "Reserve",
    share: 0.12,
    purpose:
      "Contingency held outside the operating treasury. Not an emissions schedule.",
    tone: "muted",
  },
] as const;

const SHARE_SUM = ALLOCATIONS.reduce((sum, bucket) => sum + bucket.share, 0);

if (Math.abs(SHARE_SUM - 1) > 1e-9) {
  throw new Error(
    `ALLOCATIONS shares must sum to 1 (hard cap). Got ${SHARE_SUM}.`
  );
}

export function allocationAmount(share: number): number {
  return SYNTHO_TOKEN.hardCap * share;
}
