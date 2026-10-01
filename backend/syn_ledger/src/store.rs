//! Stable-memory layout for the SYN ledger.
//!
//! | Memory id | Contents                                      |
//! |-----------|-----------------------------------------------|
//! | 0         | AccountKey → balance (u64 e8s)                |
//! | 1         | LedgerConfig cell                             |
//! | 2         | DedupKey → tx index (created_at_time only)    |
//! | 10        | Reserved for ICRC-2 allowances (unused in v1) |

use crate::types::{AccountKey, DedupKey, LedgerConfig};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::{Bound, Storable};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Amount(pub u64);

impl Storable for Amount {
    const BOUND: Bound = Bound::Bounded {
        max_size: 8,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(self.0.to_le_bytes().to_vec())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let mut arr = [0u8; 8];
        arr.copy_from_slice(bytes.as_ref());
        Self(u64::from_le_bytes(arr))
    }
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static BALANCES: RefCell<StableBTreeMap<AccountKey, Amount, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))),
    );

    static CONFIG: RefCell<StableCell<LedgerConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
            LedgerConfig::default(),
        )
        .expect("init config cell"),
    );

    static DEDUP: RefCell<StableBTreeMap<DedupKey, Amount, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))),
    );

    // Memory id 10 is reserved for ICRC-2 allowances. Do not reuse.
}

pub fn config() -> LedgerConfig {
    CONFIG.with(|c| c.borrow().get().clone())
}

pub fn set_config(cfg: LedgerConfig) {
    CONFIG.with(|c| {
        c.borrow_mut().set(cfg).expect("persist LedgerConfig");
    });
}

pub fn update_config(f: impl FnOnce(&mut LedgerConfig)) {
    CONFIG.with(|c| {
        let mut cell = c.borrow_mut();
        let mut cfg = cell.get().clone();
        f(&mut cfg);
        cell.set(cfg).expect("persist LedgerConfig");
    });
}

pub fn balance_of(key: &AccountKey) -> u64 {
    BALANCES.with(|m| m.borrow().get(key).map(|a| a.0).unwrap_or(0))
}

pub fn set_balance(key: AccountKey, amount: u64) {
    BALANCES.with(|m| {
        let mut map = m.borrow_mut();
        if amount == 0 {
            map.remove(&key);
        } else {
            map.insert(key, Amount(amount));
        }
    });
}

pub fn get_dedup(key: &DedupKey) -> Option<u64> {
    DEDUP.with(|m| m.borrow().get(key).map(|a| a.0))
}

pub fn put_dedup(key: DedupKey, tx_index: u64) {
    DEDUP.with(|m| {
        m.borrow_mut().insert(key, Amount(tx_index));
    });
}

/// Touch reserved ICRC-2 memory so the id stays allocated across upgrades.
#[allow(dead_code)]
pub fn reserved_icrc2_memory_id() -> u8 {
    10
}
