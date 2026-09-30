# Syntho — Internet Computer backend

First canister: **telemetry**. It stores latest agent metrics in stable memory,
exposes public queries, and accepts authenticated updates from canister
controllers plus a principal allow-list.

This is v1. A later agent registry, cycles metering, and tighter auth will live
in their own canisters.

## Layout

```
syntho/
  dfx.json                  # canister definitions (dfx)
  Cargo.toml                # Rust workspace
  backend/
    telemetry/
      Cargo.toml
      telemetry.did         # Candid interface
      src/                  # ic-cdk implementation
    scripts/
      sample-helix.did      # mock ingest argument
      sample-cadence.did
```

After a local deploy, canister IDs are written to:

- `.dfx/local/canister_ids.json`
- `.env.dfx` (`CANISTER_ID_TELEMETRY=...`)

```bash
dfx canister id telemetry
```

## Prerequisites

- [dfx](https://internetcomputer.org/docs/building-apps/developer-tools/dfx/) (stable). On Windows, install via WSL2.
- Rust with `wasm32-unknown-unknown`:

```bash
rustup target add wasm32-unknown-unknown
```

Optional: [`icp` CLI](https://www.npmjs.com/package/@icp-sdk/icp-cli) (`npm i -g @icp-sdk/icp-cli`) — still uses a local replica under the hood (Docker/WSL on Windows). `dfx.json` is the source of truth for this repo.

On Windows, dfx is not native: install [WSL2](https://learn.microsoft.com/windows/wsl/install), then dfx inside the Linux distro, and run the replica commands from the repo in WSL. Wasm can still be compiled on Windows:

```bash
cargo build --target wasm32-unknown-unknown -p telemetry --release
```

## Run locally

Start the replica (leave this running):

```bash
dfx start --clean
```

In another terminal, from the repo root:

```bash
dfx deploy telemetry
dfx canister id telemetry
```

The installing identity is seeded on the writer allow-list. Controllers can always call updates.

### Ingest mock metrics

```bash
dfx canister call telemetry record_metrics --argument-file backend/scripts/sample-helix.did
dfx canister call telemetry record_metrics --argument-file backend/scripts/sample-cadence.did
```

A `timestamp` of `0` is replaced with IC time.

### Read them back

```bash
dfx canister call telemetry get_latest '("helix-04")'
dfx canister call telemetry get_history '("helix-04")'
dfx canister call telemetry list_agents
dfx canister call telemetry get_portfolio_snapshot
dfx canister call telemetry list_writers
```

### Allow-list (optional)

```bash
dfx identity get-principal
dfx canister call telemetry add_writer '(principal "<principal>")'
dfx canister call telemetry remove_writer '(principal "<principal>")'
```

Unauthorized `record_metrics` calls return `variant { Err = "unauthorized: ..." }`.

## Compile without a replica

From the repo root:

```bash
cargo build --target wasm32-unknown-unknown -p telemetry --release
```
