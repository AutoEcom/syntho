//! Integer conversion for ICP → USD → SYN.
//!
//! Units:
//! - `icp_e8s`: ICP * 10^8
//! - `icp_usd_rate_e6`: USD per 1 ICP * 10^6  (e.g. $10.50 → 10_500_000)
//! - `usd_e6`: USD * 10^6
//! - `syn_e8s`: SYN * 10^8
//!
//! Identity: 1 SYN = $0.01, so SYN = USD * 100.
//!
//! ```text
//! usd_e6  = icp_e8s * rate_e6 / 10^8
//! syn_e8s = usd_e6 * 10^4          // *100 SYN/USD * 10^8 / 10^6
//!         = icp_e8s * rate_e6 / 10^4
//! ```
//!
//! All intermediates are u128. Truncation is toward zero (buyer never receives
//! a fraction of an e8s). Dust below 1 e8s SYN is not credited.

use crate::types::{E8S, HARD_CAP_E8S, SYN_USD_E6};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Quote {
    pub usd_e6: u64,
    pub syn_e8s: u64,
}

pub fn quote_syn(icp_e8s: u64, icp_usd_rate_e6: u64) -> Result<Quote, ()> {
    if icp_e8s == 0 || icp_usd_rate_e6 == 0 {
        return Err(());
    }
    let icp = u128::from(icp_e8s);
    let rate = u128::from(icp_usd_rate_e6);
    let usd_e6 = icp
        .checked_mul(rate)
        .ok_or(())?
        .checked_div(u128::from(E8S))
        .ok_or(())?;
    // syn_e8s = usd_e6 * 1e8 / syn_usd_e6  (= usd_e6 * 10000 when SYN_USD_E6 = 10_000)
    let syn_e8s = usd_e6
        .checked_mul(u128::from(E8S))
        .ok_or(())?
        .checked_div(u128::from(SYN_USD_E6))
        .ok_or(())?;
    if usd_e6 > u128::from(u64::MAX) || syn_e8s > u128::from(u64::MAX) {
        return Err(());
    }
    Ok(Quote {
        usd_e6: usd_e6 as u64,
        syn_e8s: syn_e8s as u64,
    })
}

pub fn remaining_mintable(total_sold_e8s: u64) -> u64 {
    HARD_CAP_E8S.saturating_sub(total_sold_e8s)
}

pub fn rate_e6_to_f64(rate_e6: u64) -> f64 {
    (rate_e6 as f64) / 1_000_000.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ten_icp_at_ten_usd() {
        // 10 ICP * $10 = $100 → 10_000 SYN
        let icp = 10 * E8S;
        let rate = 10_000_000; // $10.000000
        let q = quote_syn(icp, rate).unwrap();
        assert_eq!(q.usd_e6, 100_000_000);
        assert_eq!(q.syn_e8s, 10_000 * E8S);
    }

    #[test]
    fn one_icp_at_five_usd() {
        // $5 → 500 SYN (exactly the default min)
        let q = quote_syn(E8S, 5_000_000).unwrap();
        assert_eq!(q.usd_e6, 5_000_000);
        assert_eq!(q.syn_e8s, 500 * E8S);
    }

    #[test]
    fn rejects_zero() {
        assert!(quote_syn(0, 10_000_000).is_err());
        assert!(quote_syn(E8S, 0).is_err());
    }
}
