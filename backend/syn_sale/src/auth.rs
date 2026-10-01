use crate::store;
use candid::Principal;
use ic_cdk::api::{is_controller, msg_caller};

pub fn caller() -> Principal {
    msg_caller()
}

pub fn is_admin() -> bool {
    let c = caller();
    if c == Principal::anonymous() {
        return false;
    }
    is_controller(&c) || c == store::config().admin
}

pub fn require_admin() -> Result<(), crate::types::SaleError> {
    if is_admin() {
        Ok(())
    } else {
        Err(crate::types::SaleError::Unauthorized)
    }
}
