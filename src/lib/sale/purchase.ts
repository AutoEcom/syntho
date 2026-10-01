import type { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { saleActors } from "./actors";
import {
  APPROVE_TTL_NS,
  DEFAULT_ICP_FEE_E8S,
  SALE_CANISTER_IDS,
} from "./config";
import { formatApproveError, formatSaleError, formatUnknown } from "./errors";
import { fromOpt, toOpt, type PurchaseCandid } from "./types";

export class SaleNotConfiguredError extends Error {
  constructor() {
    super("Sale canisters are not configured for this network.");
    this.name = "SaleNotConfiguredError";
  }
}

function ownerAccount(owner: Principal) {
  return { owner, subaccount: [] as [] };
}

function nowNs(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

/**
 * Approve syn_sale on the ICP ledger, then call syn_sale.buy(icp_e8s).
 * The caller must already be authenticated with Internet Identity.
 */
export async function executePurchase(args: {
  identity: Identity;
  buyer: Principal;
  icpE8s: bigint;
  saleCanisterId?: string;
  synLedgerCanisterId?: string;
  icpLedgerCanisterId?: string;
  onStage?: (stage: "approve" | "buy") => void;
}): Promise<PurchaseCandid> {
  const saleId = args.saleCanisterId ?? SALE_CANISTER_IDS.synSale;
  const ledgerId = args.synLedgerCanisterId ?? SALE_CANISTER_IDS.synLedger;
  const icpId = args.icpLedgerCanisterId ?? SALE_CANISTER_IDS.icpLedger;

  if (!saleId || !ledgerId || !icpId) {
    throw new SaleNotConfiguredError();
  }

  const { sale, icpLedger } = await saleActors(args.identity);
  const saleActor = sale(saleId);
  const icpActor = icpLedger(icpId);

  let fee = DEFAULT_ICP_FEE_E8S;
  try {
    fee = await icpActor.icrc1_fee();
  } catch {
    // Keep the documented default if the fee query is unavailable.
  }

  const created = nowNs();
  args.onStage?.("approve");
  const approve = await icpActor.icrc2_approve({
    fee: toOpt(fee),
    memo: [],
    from_subaccount: [],
    created_at_time: toOpt(created),
    amount: args.icpE8s,
    expected_allowance: [],
    expires_at: toOpt(created + APPROVE_TTL_NS),
    spender: ownerAccount(Principal.fromText(saleId)),
  });

  if ("Err" in approve) {
    throw new Error(formatApproveError(approve.Err));
  }

  args.onStage?.("buy");
  const result = await saleActor.buy(args.icpE8s);
  if ("Err" in result) {
    throw new Error(formatSaleError(result.Err));
  }

  return result.Ok;
}

export async function fetchSaleSnapshot(identity?: Identity): Promise<{
  synUsdE6: bigint;
  icpUsdRateE6: bigint;
  minUsdE6: bigint;
  paused: boolean;
  remainingE8s: bigint;
  treasury: string | null;
  icpLedger: string | null;
  synLedger: string | null;
  saleId: string | null;
}> {
  const saleId = SALE_CANISTER_IDS.synSale;
  if (!saleId) {
    throw new SaleNotConfiguredError();
  }

  const { sale } = await saleActors(identity);
  const info = await sale(saleId).get_sale_info();
  const asNat = (v: bigint | number) => (typeof v === "bigint" ? v : BigInt(v));
  const treasury = fromOpt(info.treasury);

  return {
    synUsdE6: asNat(info.syn_usd_e6),
    icpUsdRateE6: asNat(info.icp_usd_rate_e6),
    minUsdE6: asNat(info.min_purchase_usd_e6),
    paused: info.paused,
    remainingE8s: asNat(info.remaining_mintable_e8s),
    treasury: treasury ? treasury.toText() : null,
    icpLedger: fromOpt(info.icp_ledger)?.toText() ?? SALE_CANISTER_IDS.icpLedger,
    synLedger: fromOpt(info.ledger)?.toText() ?? SALE_CANISTER_IDS.synLedger,
    saleId,
  };
}

export async function fetchIcpBalance(
  owner: Principal,
  icpLedgerId: string,
  identity?: Identity
): Promise<bigint> {
  const { icpLedger } = await saleActors(identity);
  return icpLedger(icpLedgerId).icrc1_balance_of(ownerAccount(owner));
}

export async function fetchSynBalance(
  owner: Principal,
  synLedgerId: string,
  identity?: Identity
): Promise<bigint> {
  const { synLedger } = await saleActors(identity);
  return synLedger(synLedgerId).icrc1_balance_of(ownerAccount(owner));
}

export async function fetchIcpFee(
  icpLedgerId: string,
  identity?: Identity
): Promise<bigint> {
  try {
    const { icpLedger } = await saleActors(identity);
    return await icpLedger(icpLedgerId).icrc1_fee();
  } catch {
    return DEFAULT_ICP_FEE_E8S;
  }
}

export { formatUnknown };
