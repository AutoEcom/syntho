import type { Principal } from "@dfinity/principal";

export type CandidOpt<T> = [] | [T];

export function fromOpt<T>(value: CandidOpt<T> | undefined | null): T | null {
  if (value === undefined || value === null || value.length === 0) {
    return null;
  }
  return value[0] as T;
}

export function toOpt<T>(value: T | null | undefined): CandidOpt<T> {
  return value === null || value === undefined ? [] : [value];
}

export interface IcrcAccount {
  owner: Principal;
  subaccount: CandidOpt<Uint8Array | number[]>;
}

export interface SaleInfoCandid {
  symbol: string;
  decimals: number;
  syn_usd_e6: bigint;
  icp_usd_rate_e6: bigint;
  min_purchase_usd_e6: bigint;
  paused: boolean;
  total_sold_e8s: bigint;
  remaining_mintable_e8s: bigint;
  hard_cap_e8s: bigint;
  treasury: CandidOpt<Principal>;
  ledger: CandidOpt<Principal>;
  icp_ledger: CandidOpt<Principal>;
}

export interface PurchaseCandid {
  id: bigint;
  buyer: Principal;
  icp_e8s: bigint;
  icp_usd_rate_e6: bigint;
  usd_e6: bigint;
  syn_e8s: bigint;
  timestamp_ns: bigint;
  mint_tx: bigint;
}

export type SaleErrorCandid =
  | { Unauthorized: null }
  | { Paused: null }
  | { AmountTooSmall: { min_usd_e6: bigint; provided_usd_e6: bigint } }
  | { RateNotSet: null }
  | { LedgerNotSet: null }
  | { IcpLedgerNotSet: null }
  | { CapExceeded: { remaining_e8s: bigint; requested_e8s: bigint } }
  | { InvalidAmount: string }
  | { PurchaseInProgress: null }
  | { IcpTransferFailed: string }
  | { MintFailed: string }
  | { RefundFailed: string }
  | { ArithmeticOverflow: null };

export type BuyResultCandid =
  | { Ok: PurchaseCandid }
  | { Err: SaleErrorCandid };

export interface SynSaleService {
  get_sale_info: () => Promise<SaleInfoCandid>;
  get_icp_usd_rate: () => Promise<number>;
  buy: (icpE8s: bigint) => Promise<BuyResultCandid>;
}

export interface SynLedgerService {
  icrc1_balance_of: (account: IcrcAccount) => Promise<bigint>;
  icrc1_fee: () => Promise<bigint>;
  icrc1_symbol: () => Promise<string>;
}

export type ApproveResultCandid =
  | { Ok: bigint }
  | { Err: unknown };

export interface IcrcLedgerService {
  icrc1_balance_of: (account: IcrcAccount) => Promise<bigint>;
  icrc1_fee: () => Promise<bigint>;
  icrc2_approve: (arg: {
    fee: CandidOpt<bigint>;
    memo: CandidOpt<Uint8Array>;
    from_subaccount: CandidOpt<Uint8Array>;
    created_at_time: CandidOpt<bigint>;
    amount: bigint;
    expected_allowance: CandidOpt<bigint>;
    expires_at: CandidOpt<bigint>;
    spender: IcrcAccount;
  }) => Promise<ApproveResultCandid>;
}
