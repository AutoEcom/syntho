//! Stable-memory maps. Survive upgrades; heap state is not used for data.
//!
//! Memory layout (MemoryManager virtual pages):
//! - 0: latest MetricsRecord per agent
//! - 1: rolling AgentHistory per agent
//! - 2: writer allow-list (Principal → dummy u8)
//!
//! v1 keep this list small. A later registry canister will own agent identity.

use crate::types::{AgentHistory, AgentKey, MetricsRecord};
use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

pub const MAX_HISTORY: usize = 24;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static LATEST: RefCell<StableBTreeMap<AgentKey, MetricsRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))),
    );

    static HISTORY: RefCell<StableBTreeMap<AgentKey, AgentHistory, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))),
    );

    static WRITERS: RefCell<StableBTreeMap<Principal, u8, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))),
    );
}

pub fn put_latest(agent_id: &str, record: MetricsRecord) {
    let key = AgentKey(agent_id.to_string());
    LATEST.with(|map| {
        map.borrow_mut().insert(key, record);
    });
}

pub fn get_latest(agent_id: &str) -> Option<MetricsRecord> {
    let key = AgentKey(agent_id.to_string());
    LATEST.with(|map| map.borrow().get(&key))
}

pub fn iter_latest() -> Vec<MetricsRecord> {
    LATEST.with(|map| map.borrow().iter().map(|(_, record)| record).collect())
}

pub fn push_history(agent_id: &str, record: MetricsRecord) {
    let key = AgentKey(agent_id.to_string());
    HISTORY.with(|map| {
        let mut store = map.borrow_mut();
        let mut history = store.get(&key).unwrap_or_default();
        history.records.push(record);
        if history.records.len() > MAX_HISTORY {
            let drop_n = history.records.len() - MAX_HISTORY;
            history.records.drain(0..drop_n);
        }
        store.insert(key, history);
    });
}

pub fn get_history(agent_id: &str) -> Vec<MetricsRecord> {
    let key = AgentKey(agent_id.to_string());
    HISTORY.with(|map| {
        map.borrow()
            .get(&key)
            .map(|h| h.records)
            .unwrap_or_default()
    })
}

pub fn is_writer(principal: &Principal) -> bool {
    WRITERS.with(|map| map.borrow().contains_key(principal))
}

pub fn insert_writer(principal: Principal) {
    WRITERS.with(|map| {
        map.borrow_mut().insert(principal, 0);
    });
}

pub fn remove_writer(principal: &Principal) -> bool {
    WRITERS.with(|map| map.borrow_mut().remove(principal).is_some())
}

pub fn list_writers() -> Vec<Principal> {
    WRITERS.with(|map| map.borrow().iter().map(|(p, _)| p).collect())
}
