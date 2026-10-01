//! Inter-canister calls to syn_ledger (mint) and the ICP ICRC ledger.

use crate::types::{
    nat_from_u64, Account, Icrc1TransferArg, LedgerTransferResult, MintArg, SaleError,
    TransferFromArgs,
};
use candid::{Nat, Principal};
use ic_cdk::call::Call;

pub async fn mint_syn(
    ledger: Principal,
    to: Principal,
    amount_e8s: u64,
) -> Result<Nat, SaleError> {
    let arg = MintArg {
        to: Account::of(to),
        amount: nat_from_u64(amount_e8s),
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };
    let result: LedgerTransferResult = Call::unbounded_wait(ledger, "mint")
        .with_arg(arg)
        .await
        .map_err(|e| SaleError::MintFailed(format!("call failed: {e}")))?
        .candid()
        .map_err(|e| SaleError::MintFailed(format!("decode failed: {e}")))?;
    result.map_err(|e| SaleError::MintFailed(format!("{e:?}")))
}

pub async fn icp_transfer_from(
    icp_ledger: Principal,
    from: Principal,
    to: Principal,
    amount_e8s: u64,
) -> Result<Nat, SaleError> {
    let arg = TransferFromArgs {
        spender_subaccount: None,
        from: Account::of(from),
        to: Account::of(to),
        amount: nat_from_u64(amount_e8s),
        fee: None,
        memo: Some(b"SYN sale".to_vec()),
        created_at_time: Some(ic_cdk::api::time()),
    };
    let result: LedgerTransferResult = Call::unbounded_wait(icp_ledger, "icrc2_transfer_from")
        .with_arg(arg)
        .await
        .map_err(|e| SaleError::IcpTransferFailed(format!("call failed: {e}")))?
        .candid()
        .map_err(|e| SaleError::IcpTransferFailed(format!("decode failed: {e}")))?;
    result.map_err(|e| SaleError::IcpTransferFailed(format!("{e:?}")))
}

pub async fn icp_transfer(
    icp_ledger: Principal,
    to: Principal,
    amount_e8s: u64,
    fee_e8s: u64,
) -> Result<Nat, SaleError> {
    let arg = Icrc1TransferArg {
        from_subaccount: None,
        to: Account::of(to),
        amount: nat_from_u64(amount_e8s),
        fee: Some(nat_from_u64(fee_e8s)),
        memo: Some(b"SYN sale".to_vec()),
        created_at_time: Some(ic_cdk::api::time()),
    };
    let result: LedgerTransferResult = Call::unbounded_wait(icp_ledger, "icrc1_transfer")
        .with_arg(arg)
        .await
        .map_err(|e| SaleError::IcpTransferFailed(format!("call failed: {e}")))?
        .candid()
        .map_err(|e| SaleError::IcpTransferFailed(format!("decode failed: {e}")))?;
    result.map_err(|e| SaleError::IcpTransferFailed(format!("{e:?}")))
}

pub async fn refund_icp(
    icp_ledger: Principal,
    to: Principal,
    amount_e8s: u64,
    fee_e8s: u64,
) -> Result<Nat, SaleError> {
    icp_transfer(icp_ledger, to, amount_e8s, fee_e8s)
        .await
        .map_err(|e| match e {
            SaleError::IcpTransferFailed(msg) => SaleError::RefundFailed(msg),
            other => other,
        })
}
