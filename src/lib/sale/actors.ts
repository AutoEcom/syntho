import { Actor, type Identity } from "@dfinity/agent";
import { createIcpAgent } from "@/lib/icp/agent";
import {
  icrcLedgerIdlFactory,
  synLedgerIdlFactory,
  synSaleIdlFactory,
} from "./idl";
import type {
  IcrcLedgerService,
  SynLedgerService,
  SynSaleService,
} from "./types";

type Factory = Parameters<typeof Actor.createActor>[0];

export async function saleActors(identity?: Identity) {
  const agent = await createIcpAgent(identity);
  return {
    agent,
    sale: (canisterId: string) =>
      Actor.createActor<SynSaleService>(
        synSaleIdlFactory as unknown as Factory,
        { agent, canisterId }
      ),
    synLedger: (canisterId: string) =>
      Actor.createActor<SynLedgerService>(
        synLedgerIdlFactory as unknown as Factory,
        { agent, canisterId }
      ),
    icpLedger: (canisterId: string) =>
      Actor.createActor<IcrcLedgerService>(
        icrcLedgerIdlFactory as unknown as Factory,
        { agent, canisterId }
      ),
  };
}
