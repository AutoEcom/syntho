/**
 * Single source for $SYN sale parameters and canister IDs.
 *
 * Rates and the minimum are defaults used until `syn_sale.get_sale_info`
 * returns live values. Canister IDs come from the environment so the same
 * build can target a local replica or mainnet. Nothing here is a secret.
 */

import { ICP_NETWORK } from "@/lib/icp/config";

/** 1 token = 10^8 e8s (ICP and SYN). */
export const E8S = BigInt(100_000_000);

/** 1 SYN = $0.01 → 10_000 microdollars. */
export const SYN_USD_E6 = BigInt(10_000);

/** Default minimum purchase: $5.00. Overridden by the sale canister. */
export const DEFAULT_MIN_USD_E6 = BigInt(5_000_000);

/** Typical ICP ledger transfer / approve fee (0.0001 ICP). */
export const DEFAULT_ICP_FEE_E8S = BigInt(10_000);

export const SYN_DECIMALS = 8;
export const SYN_SYMBOL = "SYN";

/** Quick-select notionals. The input is USD; ICP is derived from the live rate. */
export const QUICK_USD_AMOUNTS = [5, 10, 25, 50, 100] as const;

/** Mainnet ICP ledger (ICRC-1 / ICRC-2). */
export const ICP_LEDGER_MAINNET = "ryjl3-tyaaa-aaaaa-aaaba-cai";

export const SALE_CANISTER_IDS = {
  synLedger: process.env.NEXT_PUBLIC_CANISTER_SYN_LEDGER ?? null,
  synSale: process.env.NEXT_PUBLIC_CANISTER_SYN_SALE ?? null,
  /**
   * ICP ledger used for approve + balance. Falls back to mainnet when the
   * network is `ic` and no override is set. Local replica must set this
   * explicitly (nns-ledger or a stand-in).
   */
  icpLedger:
    process.env.NEXT_PUBLIC_CANISTER_ICP_LEDGER ??
    (ICP_NETWORK === "ic" ? ICP_LEDGER_MAINNET : null),
} as const;

export function isSaleConfigured(): boolean {
  return Boolean(SALE_CANISTER_IDS.synSale && SALE_CANISTER_IDS.synLedger);
}

export function isIcpLedgerConfigured(): boolean {
  return Boolean(SALE_CANISTER_IDS.icpLedger);
}

/** Fallback ICP/USD used only when the sale canister has not been queried yet. */
export const FALLBACK_ICP_USD_RATE_E6 = BigInt(
  process.env.NEXT_PUBLIC_SALE_ICP_USD_RATE_E6 ?? "10000000"
);

export const APPROVE_TTL_NS =
  BigInt(5) * BigInt(60) * BigInt(1_000_000_000);
