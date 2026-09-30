use candid::{CandidType, Deserialize};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

/// Latest (or historical) metrics for a single agent.
///
/// `timestamp` is IC time in nanoseconds. Off-chain agents may send 0;
/// the canister then stamps the record with `ic_cdk::api::time()`.
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MetricsRecord {
    pub agent_id: String,
    pub timestamp: u64,
    pub equity: f64,
    pub pnl_day: f64,
    pub pnl_total: f64,
    pub drawdown: f64,
    pub sharpe_90d: f64,
    pub win_rate: f64,
    pub trades_24h: u32,
    pub cycles_burned_24h: u64,
    pub status: String,
}

/// Aggregate view across all known agents.
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PortfolioSnapshot {
    pub timestamp: u64,
    pub total_equity: f64,
    pub total_pnl: f64,
    pub current_drawdown: f64,
    pub agents_live: u32,
}

/// Compact row for `list_agents`.
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct AgentSummary {
    pub agent_id: String,
    pub status: String,
    pub last_update: u64,
    pub equity: f64,
    pub drawdown: f64,
}

/// Rolling window of recent records for one agent (v1, last N ingestions).
#[derive(CandidType, Deserialize, Clone, Debug, Default)]
pub struct AgentHistory {
    pub records: Vec<MetricsRecord>,
}

/// Bounded map key. StableBTreeMap keys must have a known max size.
/// Agent ids are validated to 1..=64 ASCII bytes before insert.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct AgentKey(pub String);

const AGENT_KEY_MAX: u32 = 64;
/// Generous Candid envelope for one MetricsRecord (ids + floats + status).
const METRICS_MAX: u32 = 1024;
/// Last N records × METRICS_MAX, plus vec overhead.
const HISTORY_MAX: u32 = 16_384;

impl Storable for AgentKey {
    const BOUND: Bound = Bound::Bounded {
        max_size: AGENT_KEY_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Borrowed(self.0.as_bytes())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(String::from_utf8(bytes.into_owned()).expect("agent key utf-8"))
    }
}

impl Storable for MetricsRecord {
    const BOUND: Bound = Bound::Bounded {
        max_size: METRICS_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).expect("encode MetricsRecord"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("decode MetricsRecord")
    }
}

impl Storable for AgentHistory {
    const BOUND: Bound = Bound::Bounded {
        max_size: HISTORY_MAX,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(candid::encode_one(self).expect("encode AgentHistory"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(bytes.as_ref()).expect("decode AgentHistory")
    }
}
