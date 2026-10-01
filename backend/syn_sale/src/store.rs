//! Stable memory for sale config, purchase log, and per-caller locks.

use crate::types::{Purchase, SaleConfig};
use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::{Bound, Storable};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Flag(pub u8);

impl Storable for Flag {
    const BOUND: Bound = Bound::Bounded {
        max_size: 1,
        is_fixed_size: true,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(vec![self.0])
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(bytes.as_ref()[0])
    }
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static CONFIG: RefCell<StableCell<SaleConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
            SaleConfig::default(),
        )
        .expect("init sale config"),
    );

    static PURCHASES: RefCell<StableBTreeMap<u64, Purchase, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))),
    );

    static LOCKS: RefCell<StableBTreeMap<Principal, Flag, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))),
    );
}

pub fn config() -> SaleConfig {
    CONFIG.with(|c| c.borrow().get().clone())
}

pub fn set_config(cfg: SaleConfig) {
    CONFIG.with(|c| {
        c.borrow_mut().set(cfg).expect("persist SaleConfig");
    });
}

pub fn update_config(f: impl FnOnce(&mut SaleConfig)) {
    CONFIG.with(|c| {
        let mut cell = c.borrow_mut();
        let mut cfg = cell.get().clone();
        f(&mut cfg);
        cell.set(cfg).expect("persist SaleConfig");
    });
}

pub fn insert_purchase(p: Purchase) {
    PURCHASES.with(|m| {
        m.borrow_mut().insert(p.id, p);
    });
}

pub fn get_purchase(id: u64) -> Option<Purchase> {
    PURCHASES.with(|m| m.borrow().get(&id))
}

pub fn purchases_of(buyer: Principal) -> Vec<Purchase> {
    PURCHASES.with(|m| {
        m.borrow()
            .iter()
            .filter_map(|(_, p)| (p.buyer == buyer).then_some(p))
            .collect()
    })
}

pub fn lock(p: Principal) -> bool {
    LOCKS.with(|m| {
        let mut map = m.borrow_mut();
        if map.contains_key(&p) {
            false
        } else {
            map.insert(p, Flag(1));
            true
        }
    })
}

pub fn unlock(p: &Principal) {
    LOCKS.with(|m| {
        m.borrow_mut().remove(p);
    });
}
