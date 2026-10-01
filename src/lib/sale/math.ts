/**
 * Integer conversion matching `backend/syn_sale/src/math.rs`.
 *
 * The modal is USD-primary: the buyer picks a dollar notional, we convert to
 * ICP e8s (rounding up so the canister's derived USD still meets the minimum),
 * then `buy(icp_e8s)` is quoted the same way on-chain.
 *
 *   usd_e6  = icp_e8s * rate_e6 / 10^8
 *   syn_e8s = usd_e6  * 10^8    / syn_usd_e6
 *   icp_e8s = ceil(usd_e6 * 10^8 / rate_e6)
 */

import { E8S, SYN_USD_E6 } from "./config";

const ZERO = BigInt(0);
const ONE = BigInt(1);

export interface Quote {
  usdE6: bigint;
  synE8s: bigint;
  icpE8s: bigint;
}

export function usdToIcpE8s(usdE6: bigint, icpUsdRateE6: bigint): bigint | null {
  if (usdE6 <= ZERO || icpUsdRateE6 <= ZERO) return null;
  return (usdE6 * E8S + icpUsdRateE6 - ONE) / icpUsdRateE6;
}

export function quoteFromIcp(
  icpE8s: bigint,
  icpUsdRateE6: bigint,
  synUsdE6: bigint = SYN_USD_E6
): Quote | null {
  if (icpE8s <= ZERO || icpUsdRateE6 <= ZERO || synUsdE6 <= ZERO) return null;
  const usdE6 = (icpE8s * icpUsdRateE6) / E8S;
  const synE8s = (usdE6 * E8S) / synUsdE6;
  if (synE8s <= ZERO) return null;
  return { usdE6, synE8s, icpE8s };
}

export function quoteFromUsd(
  usdE6: bigint,
  icpUsdRateE6: bigint,
  synUsdE6: bigint = SYN_USD_E6
): Quote | null {
  const icpE8s = usdToIcpE8s(usdE6, icpUsdRateE6);
  if (icpE8s === null) return null;
  return quoteFromIcp(icpE8s, icpUsdRateE6, synUsdE6);
}

export function usdToE6(usd: number): bigint {
  if (!Number.isFinite(usd) || usd <= 0) return ZERO;
  return BigInt(Math.round(usd * 1_000_000));
}

export function e6ToUsd(usdE6: bigint): number {
  return Number(usdE6) / 1_000_000;
}

export function e8sToNumber(e8s: bigint): number {
  return Number(e8s) / Number(E8S);
}

export function formatE8s(e8s: bigint, digits = 4): string {
  const neg = e8s < ZERO;
  const abs = neg ? -e8s : e8s;
  const whole = abs / E8S;
  const frac = abs % E8S;
  const fracStr = frac.toString().padStart(8, "0").slice(0, digits);
  const trimmed = fracStr.replace(/0+$/, "");
  const body = trimmed.length ? `${whole.toString()}.${trimmed}` : whole.toString();
  return neg ? `-${body}` : body;
}

export function parseUsdInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, "");
  if (cleaned === "" || cleaned === ".") return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
