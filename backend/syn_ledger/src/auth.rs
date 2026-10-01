use candid::Principal;
use ic_cdk::api::{is_controller, msg_caller};

pub fn caller() -> Principal {
    msg_caller()
}

pub fn require_controller() -> Result<(), String> {
    let c = caller();
    if c == Principal::anonymous() {
        return Err("unauthorized: anonymous".into());
    }
    if is_controller(&c) {
        Ok(())
    } else {
        Err("unauthorized: caller is not a controller".into())
    }
}

pub fn require_minter(minter: Principal) -> Result<(), String> {
    let c = caller();
    if c == Principal::anonymous() {
        return Err("unauthorized: anonymous".into());
    }
    if c == minter {
        Ok(())
    } else {
        Err("unauthorized: caller is not the minter".into())
    }
}
