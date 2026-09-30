/**
 * Internet Computer deployment configuration.
 *
 * Values are read from the environment so the same build can target a local
 * replica, a testnet, or mainnet. Nothing here performs network I/O.
 */

export type IcpNetwork = "local" | "ic";

export const ICP_NETWORK: IcpNetwork =
  (process.env.NEXT_PUBLIC_ICP_NETWORK as IcpNetwork | undefined) ?? "ic";

export const IC_HOST =
  process.env.NEXT_PUBLIC_IC_HOST ??
  (ICP_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://icp-api.io");

/** Internet Identity provider used for delegated, key-less authentication. */
export const II_PROVIDER =
  process.env.NEXT_PUBLIC_II_URL ??
  (ICP_NETWORK === "local"
    ? "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943"
    : "https://identity.ic0.app");

/**
 * Canister principals for the Syntho deployment. These are read at build time
 * and are intentionally optional: the UI runs against mock data until they are
 * populated.
 */
export const CANISTER_IDS = {
  orchestrator: process.env.NEXT_PUBLIC_CANISTER_ORCHESTRATOR ?? null,
  registry: process.env.NEXT_PUBLIC_CANISTER_REGISTRY ?? null,
  risk: process.env.NEXT_PUBLIC_CANISTER_RISK ?? null,
  treasury: process.env.NEXT_PUBLIC_CANISTER_TREASURY ?? null,
  metering: process.env.NEXT_PUBLIC_CANISTER_METERING ?? null,
} as const;

export type CanisterKey = keyof typeof CANISTER_IDS;

export const isCanisterConfigured = (key: CanisterKey): boolean =>
  Boolean(CANISTER_IDS[key]);

/** True once every canister the read surface needs has been configured. */
export const isDeploymentConfigured = (
  Object.keys(CANISTER_IDS) as CanisterKey[]
).every(isCanisterConfigured);
