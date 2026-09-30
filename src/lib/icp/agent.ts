import { HttpAgent, type Identity } from "@dfinity/agent";
import { IC_HOST, ICP_NETWORK } from "./config";

/**
 * HttpAgent factory.
 *
 * Pass `identity` from `useAuth()` once write calls are wired. Until then
 * callers may omit it and receive an anonymous agent, which is sufficient
 * for public query calls.
 */
export async function createIcpAgent(identity?: Identity): Promise<HttpAgent> {
  const agent = await HttpAgent.create({
    host: IC_HOST,
    identity,
    shouldFetchRootKey: ICP_NETWORK === "local",
  });

  return agent;
}

/**
 * Placeholder for typed actor construction.
 *
 * Once Candid interfaces are generated (`dfx generate`), this becomes:
 *
 *   return Actor.createActor<T>(idlFactory, { agent, canisterId });
 */
export async function createActor(): Promise<never> {
  throw new Error(
    "Syntho canister actors are not wired up yet. The UI reads through src/lib/data."
  );
}
