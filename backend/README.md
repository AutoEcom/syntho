# Syntho — Internet Computer backend

Canisters:

| Canister | Package | Role |
|---|---|---|
| `telemetry` | `backend/telemetry` | Public metrics store (v1) |
| `syn_ledger` | `backend/syn_ledger` | ICRC-1 `$SYN` ledger, hard cap 250M |
| `syn_sale` | `backend/syn_sale` | Fixed-rate ICP → SYN mint (1 SYN = $0.01) |

USDC settlement, an ICP/USD oracle, and ICRC-2 on SYN are out of scope. The frontend purchase modal talks to these canisters when IDs are configured.

## Layout

```
syntho/
  dfx.json
  Cargo.toml
  backend/
    telemetry/
    syn_ledger/
      syn_ledger.did
      src/
    syn_sale/
      syn_sale.did
      src/
    scripts/
```

After a local deploy, canister IDs are written to `.dfx/local/canister_ids.json` and `.env.dfx`.

## Prerequisites

- [dfx](https://internetcomputer.org/docs/building-apps/developer-tools/dfx/) (stable). On Windows, install via WSL2.
- Rust with `wasm32-unknown-unknown`:

```bash
rustup target add wasm32-unknown-unknown
```

On Windows, dfx is not native: install [WSL2](https://learn.microsoft.com/windows/wsl/install), then dfx inside Linux, and run replica commands from the repo in WSL. Wasm can still be compiled on Windows:

```bash
cargo build --target wasm32-unknown-unknown -p telemetry --release
cargo build --target wasm32-unknown-unknown -p syn_ledger --release
cargo build --target wasm32-unknown-unknown -p syn_sale --release
```

## Telemetry (existing)

```bash
dfx start --clean
dfx deploy telemetry
dfx canister call telemetry record_metrics --argument-file backend/scripts/sample-helix.did
dfx canister call telemetry get_latest '("helix-04")'
```

See the original ingest / allow-list notes at the bottom of this file.

---

## $SYN ledger + sale

### What is implemented

**syn_ledger (ICRC-1)**

- Full ICRC-1 surface: name, symbol, decimals (8), fee, metadata, total supply, minting account, balance_of, transfer, supported_standards.
- Token: name `Syntho`, symbol `SYN`, default fee `0.0001 SYN` (10_000 e8s), configurable via `set_fee`.
- Only the **minter** principal may mint (`mint` or `icrc1_transfer` from the minting account). That principal is `syn_sale` after wiring.
- Lifetime minted e8s never exceeds `250_000_000 * 10^8`. Burns reduce `total_supply` but do not free cap.
- Balances, config, and `created_at_time` de-dup keys live in `ic-stable-structures`.
- ICRC-2 is **not** exposed. Memory id 10 is reserved for allowances.

**syn_sale**

- Admin-set ICP/USD rate in `rate_e6` (USD per ICP × 10^6). Example: `$12.34` → `12_340_000`.
- SYN price is fixed: **1 SYN = $0.01** (`syn_usd_e6 = 10_000`).
- Arithmetic is integer `u128` (see `backend/syn_sale/src/math.rs`). `get_icp_usd_rate` returns `float64` for display only.
- Default minimum purchase: **$5** (`5_000_000` e6), configurable.
- `buy(icp_e8s)` pulls ICP with ICRC-2 `transfer_from`, mints SYN to the caller, optionally forwards ICP to treasury.
- Pause / unpause, per-caller lock against double-mint, refund ICP if mint fails after the pull.

### Money math

```
usd_e6  = icp_e8s * icp_usd_rate_e6 / 100_000_000
syn_e8s = usd_e6 * 100_000_000 / 10_000     // 1 SYN = $0.01
        = icp_e8s * icp_usd_rate_e6 / 10_000
```

Truncation is toward zero. Amounts that would mint 0 e8s are rejected.

### Deploy locally

Start the replica (leave it running):

```bash
dfx start --clean
```

From the repo root, in another terminal:

```bash
dfx deploy syn_ledger --argument '(null)'
dfx deploy syn_sale --argument '(null)'
```

(`dfx.json` also sets `"init_arg": "(null)"`, so `dfx deploy syn_ledger` / `dfx deploy syn_sale` works without repeating the argument.)

Installer identity becomes ledger minter **and** sale admin until you re-point them.

### Wire minter + ledger + rate

```bash
SALE=$(dfx canister id syn_sale)
LEDGER=$(dfx canister id syn_ledger)

# Sale may mint on the ledger
dfx canister call syn_ledger set_minter "(principal \"$SALE\")"

# Sale talks to the SYN ledger
dfx canister call syn_sale set_ledger "(principal \"$LEDGER\")"

# ICP/USD, scaled by 1e6. $10.00 per ICP:
dfx canister call syn_sale set_icp_usd_rate '(10000000 : nat64)'

# Optional treasury (ICP proceeds). Omit to keep ICP on syn_sale.
# dfx canister call syn_sale set_treasury "(opt principal \"<treasury>\")"

dfx canister call syn_ledger minter
dfx canister call syn_sale get_sale_info
```

Set the ICP ledger (mainnet id below; locally use the ledger you installed):

```bash
# Mainnet ICP ledger
dfx canister call syn_sale set_icp_ledger '(principal "ryjl3-tyaaa-aaaaa-aaaba-cai")'
```

Local ICP with ICRC-2 (needed for `buy`):

```bash
dfx extension install nns   # once
dfx nns install             # deploys nns-ledger among others
dfx canister call syn_sale set_icp_ledger "(principal \"$(dfx canister id nns-ledger)\")"
```

Without an ICP ledger, admin queries and `mint` (if you are still the minter) still work; `buy` returns `IcpLedgerNotSet`.

### Example: mint as minter (no ICP)

Useful before wiring sale, while the installer is still minter:

```bash
BUYER=$(dfx identity get-principal)
dfx canister call syn_ledger mint "(record {
  to = record { owner = principal \"$BUYER\"; subaccount = null };
  amount = 100_000_000 : nat;
  memo = null;
  created_at_time = null;
})"
# 1 SYN
dfx canister call syn_ledger icrc1_balance_of "(record { owner = principal \"$BUYER\"; subaccount = null })"
```

After `set_minter` to `syn_sale`, that call must come from the sale canister (`buy`), not from your identity.

### Example purchase flow (buyer)

1. Admin has set rate, ledger, ICP ledger; sale is not paused.
2. Buyer approves the sale canister as spender on the **ICP** ledger for `icp_e8s + fee` (fee is 10_000 e8s by default).
3. Buyer calls `syn_sale.buy(icp_e8s)`.
4. Sale pulls ICP (`icrc2_transfer_from`), mints SYN to the buyer, records the purchase, and forwards ICP to treasury if set.
5. Buyer’s SYN balance is immediately readable on `syn_ledger`.

```bash
SALE=$(dfx canister id syn_sale)
BUYER=$(dfx identity get-principal)
# 1 ICP, assuming rate $10 → $10 → 1_000 SYN. Raise ICP if min is $5 and rate is lower.
ICP_E8S=100000000

dfx canister call nns-ledger icrc2_approve "(record {
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
  amount = 100010000 : nat;
  expected_allowance = null;
  expires_at = null;
  spender = record { owner = principal \"$SALE\"; subaccount = null };
})"

dfx canister call syn_sale buy "($ICP_E8S : nat)"
dfx canister call syn_ledger icrc1_balance_of "(record { owner = principal \"$BUYER\"; subaccount = null })"
dfx canister call syn_sale purchases_of "(principal \"$BUYER\")"
```

Minimum purchase is $5 equivalent at the current rate. Pause:

```bash
dfx canister call syn_sale set_paused '(true)'
dfx canister call syn_sale set_paused '(false)'
```

If a buy traps after ICP is pulled, the caller lock may stick. Admin:

```bash
dfx canister call syn_sale admin_clear_lock "(principal \"$BUYER\")"
```

### Controllers

Canister **controllers** (dfx: `dfx canister update-settings`) can always call ledger `set_minter` / `set_fee` and sale admin methods. Sale also stores an explicit `admin` principal (seeded with the installer).

---

## Telemetry ingest (unchanged)

```bash
dfx deploy telemetry
dfx canister call telemetry record_metrics --argument-file backend/scripts/sample-helix.did
dfx canister call telemetry record_metrics --argument-file backend/scripts/sample-cadence.did
dfx canister call telemetry get_latest '("helix-04")'
dfx canister call telemetry list_writers
```

A `timestamp` of `0` is replaced with IC time. Unauthorized `record_metrics` returns `variant { Err = "unauthorized: ..." }`.
