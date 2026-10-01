import { IDL } from "@dfinity/candid";

// dfx-style factory: the IDL object passed at runtime is the constructor namespace.
type FactoryArgs = { IDL: typeof IDL };

const account = (C: typeof IDL) =>
  C.Record({
    owner: C.Principal,
    subaccount: C.Opt(C.Vec(C.Nat8)),
  });

export const synSaleIdlFactory = ({ IDL: C }: FactoryArgs) => {
  const SaleInfo = C.Record({
    symbol: C.Text,
    decimals: C.Nat8,
    syn_usd_e6: C.Nat64,
    icp_usd_rate_e6: C.Nat64,
    min_purchase_usd_e6: C.Nat64,
    paused: C.Bool,
    total_sold_e8s: C.Nat64,
    remaining_mintable_e8s: C.Nat64,
    hard_cap_e8s: C.Nat64,
    treasury: C.Opt(C.Principal),
    ledger: C.Opt(C.Principal),
    icp_ledger: C.Opt(C.Principal),
  });
  const Purchase = C.Record({
    id: C.Nat64,
    buyer: C.Principal,
    icp_e8s: C.Nat64,
    icp_usd_rate_e6: C.Nat64,
    usd_e6: C.Nat64,
    syn_e8s: C.Nat64,
    timestamp_ns: C.Nat64,
    mint_tx: C.Nat,
  });
  const SaleError = C.Variant({
    Unauthorized: C.Null,
    Paused: C.Null,
    AmountTooSmall: C.Record({
      min_usd_e6: C.Nat64,
      provided_usd_e6: C.Nat64,
    }),
    RateNotSet: C.Null,
    LedgerNotSet: C.Null,
    IcpLedgerNotSet: C.Null,
    CapExceeded: C.Record({
      remaining_e8s: C.Nat64,
      requested_e8s: C.Nat64,
    }),
    InvalidAmount: C.Text,
    PurchaseInProgress: C.Null,
    IcpTransferFailed: C.Text,
    MintFailed: C.Text,
    RefundFailed: C.Text,
    ArithmeticOverflow: C.Null,
  });
  return C.Service({
    get_sale_info: C.Func([], [SaleInfo], ["query"]),
    get_icp_usd_rate: C.Func([], [C.Float64], ["query"]),
    buy: C.Func([C.Nat], [C.Variant({ Ok: Purchase, Err: SaleError })], []),
  });
};

export const synLedgerIdlFactory = ({ IDL: C }: FactoryArgs) =>
  C.Service({
    icrc1_balance_of: C.Func([account(C)], [C.Nat], ["query"]),
    icrc1_fee: C.Func([], [C.Nat], ["query"]),
    icrc1_symbol: C.Func([], [C.Text], ["query"]),
  });

export const icrcLedgerIdlFactory = ({ IDL: C }: FactoryArgs) => {
  const Account = account(C);
  const ApproveError = C.Variant({
    BadFee: C.Record({ expected_fee: C.Nat }),
    BadBurn: C.Record({ min_burn_amount: C.Nat }),
    InsufficientFunds: C.Record({ balance: C.Nat }),
    InsufficientAllowance: C.Record({ allowance: C.Nat }),
    TooOld: C.Null,
    CreatedInFuture: C.Record({ ledger_time: C.Nat64 }),
    Duplicate: C.Record({ duplicate_of: C.Nat }),
    TemporarilyUnavailable: C.Null,
    GenericError: C.Record({ error_code: C.Nat, message: C.Text }),
    AllowanceChanged: C.Record({ current_allowance: C.Nat }),
    Expired: C.Record({ ledger_time: C.Nat64 }),
  });
  return C.Service({
    icrc1_balance_of: C.Func([Account], [C.Nat], ["query"]),
    icrc1_fee: C.Func([], [C.Nat], ["query"]),
    icrc2_approve: C.Func(
      [
        C.Record({
          fee: C.Opt(C.Nat),
          memo: C.Opt(C.Vec(C.Nat8)),
          from_subaccount: C.Opt(C.Vec(C.Nat8)),
          created_at_time: C.Opt(C.Nat64),
          amount: C.Nat,
          expected_allowance: C.Opt(C.Nat),
          expires_at: C.Opt(C.Nat64),
          spender: Account,
        }),
      ],
      [C.Variant({ Ok: C.Nat, Err: ApproveError })],
      []
    ),
  });
};
