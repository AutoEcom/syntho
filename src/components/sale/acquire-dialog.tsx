"use client";

import { XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/icp/auth";
import { formatPrincipalShort } from "@/lib/icp/auth/format";
import { truncatePrincipal } from "@/lib/format";
import {
  DEFAULT_ICP_FEE_E8S,
  DEFAULT_MIN_USD_E6,
  FALLBACK_ICP_USD_RATE_E6,
  QUICK_USD_AMOUNTS,
  SALE_CANISTER_IDS,
  SYN_USD_E6,
  isSaleConfigured,
} from "@/lib/sale/config";
import {
  e6ToUsd,
  formatE8s,
  parseUsdInput,
  quoteFromUsd,
  usdToE6,
} from "@/lib/sale/math";
import {
  executePurchase,
  fetchIcpBalance,
  fetchIcpFee,
  fetchSaleSnapshot,
  fetchSynBalance,
  SaleNotConfiguredError,
} from "@/lib/sale/purchase";
import { formatUnknown } from "@/lib/sale/errors";
import { cn } from "@/lib/utils";
import type { PurchaseCandid } from "@/lib/sale/types";

type Phase = "form" | "success";
type Busy = null | "connect" | "approve" | "buy";

interface Snapshot {
  synUsdE6: bigint;
  icpUsdRateE6: bigint;
  minUsdE6: bigint;
  paused: boolean;
  remainingE8s: bigint;
  treasury: string | null;
  icpLedger: string | null;
  synLedger: string | null;
  saleId: string | null;
  live: boolean;
}

const FALLBACK_SNAPSHOT: Snapshot = {
  synUsdE6: SYN_USD_E6,
  icpUsdRateE6: FALLBACK_ICP_USD_RATE_E6,
  minUsdE6: DEFAULT_MIN_USD_E6,
  paused: false,
  remainingE8s: BigInt(0),
  treasury: null,
  icpLedger: SALE_CANISTER_IDS.icpLedger,
  synLedger: SALE_CANISTER_IDS.synLedger,
  saleId: SALE_CANISTER_IDS.synSale,
  live: false,
};

export function AcquireSynDialog({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      {note ? (
        <p className="metric mt-3 text-[11px] text-muted-foreground">{note}</p>
      ) : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content
          aria-describedby="acquire-syn-desc"
          className="fixed top-1/2 left-1/2 z-[60] flex max-h-[min(92dvh,44rem)] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-brand/20 bg-surface shadow-elevated outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          {open ? (
            <AcquirePanel onClose={() => setOpen(false)} />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AcquirePanel({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, isLoading, principal, principalText, identity, login } =
    useAuth();

  const [phase, setPhase] = useState<Phase>("form");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(FALLBACK_SNAPSHOT);
  const [infoLoading, setInfoLoading] = useState(true);
  const [icpBalance, setIcpBalance] = useState<bigint | null>(null);
  const [synBalance, setSynBalance] = useState<bigint | null>(null);
  const [icpFee, setIcpFee] = useState<bigint>(DEFAULT_ICP_FEE_E8S);
  const [usdInput, setUsdInput] = useState("5");
  const [receipt, setReceipt] = useState<PurchaseCandid | null>(null);

  const configured = isSaleConfigured();

  const load = useCallback(async () => {
    setInfoLoading(true);
    setInfoError(null);
    try {
      if (!configured) {
        setSnapshot(FALLBACK_SNAPSHOT);
        return;
      }
      const live = await fetchSaleSnapshot(identity ?? undefined);
      setSnapshot({ ...live, live: true });
      const icpLedger = live.icpLedger;
      const synLedger = live.synLedger;
      if (icpLedger) {
        setIcpFee(await fetchIcpFee(icpLedger, identity ?? undefined));
      }
      if (principal && icpLedger) {
        setIcpBalance(
          await fetchIcpBalance(principal, icpLedger, identity ?? undefined)
        );
      } else {
        setIcpBalance(null);
      }
      if (principal && synLedger) {
        setSynBalance(
          await fetchSynBalance(principal, synLedger, identity ?? undefined)
        );
      }
    } catch (err) {
      setSnapshot(FALLBACK_SNAPSHOT);
      setInfoError(
        err instanceof SaleNotConfiguredError
          ? err.message
          : `Could not load sale state. ${formatUnknown(err)}`
      );
    } finally {
      setInfoLoading(false);
    }
  }, [configured, identity, principal]);

  useEffect(() => {
    void load();
  }, [load]);

  const parsedUsd = parseUsdInput(usdInput);
  const usdE6 = parsedUsd === null ? null : usdToE6(parsedUsd);
  const quote =
    usdE6 && snapshot.icpUsdRateE6 > BigInt(0)
      ? quoteFromUsd(usdE6, snapshot.icpUsdRateE6, snapshot.synUsdE6)
      : null;

  const minUsd = e6ToUsd(snapshot.minUsdE6);
  const belowMin =
    quote !== null && quote.usdE6 < snapshot.minUsdE6 && (parsedUsd ?? 0) > 0;
  const inputInvalid = parsedUsd === null;
  const rateMissing = snapshot.icpUsdRateE6 === BigInt(0);
  const requiredIcp =
    quote !== null ? quote.icpE8s + icpFee * BigInt(2) : null;
  const insufficient =
    isAuthenticated &&
    icpBalance !== null &&
    requiredIcp !== null &&
    icpBalance < requiredIcp;

  const ctaDisabledReason = useMemo(() => {
    if (busy) return busy === "connect" ? "Connecting…" : "Processing…";
    if (!configured) return "Sale canisters are not configured.";
    if (infoLoading) return "Loading sale state…";
    if (snapshot.paused) return "The sale is paused.";
    if (rateMissing) return "ICP/USD rate is not set.";
    if (inputInvalid) return "Enter a valid USD amount.";
    if (!quote) return "Amount is too small to mint.";
    if (belowMin) return `Minimum purchase is $${minUsd.toFixed(2)}.`;
    if (insufficient) return "Insufficient ICP balance.";
    return null;
  }, [
    belowMin,
    busy,
    configured,
    infoLoading,
    inputInvalid,
    insufficient,
    minUsd,
    quote,
    rateMissing,
    snapshot.paused,
  ]);

  const canSubmit =
    !ctaDisabledReason && configured && quote !== null && !infoLoading;

  async function onCta() {
    setError(null);
    if (!isAuthenticated) {
      setBusy("connect");
      try {
        await login();
      } catch (err) {
        setError(formatUnknown(err));
      } finally {
        setBusy(null);
      }
      return;
    }

    if (!identity || !principal || !quote || !canSubmit) return;

    try {
      setBusy("approve");
      const purchase = await executePurchase({
        identity,
        buyer: principal,
        icpE8s: quote.icpE8s,
        saleCanisterId: snapshot.saleId ?? undefined,
        synLedgerCanisterId: snapshot.synLedger ?? undefined,
        icpLedgerCanisterId: snapshot.icpLedger ?? undefined,
        onStage: (stage) => setBusy(stage),
      });
      setReceipt(purchase);
      setPhase("success");
      if (snapshot.synLedger) {
        setSynBalance(
          await fetchSynBalance(principal, snapshot.synLedger, identity)
        );
      }
      if (snapshot.icpLedger) {
        setIcpBalance(
          await fetchIcpBalance(principal, snapshot.icpLedger, identity)
        );
      }
    } catch (err) {
      setError(formatUnknown(err));
    } finally {
      setBusy(null);
    }
  }

  const synUsd = e6ToUsd(snapshot.synUsdE6);
  const icpUsd = e6ToUsd(snapshot.icpUsdRateE6);

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4 sm:px-6">
        <div>
          <Dialog.Title className="text-base font-medium tracking-[-0.01em] text-foreground">
            Acquire $SYN
          </Dialog.Title>
          <Dialog.Description
            id="acquire-syn-desc"
            className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground"
          >
            Fixed rate: 1 $SYN = $0.01. Pay with ICP — funds route to the
            protocol treasury.
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-9 shrink-0"
            aria-label="Close"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </Dialog.Close>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-7 sm:px-6">
        {phase === "success" && receipt ? (
          <SuccessState
            receipt={receipt}
            synBalance={synBalance}
            onClose={onClose}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onCta();
            }}
            className="space-y-5"
          >
            <div className="flex rounded-lg bg-muted p-[3px]">
              <span className="flex-1 rounded-md bg-background px-3 py-1.5 text-center text-sm font-medium text-foreground shadow-sm">
                ICP
              </span>
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground">
                USDC
                <span className="metric text-[10px] tracking-[0.08em] uppercase">
                  Soon
                </span>
              </span>
            </div>

            <div>
              <label
                htmlFor="acquire-usd"
                className="label-micro text-muted-foreground"
              >
                Amount (USD)
              </label>
              <div className="relative mt-2">
                <span className="metric pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="acquire-usd"
                  inputMode="decimal"
                  autoComplete="off"
                  value={usdInput}
                  onChange={(e) => setUsdInput(e.target.value)}
                  className="h-12 w-full rounded-lg border border-edge bg-background pr-16 pl-7 text-lg tracking-[-0.02em] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <span className="metric pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
                  USD
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {QUICK_USD_AMOUNTS.map((n) => {
                  const active = parsedUsd === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setUsdInput(String(n))}
                      className={cn(
                        "min-h-9 rounded-md border px-2.5 text-[12px] transition-colors",
                        active
                          ? "border-brand/40 bg-brand/10 text-foreground"
                          : "border-edge text-muted-foreground hover:border-edge-strong hover:text-foreground"
                      )}
                    >
                      ${n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-edge bg-background/50 px-4 py-3.5">
              <p className="label-micro">You receive</p>
              <p className="metric mt-2 text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">
                {quote ? formatE8s(quote.synE8s, 2) : "—"}{" "}
                <span className="text-base text-muted-foreground">$SYN</span>
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {quote
                  ? `You pay ${formatE8s(quote.icpE8s, 6)} ICP`
                  : "Enter an amount to see the ICP debit."}
              </p>
              <p className="metric mt-2 text-[11px] text-muted-foreground">
                1 $SYN = ${synUsd.toFixed(2)}
                {snapshot.icpUsdRateE6 > BigInt(0)
                  ? ` · 1 ICP = $${icpUsd.toFixed(2)}`
                  : " · ICP/USD rate unset"}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-edge px-4 py-3.5 text-[13px]">
              <StatusRow
                label="Identity"
                value={
                  isLoading && !isAuthenticated
                    ? "…"
                    : isAuthenticated
                      ? principalText ?? "Connected"
                      : "Not connected"
                }
              />
              <StatusRow
                label="Available ICP"
                value={
                  !isAuthenticated
                    ? "—"
                    : icpBalance === null
                      ? infoLoading
                        ? "…"
                        : "—"
                      : formatE8s(icpBalance, 4)
                }
              />
              <StatusRow
                label="Treasury"
                value={
                  snapshot.treasury
                    ? truncatePrincipal(snapshot.treasury)
                    : "Sale canister"
                }
                title={snapshot.treasury ?? undefined}
              />
              <StatusRow label="Pay with" value="ICP" />
            </dl>

            {infoError ? (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {infoError}
              </p>
            ) : null}
            {error ? (
              <p className="text-[13px] leading-relaxed text-negative">{error}</p>
            ) : null}
            {belowMin && parsedUsd ? (
              <p className="text-[13px] text-muted-foreground">
                Minimum purchase is ${minUsd.toFixed(2)}.
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full min-h-11"
              disabled={
                busy !== null ||
                isLoading ||
                (isAuthenticated && !canSubmit)
              }
            >
              {!isAuthenticated
                ? busy === "connect"
                  ? "Connecting…"
                  : "Connect to Buy"
                : busy === "approve"
                  ? "Approving ICP…"
                  : busy === "buy"
                    ? "Minting $SYN…"
                    : "Buy $SYN"}
            </Button>
            {isAuthenticated && ctaDisabledReason && !busy ? (
              <p className="text-center text-[12px] text-muted-foreground">
                {ctaDisabledReason}
              </p>
            ) : (
              <p className="text-center text-[12px] text-muted-foreground">
                Internet Identity required. Approve then mint in one flow.
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}

function StatusRow({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div>
      <dt className="label-micro">{label}</dt>
      <dd className="metric mt-1 truncate text-[13px] text-foreground" title={title}>
        {value}
      </dd>
    </div>
  );
}

function SuccessState({
  receipt,
  synBalance,
  onClose,
}: {
  receipt: PurchaseCandid;
  synBalance: bigint | null;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand/25 bg-brand/5 px-4 py-4">
        <p className="label-micro text-brand">Settled</p>
        <p className="mt-2 text-[1.5rem] leading-none font-medium tracking-[-0.03em] text-foreground">
          {formatE8s(receipt.syn_e8s, 2)} $SYN
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Credited to {formatPrincipalShort(receipt.buyer)} for{" "}
          {formatE8s(receipt.icp_e8s, 6)} ICP.
        </p>
      </div>
      {synBalance !== null ? (
        <p className="text-[13px] text-muted-foreground">
          Ledger balance: {formatE8s(synBalance, 4)} $SYN
        </p>
      ) : null}
      <Button type="button" size="lg" className="w-full min-h-11" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
