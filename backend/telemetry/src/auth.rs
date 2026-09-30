//! v1 access control for authenticated updates.
//!
//! Authorized callers:
//! 1. Canister controllers (covers the `dfx` identity that installed the canister).
//! 2. Principals stored in the stable writer allow-list (seeded with the installer
//!    on `init`).
//!
//! Later: replace this with an agent registry + tighter session auth. Do not treat
//! this allow-list as production identity.

use crate::store;
use candid::Principal;
use ic_cdk::api::{is_controller, msg_caller};

pub fn is_authorized() -> bool {
    let caller = msg_caller();
    if caller == Principal::anonymous() {
        return false;
    }
    is_controller(&caller) || store::is_writer(&caller)
}

pub fn require_authorized() -> Result<(), String> {
    if is_authorized() {
        Ok(())
    } else {
        Err("unauthorized: caller is not a controller or allow-listed writer".into())
    }
}

pub fn seed_installer() {
    let installer = msg_caller();
    if installer != Principal::anonymous() {
        store::insert_writer(installer);
    }
}
