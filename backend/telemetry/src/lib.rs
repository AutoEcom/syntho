//! Syntho telemetry canister (v1).
//!
//! Stores the latest metrics per agent plus a short rolling history in stable
//! memory. Writes are restricted to canister controllers and an allow-list of
//! principals. Reads are public queries.
//!
//! Later versions will add a proper agent registry, cycles metering, and tighter
//! auth. Do not grow this canister into those concerns.

mod auth;
mod store;
mod types;
mod validate;

use candid::Principal;
use ic_cdk::{init, inspect_message, post_upgrade, query, update};
use types::{AgentSummary, MetricsRecord, PortfolioSnapshot};

/// Installer is seeded onto the writer allow-list. Controllers can always write.
#[init]
fn init() {
    auth::seed_installer();
}

#[post_upgrade]
fn post_upgrade() {
    // Stable maps are restored from MemoryManager; no heap migration in v1.
}

/// Drop unauthorized ingress before it is executed (saves cycles).
#[inspect_message]
fn inspect_message() {
    let method = ic_cdk::api::msg_method_name();
    match method.as_str() {
        "record_metrics" | "add_writer" | "remove_writer" => {
            if auth::is_authorized() {
                ic_cdk::api::accept_message();
            }
        }
        _ => ic_cdk::api::accept_message(),
    }
}

/// Ingest a metrics snapshot. `timestamp == 0` is replaced with IC time.
#[update]
fn record_metrics(agent_id: String, metrics: MetricsRecord) -> Result<(), String> {
    auth::require_authorized()?;
    validate::validate_record(&agent_id, &metrics)?;

    let mut metrics = metrics;
    if metrics.timestamp == 0 {
        metrics.timestamp = ic_cdk::api::time();
    }

    store::put_latest(&agent_id, metrics.clone());
    store::push_history(&agent_id, metrics);
    Ok(())
}

#[update]
fn add_writer(principal: Principal) -> Result<(), String> {
    auth::require_authorized()?;
    if principal == Principal::anonymous() {
        return Err("cannot allow-list the anonymous principal".into());
    }
    store::insert_writer(principal);
    Ok(())
}

#[update]
fn remove_writer(principal: Principal) -> Result<(), String> {
    auth::require_authorized()?;
    if !store::remove_writer(&principal) {
        return Err("principal is not on the writer allow-list".into());
    }
    Ok(())
}

#[query]
fn get_latest(agent_id: String) -> Option<MetricsRecord> {
    if validate::validate_agent_id(&agent_id).is_err() {
        return None;
    }
    store::get_latest(&agent_id)
}

#[query]
fn get_history(agent_id: String) -> Vec<MetricsRecord> {
    if validate::validate_agent_id(&agent_id).is_err() {
        return Vec::new();
    }
    store::get_history(&agent_id)
}

#[query]
fn list_agents() -> Vec<AgentSummary> {
    let mut agents: Vec<AgentSummary> = store::iter_latest()
        .into_iter()
        .map(|m| AgentSummary {
            agent_id: m.agent_id,
            status: m.status,
            last_update: m.timestamp,
            equity: m.equity,
            drawdown: m.drawdown,
        })
        .collect();
    agents.sort_by(|a, b| a.agent_id.cmp(&b.agent_id));
    agents
}

#[query]
fn get_portfolio_snapshot() -> PortfolioSnapshot {
    let records = store::iter_latest();
    let mut total_equity = 0.0;
    let mut total_pnl = 0.0;
    let mut current_drawdown = 0.0;
    let mut agents_live: u32 = 0;

    for record in &records {
        total_equity += record.equity;
        total_pnl += record.pnl_total;
        if record.drawdown < current_drawdown {
            current_drawdown = record.drawdown;
        }
        if record.status.eq_ignore_ascii_case("active")
            || record.status.eq_ignore_ascii_case("live")
        {
            agents_live += 1;
        }
    }

    PortfolioSnapshot {
        timestamp: ic_cdk::api::time(),
        total_equity,
        total_pnl,
        current_drawdown,
        agents_live,
    }
}

#[query]
fn list_writers() -> Vec<Principal> {
    store::list_writers()
}

ic_cdk::export_candid!();
