import { mockDataSource } from "./mock-source";
import type { SynthoDataSource } from "./source";

export type { SynthoDataSource } from "./source";

/**
 * Active data source for the whole application.
 *
 * Swap in a canister-backed implementation here once the Syntho canisters are
 * deployed; every page reads through this object only.
 */
export const data: SynthoDataSource = mockDataSource;

export const isMockData = data.kind === "mock";
