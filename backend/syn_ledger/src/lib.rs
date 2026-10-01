//! ICRC-1 $SYN ledger.
//!
//! Minting is restricted to the configured minter principal (`syn_sale` in
//! production). Lifetime minted supply cannot exceed 250_000_000 SYN.
//! ICRC-2 is not exposed; allowance memory id 10 is reserved for it.

mod auth;
mod store;
mod types;

use candid::{Nat, Principal};
use ic_cdk::{init, inspect_message, post_upgrade, query, update};
use types::{
    nat_from_u64, nat_to_u64, Account, AccountKey, DedupKey, LedgerConfig, LedgerInit, MintArg,
    StandardRecord, TransferArg, TransferError, TransferResult, Value, DEFAULT_FEE_E8S, DECIMALS,
    HARD_CAP_E8S, PERMITTED_DRIFT_NS, TOKEN_NAME, TOKEN_SYMBOL, TX_WINDOW_NS,
};

#[init]
fn init(arg: Option<LedgerInit>) {
    apply_init(arg, true);
}

#[post_upgrade]
fn post_upgrade(arg: Option<LedgerInit>) {
    // Maps restore from MemoryManager. Optional arg may rotate minter / fee.
    apply_init(arg, false);
}

fn apply_init(arg: Option<LedgerInit>, first_install: bool) {
    let installer = auth::caller();
    let arg = arg.unwrap_or_default();
    if first_install {
        let minter = arg.minter.filter(|p| *p != Principal::anonymous())
            .unwrap_or(installer);
        let fee_e8s = arg.fee_e8s.unwrap_or(DEFAULT_FEE_E8S);
        store::set_config(LedgerConfig {
            minter,
            fee_e8s,
            total_supply_e8s: 0,
            total_minted_e8s: 0,
            next_tx_index: 0,
        });
    } else if let Some(minter) = arg.minter.filter(|p| *p != Principal::anonymous()) {
        store::update_config(|cfg| cfg.minter = minter);
        if let Some(fee) = arg.fee_e8s {
            store::update_config(|cfg| cfg.fee_e8s = fee);
        }
    } else if let Some(fee) = arg.fee_e8s {
        store::update_config(|cfg| cfg.fee_e8s = fee);
    }
}

#[inspect_message]
fn inspect_message() {
    let method = ic_cdk::api::msg_method_name();
    match method.as_str() {
        "icrc1_transfer" | "mint" | "set_minter" | "set_fee" => {
            if auth::caller() != Principal::anonymous() {
                ic_cdk::api::accept_message();
            }
        }
        _ => ic_cdk::api::accept_message(),
    }
}

#[query]
fn icrc1_name() -> String {
    TOKEN_NAME.to_string()
}

#[query]
fn icrc1_symbol() -> String {
    TOKEN_SYMBOL.to_string()
}

#[query]
fn icrc1_decimals() -> u8 {
    DECIMALS
}

#[query]
fn icrc1_fee() -> Nat {
    nat_from_u64(store::config().fee_e8s)
}

#[query]
fn icrc1_metadata() -> Vec<(String, Value)> {
    let fee = store::config().fee_e8s;
    vec![
        ("icrc1:decimals".into(), Value::Nat(Nat::from(DECIMALS))),
        ("icrc1:name".into(), Value::Text(TOKEN_NAME.into())),
        ("icrc1:symbol".into(), Value::Text(TOKEN_SYMBOL.into())),
        ("icrc1:fee".into(), Value::Nat(nat_from_u64(fee))),
        (
            "icrc1:max_supply".into(),
            Value::Nat(nat_from_u64(HARD_CAP_E8S)),
        ),
    ]
}

#[query]
fn icrc1_total_supply() -> Nat {
    nat_from_u64(store::config().total_supply_e8s)
}

#[query]
fn icrc1_minting_account() -> Option<Account> {
    Some(Account::new(store::config().minter))
}

#[query]
fn icrc1_balance_of(account: Account) -> Nat {
    match AccountKey::from_account(&account) {
        Ok(key) => nat_from_u64(store::balance_of(&key)),
        Err(_) => Nat::from(0u64),
    }
}

#[query]
fn icrc1_supported_standards() -> Vec<StandardRecord> {
    vec![StandardRecord {
        name: "ICRC-1".into(),
        url: "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1".into(),
    }]
}

#[query]
fn minter() -> Principal {
    store::config().minter
}

#[query]
fn hard_cap() -> Nat {
    nat_from_u64(HARD_CAP_E8S)
}

#[query]
fn total_minted() -> Nat {
    nat_from_u64(store::config().total_minted_e8s)
}

#[query]
fn remaining_mintable() -> Nat {
    let minted = store::config().total_minted_e8s;
    nat_from_u64(HARD_CAP_E8S.saturating_sub(minted))
}

#[update]
fn set_minter(new_minter: Principal) -> Result<(), String> {
    auth::require_controller()?;
    if new_minter == Principal::anonymous() {
        return Err("minter cannot be anonymous".into());
    }
    store::update_config(|cfg| cfg.minter = new_minter);
    Ok(())
}

#[update]
fn set_fee(fee_e8s: u64) -> Result<(), String> {
    auth::require_controller()?;
    store::update_config(|cfg| cfg.fee_e8s = fee_e8s);
    Ok(())
}

/// Mint `amount` e8s to `to`. Only the minter principal may call this.
/// Fee is 0. Counts toward the 250M hard cap.
#[update]
fn mint(arg: MintArg) -> TransferResult {
    let cfg = store::config();
    if let Err(msg) = auth::require_minter(cfg.minter) {
        return Err(generic(2, msg));
    }
    let amount = nat_to_u64(&arg.amount)?;
    validate_memo(arg.memo.as_deref())?;
    mint_internal(arg.to, amount, arg.memo, arg.created_at_time)
}

#[update]
fn icrc1_transfer(arg: TransferArg) -> TransferResult {
    let caller = auth::caller();
    if caller == Principal::anonymous() {
        return Err(generic(2, "anonymous transfers are rejected"));
    }

    let from = Account {
        owner: caller,
        subaccount: arg.from_subaccount.clone(),
    };
    let from_key = AccountKey::from_account(&from).map_err(|m| generic(3, m))?;
    let to_key = AccountKey::from_account(&arg.to).map_err(|m| generic(3, m))?;
    let amount = nat_to_u64(&arg.amount)?;
    validate_memo(arg.memo.as_deref())?;

    let cfg = store::config();
    let minting = AccountKey::minting(cfg.minter);
    let is_mint = from_key == minting;
    let is_burn = to_key == minting;

    if is_mint {
        if caller != cfg.minter {
            return Err(generic(2, "only the minter can mint"));
        }
        let fee = match &arg.fee {
            None => 0,
            Some(n) => nat_to_u64(n)?,
        };
        if fee != 0 {
            return Err(TransferError::BadFee {
                expected_fee: Nat::from(0u64),
            });
        }
        return mint_internal(arg.to, amount, arg.memo, arg.created_at_time);
    }

    let expected_fee = if is_burn { 0 } else { cfg.fee_e8s };
    let fee = match &arg.fee {
        None => expected_fee,
        Some(n) => {
            let f = nat_to_u64(n)?;
            if f != expected_fee {
                return Err(TransferError::BadFee {
                    expected_fee: nat_from_u64(expected_fee),
                });
            }
            f
        }
    };

    if is_burn && amount == 0 {
        return Err(TransferError::BadBurn {
            min_burn_amount: Nat::from(1u64),
        });
    }

    if let Some(created) = arg.created_at_time {
        check_created_at(caller, created, arg.memo.as_deref())?;
    }

    if from_key == to_key {
        return Err(generic(4, "self-transfer is not allowed"));
    }

    let debit = amount.checked_add(fee).ok_or_else(|| overflow())?;
    let from_bal = store::balance_of(&from_key);
    if from_bal < debit {
        return Err(TransferError::InsufficientFunds {
            balance: nat_from_u64(from_bal),
        });
    }

    store::set_balance(from_key.clone(), from_bal - debit);

    if is_burn {
        store::update_config(|c| {
            c.total_supply_e8s = c.total_supply_e8s.saturating_sub(amount);
        });
    } else {
        let to_bal = store::balance_of(&to_key);
        store::set_balance(to_key, to_bal.saturating_add(amount));
        if fee > 0 {
            let fee_key = minting;
            let fee_bal = store::balance_of(&fee_key);
            store::set_balance(fee_key, fee_bal.saturating_add(fee));
        }
    }

    Ok(commit_tx(caller, arg.created_at_time, arg.memo.as_deref()))
}

fn mint_internal(
    to: Account,
    amount: u64,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
) -> TransferResult {
    if amount == 0 {
        return Err(generic(4, "mint amount must be > 0"));
    }
    let to_key = AccountKey::from_account(&to).map_err(|m| generic(3, m))?;
    let caller = auth::caller();
    if let Some(created) = created_at_time {
        check_created_at(caller, created, memo.as_deref())?;
    }

    let cfg = store::config();
    let minted = cfg
        .total_minted_e8s
        .checked_add(amount)
        .ok_or_else(overflow)?;
    if minted > HARD_CAP_E8S {
        return Err(generic(
            5,
            format!(
                "hard cap exceeded: remaining {} e8s",
                HARD_CAP_E8S.saturating_sub(cfg.total_minted_e8s)
            ),
        ));
    }

    let to_bal = store::balance_of(&to_key);
    store::set_balance(to_key, to_bal.saturating_add(amount));
    store::update_config(|c| {
        c.total_minted_e8s = minted;
        c.total_supply_e8s = c.total_supply_e8s.saturating_add(amount);
    });

    Ok(commit_tx(caller, created_at_time, memo.as_deref()))
}

fn check_created_at(
    caller: Principal,
    created: u64,
    memo: Option<&[u8]>,
) -> Result<(), TransferError> {
    validate_memo(memo)?;
    let now = ic_cdk::api::time();
    if created > now.saturating_add(PERMITTED_DRIFT_NS) {
        return Err(TransferError::CreatedInFuture { ledger_time: now });
    }
    if now.saturating_sub(created) > TX_WINDOW_NS.saturating_add(PERMITTED_DRIFT_NS) {
        return Err(TransferError::TooOld);
    }
    let key = dedup_key(caller, created, memo);
    if let Some(prev) = store::get_dedup(&key) {
        return Err(TransferError::Duplicate {
            duplicate_of: nat_from_u64(prev),
        });
    }
    Ok(())
}

fn commit_tx(caller: Principal, created_at_time: Option<u64>, memo: Option<&[u8]>) -> Nat {
    let mut index = 0u64;
    store::update_config(|c| {
        index = c.next_tx_index;
        c.next_tx_index = c.next_tx_index.saturating_add(1);
    });
    if let Some(created) = created_at_time {
        store::put_dedup(dedup_key(caller, created, memo), index);
    }
    nat_from_u64(index)
}

fn dedup_key(caller: Principal, created: u64, memo: Option<&[u8]>) -> DedupKey {
    let p = caller.as_slice();
    let mut buf = Vec::with_capacity(1 + p.len() + 8 + 1 + 32);
    buf.push(p.len() as u8);
    buf.extend_from_slice(p);
    buf.extend_from_slice(&created.to_le_bytes());
    match memo {
        Some(m) => {
            buf.push(m.len() as u8);
            buf.extend_from_slice(m);
        }
        None => buf.push(0),
    }
    DedupKey(buf)
}

fn validate_memo(memo: Option<&[u8]>) -> Result<(), TransferError> {
    if let Some(m) = memo {
        if m.len() > types::MAX_MEMO_LEN {
            return Err(generic(3, "memo exceeds 32 bytes"));
        }
    }
    Ok(())
}

fn generic(code: u64, message: impl Into<String>) -> TransferError {
    TransferError::GenericError {
        error_code: Nat::from(code),
        message: message.into(),
    }
}

fn overflow() -> TransferError {
    generic(6, "arithmetic overflow")
}

ic_cdk::export_candid!();
