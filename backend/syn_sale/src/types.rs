//! Sale types and stable-storable records.
//!
//! Money is integer scaled units, never f64, except `get_icp_usd_rate` which is
//! a display helper (rate_e6 / 1e6).

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

pub const E8S: u64 = 100_000_000;
pub const HARD_CAP_TOKENS: u64 = 250_000_000;
pub const HARD_CAP_E8S: u64 = HARD_CAP_TOKENS * E8S;
/// 1 SYN = $0.01 → 10_000 microdollars.
pub const SYN_USD_E6: u64 = 10_000;
/// Default minimum purchase: $5.00.
pub const DEFAULT_MIN_USD_E6: u64 = 5_000_000;
/// Typical ICP ledger fee (0.0001 ICP).
pub const DEFAULT_ICP_FEE_E8S: u64 = 10_000;
pub const TOKEN_SYMBOL: &str = "SYN";

#[derive(CandidType, Deserialize, Clone, Debug, Default)]
pub struct SaleInit {
    pub admin: Option<Principal>,
    pub ledger: Option<Principal>,
    pub icp_ledger: Option<Principal>,
    pub treasury: Option<Principal>,
    pub icp_usd_rate_e6: Option<u64>,
    pub min_purchase_usd_e6: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SaleConfig {
    pub admin: Principal,
    pub ledger: Option<Principal>,
    pub icp_ledger: Option<Principal>,
    pub treasury: Option<Principal>,
    pub icp_usd_rate_e6: u64,
    pub min_purchase_usd_e6: u64,
    pub icp_fee_e8s: u64,
    pub paused: bool,
    pub total_sold_e8s: u64,
    pub next_purchase_id: u64,
}

impl Default for SaleConfig {
    fn default() -> Self {
        Self {
            admin: Principal::management_canister(),
            ledger: None,
            icp_ledger: None,
            treasury: None,
            icp_usd_rate_e6: 0,
            min_purchase_usd_e6: DEFAULT_MIN_USD_E6,
            icp_fee_e8s: DEFAULT_ICP_FEE_E8S,
            paused: false,
            total_sold_e8s: 0,
            next_purchase_id: 0,
        }
    }
}

const CONFIG_MAX: u32 = 512;
const PURCHASE_MAX: u32 = 512;

impl Storable for SaleConfig {
    const BOUND: Bound = Bound::Bounded {
        max_size: CONFIG_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).expect("encode SaleConfig"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("decode SaleConfig")
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SaleInfo {
    pub symbol: String,
    pub decimals: u8,
    pub syn_usd_e6: u64,
    pub icp_usd_rate_e6: u64,
    pub min_purchase_usd_e6: u64,
    pub paused: bool,
    pub total_sold_e8s: u64,
    pub remaining_mintable_e8s: u64,
    pub hard_cap_e8s: u64,
    pub treasury: Option<Principal>,
    pub ledger: Option<Principal>,
    pub icp_ledger: Option<Principal>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Purchase {
    pub id: u64,
    pub buyer: Principal,
    pub icp_e8s: u64,
    pub icp_usd_rate_e6: u64,
    pub usd_e6: u64,
    pub syn_e8s: u64,
    pub timestamp_ns: u64,
    pub mint_tx: Nat,
}

impl Storable for Purchase {
    const BOUND: Bound = Bound::Bounded {
        max_size: PURCHASE_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).expect("encode Purchase"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("decode Purchase")
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SaleError {
    Unauthorized,
    Paused,
    AmountTooSmall {
        min_usd_e6: u64,
        provided_usd_e6: u64,
    },
    RateNotSet,
    LedgerNotSet,
    IcpLedgerNotSet,
    CapExceeded {
        remaining_e8s: u64,
        requested_e8s: u64,
    },
    InvalidAmount(String),
    PurchaseInProgress,
    IcpTransferFailed(String),
    MintFailed(String),
    RefundFailed(String),
    ArithmeticOverflow,
}

pub type BuyResult = Result<Purchase, SaleError>;
pub type AdminResult = Result<(), SaleError>;

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

impl Account {
    pub fn of(owner: Principal) -> Self {
        Self {
            owner,
            subaccount: None,
        }
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferFromArgs {
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: Account,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Icrc1TransferArg {
    pub from_subaccount: Option<Vec<u8>>,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MintArg {
    pub to: Account,
    pub amount: Nat,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

/// ICRC-1 / ICRC-2 error blob we stringify for SaleError.
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum LedgerTransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    InsufficientAllowance { allowance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

pub type LedgerTransferResult = Result<Nat, LedgerTransferError>;

pub fn nat_from_u64(n: u64) -> Nat {
    Nat::from(n)
}

pub fn nat_to_u64(n: &Nat) -> Result<u64, SaleError> {
    let digits = n.0.to_u64_digits();
    match digits.len() {
        0 => Ok(0),
        1 => Ok(digits[0]),
        _ => Err(SaleError::InvalidAmount(
            "amount does not fit in u64".into(),
        )),
    }
}
