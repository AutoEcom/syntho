//! ICRC-1 types plus ledger config. Amounts are whole token e8s (10^-8 SYN).
//!
//! ICRC-2 (`approve` / `transfer_from`) is not implemented yet. Allowance
//! storage is reserved in `store` (memory id 10) so it can be added without
//! reshuffling existing maps.

use candid::{CandidType, Deserialize, Int, Nat, Principal};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

/// 8 decimals: 1 SYN = 100_000_000 e8s.
pub const DECIMALS: u8 = 8;
pub const E8S: u64 = 100_000_000;
/// Hard cap of 250_000_000 SYN, in e8s. Fits in u64.
pub const HARD_CAP_TOKENS: u64 = 250_000_000;
pub const HARD_CAP_E8S: u64 = HARD_CAP_TOKENS * E8S;
/// Default transfer fee: 0.0001 SYN.
pub const DEFAULT_FEE_E8S: u64 = 10_000;
pub const TOKEN_NAME: &str = "Syntho";
pub const TOKEN_SYMBOL: &str = "SYN";

/// ICRC-1 created_at_time window (24h) and future drift (2 min), in nanoseconds.
pub const TX_WINDOW_NS: u64 = 24 * 60 * 60 * 1_000_000_000;
pub const PERMITTED_DRIFT_NS: u64 = 2 * 60 * 1_000_000_000;

pub const MAX_MEMO_LEN: usize = 32;
pub const SUBACCOUNT_LEN: usize = 32;

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

impl Account {
    pub fn new(owner: Principal) -> Self {
        Self {
            owner,
            subaccount: None,
        }
    }

    pub fn normalized_subaccount(&self) -> Result<[u8; 32], String> {
        match &self.subaccount {
            None => Ok([0u8; 32]),
            Some(bytes) if bytes.len() == SUBACCOUNT_LEN => {
                let mut out = [0u8; 32];
                out.copy_from_slice(bytes);
                Ok(out)
            }
            Some(_) => Err("subaccount must be 32 bytes".into()),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct AccountKey {
    pub owner: Principal,
    pub subaccount: [u8; 32],
}

impl AccountKey {
    pub fn from_account(account: &Account) -> Result<Self, String> {
        Ok(Self {
            owner: account.owner,
            subaccount: account.normalized_subaccount()?,
        })
    }

    pub fn minting(minter: Principal) -> Self {
        Self {
            owner: minter,
            subaccount: [0u8; 32],
        }
    }
}

const ACCOUNT_KEY_MAX: u32 = 1 + 29 + 32;

impl Storable for AccountKey {
    const BOUND: Bound = Bound::Bounded {
        max_size: ACCOUNT_KEY_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let p = self.owner.as_slice();
        let mut buf = Vec::with_capacity(1 + p.len() + 32);
        buf.push(p.len() as u8);
        buf.extend_from_slice(p);
        buf.extend_from_slice(&self.subaccount);
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let bytes = bytes.as_ref();
        let n = bytes[0] as usize;
        let owner = Principal::from_slice(&bytes[1..1 + n]);
        let mut subaccount = [0u8; 32];
        subaccount.copy_from_slice(&bytes[1 + n..1 + n + 32]);
        Self { owner, subaccount }
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferArg {
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

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

pub type TransferResult = Result<Nat, TransferError>;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum Value {
    Nat(Nat),
    Int(Int),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct StandardRecord {
    pub name: String,
    pub url: String,
}

#[derive(CandidType, Deserialize, Clone, Debug, Default)]
pub struct LedgerInit {
    pub minter: Option<Principal>,
    pub fee_e8s: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LedgerConfig {
    pub minter: Principal,
    pub fee_e8s: u64,
    pub total_supply_e8s: u64,
    pub total_minted_e8s: u64,
    pub next_tx_index: u64,
}

impl Default for LedgerConfig {
    fn default() -> Self {
        Self {
            minter: Principal::management_canister(),
            fee_e8s: DEFAULT_FEE_E8S,
            total_supply_e8s: 0,
            total_minted_e8s: 0,
            next_tx_index: 0,
        }
    }
}

const CONFIG_MAX: u32 = 256;
const DEDUP_KEY_MAX: u32 = 80;

impl Storable for LedgerConfig {
    const BOUND: Bound = Bound::Bounded {
        max_size: CONFIG_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).expect("encode LedgerConfig"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("decode LedgerConfig")
    }
}

/// Dedup key when `created_at_time` is set: caller + timestamp + memo hash.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct DedupKey(pub Vec<u8>);

impl Storable for DedupKey {
    const BOUND: Bound = Bound::Bounded {
        max_size: DEDUP_KEY_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(self.0.clone())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(bytes.into_owned())
    }
}

/// Placeholder for a future ICRC-2 allowance record. Not stored yet.
#[allow(dead_code)]
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Allowance {
    pub amount: u64,
    pub expires_at: Option<u64>,
}

pub fn nat_from_u64(n: u64) -> Nat {
    Nat::from(n)
}

pub fn nat_to_u64(n: &Nat) -> Result<u64, TransferError> {
    let digits = n.0.to_u64_digits();
    match digits.len() {
        0 => Ok(0),
        1 => Ok(digits[0]),
        _ => Err(TransferError::GenericError {
            error_code: Nat::from(1u64),
            message: "amount does not fit in u64".into(),
        }),
    }
}
