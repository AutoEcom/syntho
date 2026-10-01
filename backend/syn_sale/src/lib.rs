//! Fixed-rate ICP → $SYN sale.
//!
//! `buy(icp_e8s)` pulls ICP via ICRC-2 `transfer_from`, then mints SYN to the
//! caller. Admin sets the ICP/USD rate; SYN is always $0.01.

mod auth;
mod icp;
mod math;
mod store;
mod types;

use candid::{Nat, Principal};
use ic_cdk::{init, inspect_message, post_upgrade, query, update};
use types::{
    nat_to_u64, AdminResult, BuyResult, Purchase, SaleConfig, SaleError, SaleInfo, SaleInit,
    DEFAULT_ICP_FEE_E8S, DEFAULT_MIN_USD_E6, HARD_CAP_E8S, SYN_USD_E6, TOKEN_SYMBOL,
};

#[init]
fn init(arg: Option<SaleInit>) {
    apply_init(arg, true);
}

#[post_upgrade]
fn post_upgrade(arg: Option<SaleInit>) {
    apply_init(arg, false);
}

fn apply_init(arg: Option<SaleInit>, first_install: bool) {
    let installer = auth::caller();
    let arg = arg.unwrap_or_default();
    if first_install {
        let admin = arg
            .admin
            .filter(|p| *p != Principal::anonymous())
            .unwrap_or(installer);
        store::set_config(SaleConfig {
            admin,
            ledger: arg.ledger.filter(|p| *p != Principal::anonymous()),
            icp_ledger: arg.icp_ledger.filter(|p| *p != Principal::anonymous()),
            treasury: arg.treasury.filter(|p| *p != Principal::anonymous()),
            icp_usd_rate_e6: arg.icp_usd_rate_e6.unwrap_or(0),
            min_purchase_usd_e6: arg.min_purchase_usd_e6.unwrap_or(DEFAULT_MIN_USD_E6),
            icp_fee_e8s: DEFAULT_ICP_FEE_E8S,
            paused: false,
            total_sold_e8s: 0,
            next_purchase_id: 0,
        });
    } else {
        store::update_config(|cfg| {
            if let Some(p) = arg.admin.filter(|p| *p != Principal::anonymous()) {
                cfg.admin = p;
            }
            if let Some(p) = arg.ledger {
                cfg.ledger = Some(p).filter(|x| *x != Principal::anonymous());
            }
            if let Some(p) = arg.icp_ledger {
                cfg.icp_ledger = Some(p).filter(|x| *x != Principal::anonymous());
            }
            if let Some(p) = arg.treasury {
                cfg.treasury = Some(p).filter(|x| *x != Principal::anonymous());
            }
            if let Some(r) = arg.icp_usd_rate_e6 {
                cfg.icp_usd_rate_e6 = r;
            }
            if let Some(m) = arg.min_purchase_usd_e6 {
                cfg.min_purchase_usd_e6 = m;
            }
        });
    }
}

#[inspect_message]
fn inspect_message() {
    let method = ic_cdk::api::msg_method_name();
    match method.as_str() {
        "buy"
        | "set_icp_usd_rate"
        | "set_min_purchase_usd"
        | "set_treasury"
        | "set_paused"
        | "set_ledger"
        | "set_icp_ledger"
        | "set_admin"
        | "set_icp_fee"
        | "admin_clear_lock" => {
            if auth::caller() != Principal::anonymous() {
                ic_cdk::api::accept_message();
            }
        }
        _ => ic_cdk::api::accept_message(),
    }
}

#[query]
fn get_sale_info() -> SaleInfo {
    let cfg = store::config();
    SaleInfo {
        symbol: TOKEN_SYMBOL.into(),
        decimals: 8,
        syn_usd_e6: SYN_USD_E6,
        icp_usd_rate_e6: cfg.icp_usd_rate_e6,
        min_purchase_usd_e6: cfg.min_purchase_usd_e6,
        paused: cfg.paused,
        total_sold_e8s: cfg.total_sold_e8s,
        remaining_mintable_e8s: math::remaining_mintable(cfg.total_sold_e8s),
        hard_cap_e8s: HARD_CAP_E8S,
        treasury: cfg.treasury,
        ledger: cfg.ledger,
        icp_ledger: cfg.icp_ledger,
    }
}

#[query]
fn get_icp_usd_rate() -> f64 {
    math::rate_e6_to_f64(store::config().icp_usd_rate_e6)
}

#[query]
fn get_purchase(id: u64) -> Option<Purchase> {
    store::get_purchase(id)
}

#[query]
fn purchases_of(buyer: Principal) -> Vec<Purchase> {
    store::purchases_of(buyer)
}

#[update]
fn set_icp_usd_rate(rate_e6: u64) -> AdminResult {
    auth::require_admin()?;
    if rate_e6 == 0 {
        return Err(SaleError::InvalidAmount("rate must be > 0".into()));
    }
    store::update_config(|c| c.icp_usd_rate_e6 = rate_e6);
    Ok(())
}

#[update]
fn set_min_purchase_usd(min_usd_e6: u64) -> AdminResult {
    auth::require_admin()?;
    store::update_config(|c| c.min_purchase_usd_e6 = min_usd_e6);
    Ok(())
}

#[update]
fn set_treasury(treasury: Option<Principal>) -> AdminResult {
    auth::require_admin()?;
    if matches!(treasury, Some(p) if p == Principal::anonymous()) {
        return Err(SaleError::InvalidAmount("treasury cannot be anonymous".into()));
    }
    store::update_config(|c| c.treasury = treasury);
    Ok(())
}

#[update]
fn set_paused(paused: bool) -> AdminResult {
    auth::require_admin()?;
    store::update_config(|c| c.paused = paused);
    Ok(())
}

#[update]
fn set_ledger(ledger: Principal) -> AdminResult {
    auth::require_admin()?;
    if ledger == Principal::anonymous() {
        return Err(SaleError::InvalidAmount("ledger cannot be anonymous".into()));
    }
    store::update_config(|c| c.ledger = Some(ledger));
    Ok(())
}

#[update]
fn set_icp_ledger(icp_ledger: Principal) -> AdminResult {
    auth::require_admin()?;
    if icp_ledger == Principal::anonymous() {
        return Err(SaleError::InvalidAmount(
            "icp ledger cannot be anonymous".into(),
        ));
    }
    store::update_config(|c| c.icp_ledger = Some(icp_ledger));
    Ok(())
}

#[update]
fn set_admin(admin: Principal) -> AdminResult {
    auth::require_admin()?;
    if admin == Principal::anonymous() {
        return Err(SaleError::Unauthorized);
    }
    store::update_config(|c| c.admin = admin);
    Ok(())
}

#[update]
fn set_icp_fee(fee_e8s: u64) -> AdminResult {
    auth::require_admin()?;
    store::update_config(|c| c.icp_fee_e8s = fee_e8s);
    Ok(())
}

#[update]
fn admin_clear_lock(buyer: Principal) -> AdminResult {
    auth::require_admin()?;
    store::unlock(&buyer);
    Ok(())
}

/// Pull `icp_e8s` from the caller via ICRC-2 and mint SYN at 1 SYN = $0.01.
///
/// Prerequisite: caller has `icrc2_approve`d this canister on the ICP ledger
/// for at least `icp_e8s + icp_fee`.
#[update]
async fn buy(icp_e8s: Nat) -> BuyResult {
    let buyer = auth::caller();
    if buyer == Principal::anonymous() {
        return Err(SaleError::Unauthorized);
    }

    let amount = nat_to_u64(&icp_e8s)?;
    if amount == 0 {
        return Err(SaleError::InvalidAmount("icp amount must be > 0".into()));
    }

    let cfg = store::config();
    if cfg.paused {
        return Err(SaleError::Paused);
    }
    if cfg.icp_usd_rate_e6 == 0 {
        return Err(SaleError::RateNotSet);
    }
    let ledger = cfg.ledger.ok_or(SaleError::LedgerNotSet)?;
    let icp_ledger = cfg.icp_ledger.ok_or(SaleError::IcpLedgerNotSet)?;

    let quote = math::quote_syn(amount, cfg.icp_usd_rate_e6)
        .map_err(|_| SaleError::ArithmeticOverflow)?;
    if quote.syn_e8s == 0 {
        return Err(SaleError::InvalidAmount(
            "ICP amount too small to mint 1 e8s of SYN".into(),
        ));
    }
    if quote.usd_e6 < cfg.min_purchase_usd_e6 {
        return Err(SaleError::AmountTooSmall {
            min_usd_e6: cfg.min_purchase_usd_e6,
            provided_usd_e6: quote.usd_e6,
        });
    }
    let remaining = math::remaining_mintable(cfg.total_sold_e8s);
    if quote.syn_e8s > remaining {
        return Err(SaleError::CapExceeded {
            remaining_e8s: remaining,
            requested_e8s: quote.syn_e8s,
        });
    }

    if !store::lock(buyer) {
        return Err(SaleError::PurchaseInProgress);
    }

    let result = execute_buy(
        buyer,
        ledger,
        icp_ledger,
        amount,
        quote,
        cfg.icp_fee_e8s,
        cfg.icp_usd_rate_e6,
        cfg.treasury,
    )
    .await;
    store::unlock(&buyer);
    result
}

async fn execute_buy(
    buyer: Principal,
    ledger: Principal,
    icp_ledger: Principal,
    icp_e8s: u64,
    quote: math::Quote,
    icp_fee_e8s: u64,
    rate_e6: u64,
    treasury: Option<Principal>,
) -> BuyResult {
    let sale = ic_cdk::api::canister_self();

    icp::icp_transfer_from(icp_ledger, buyer, sale, icp_e8s).await?;

    let mint_tx = match icp::mint_syn(ledger, buyer, quote.syn_e8s).await {
        Ok(tx) => tx,
        Err(e) => {
            let refund_amount = icp_e8s.saturating_sub(icp_fee_e8s);
            if refund_amount > 0 {
                icp::refund_icp(icp_ledger, buyer, refund_amount, icp_fee_e8s).await?;
            }
            return Err(e);
        }
    };

    if let Some(treasury) = treasury {
        if treasury != sale {
            let forward = icp_e8s.saturating_sub(icp_fee_e8s);
            if forward > 0 {
                let _ = icp::icp_transfer(icp_ledger, treasury, forward, icp_fee_e8s).await;
            }
        }
    }

    let mut id = 0u64;
    store::update_config(|c| {
        id = c.next_purchase_id;
        c.next_purchase_id = c.next_purchase_id.saturating_add(1);
        c.total_sold_e8s = c.total_sold_e8s.saturating_add(quote.syn_e8s);
    });

    let purchase = Purchase {
        id,
        buyer,
        icp_e8s,
        icp_usd_rate_e6: rate_e6,
        usd_e6: quote.usd_e6,
        syn_e8s: quote.syn_e8s,
        timestamp_ns: ic_cdk::api::time(),
        mint_tx,
    };
    store::insert_purchase(purchase.clone());
    Ok(purchase)
}

ic_cdk::export_candid!();
