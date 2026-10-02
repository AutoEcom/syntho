"use client";

import { useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { FuelIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashNotice, type FlashPayload } from "@/components/ui/flash-notice";
import { formatCycles, formatRatio, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Asset = "cycles" | "icp" | "usdc";

const CYCLE_PRESETS_T = [1, 5, 10, 25] as const;
const ICP_PRESETS = [0.5, 1, 2, 5] as const;

const T = 1e12;

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function TopUpCyclesDialog({
  agentName,
  canisterId,
  cycleBalance,
  runwayDays,
  burn24h,
  usdPerTrillionCycles,
  xdrPerIcp,
}: {
  agentName: string;
  canisterId: string;
  cycleBalance: number;
  runwayDays: number;
  burn24h: number;
  usdPerTrillionCycles: number;
  xdrPerIcp: number;
}) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<Asset>("cycles");
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState<FlashPayload | null>(null);

  const parsed = parseAmount(amount);

  const quote = useMemo(() => {
    if (asset === "usdc" || parsed === null) return null;

    const cycles = asset === "cycles" ? parsed * T : parsed * xdrPerIcp * T;
    const icp = cycles / T / xdrPerIcp;
    const usd = (cycles / T) * usdPerTrillionCycles;
    const nextBalance = cycleBalance + cycles;
    const nextRunway =
      burn24h > 0 ? nextBalance / burn24h : runwayDays;

    return { cycles, icp, usd, nextBalance, nextRunway };
  }, [
    asset,
    parsed,
    xdrPerIcp,
    usdPerTrillionCycles,
    cycleBalance,
    burn24h,
    runwayDays,
  ]);

  function reset() {
    setAsset("cycles");
    setAmount("10");
    setBusy(false);
    setDone(false);
  }

  async function confirm() {
    if (!quote || asset === "usdc") return;
    setBusy(true);
    await new Promise((r) => window.setTimeout(r, 720));
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next && done && quote) {
            setNotice({
              title: `Top-up queued for ${agentName}`,
              body: `${formatCycles(quote.cycles, false)} cycles · ${formatRatio(quote.icp, 4)} ICP`,
            });
          }
          setOpen(next);
          if (!next) reset();
        }}
      >
        <Dialog.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 min-h-8 w-full gap-1.5 sm:w-auto"
          >
            <FuelIcon data-icon="inline-start" className="size-3.5 text-brand" />
            Top-up Cycles
          </Button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Content
            aria-describedby="top-up-cycles-desc"
            className="fixed top-1/2 left-1/2 z-[110] flex max-h-[min(92dvh,40rem)] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-edge/80 bg-surface/90 shadow-elevated outline-none backdrop-blur-xl data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          >
            <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4 sm:px-6">
              <div>
                <Dialog.Title className="text-base font-medium tracking-[-0.01em] text-foreground">
                  Top-up Cycles
                </Dialog.Title>
                <Dialog.Description
                  id="top-up-cycles-desc"
                  className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground"
                >
                  Credit {agentName} from the treasury. 1T cycles = 1 XDR.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 shrink-0"
                  aria-label="Close"
                >
                  <XIcon />
                </Button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 pb-7 sm:px-6">
              {done && quote ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-brand/20 bg-brand/8 px-4 py-4">
                    <p className="label-micro text-brand">Queued</p>
                    <p className="metric mt-2 text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">
                      {formatCycles(quote.cycles, false)}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                      Mock settlement accepted. The risk canister will observe
                      the new balance on the next evaluation cycle.
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-edge/80 bg-background/40 px-4 py-3.5 text-[13px]">
                    <div>
                      <dt className="text-muted-foreground">Debit</dt>
                      <dd className="metric mt-1 text-foreground">
                        {formatRatio(quote.icp, 4)} ICP
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Projected runway</dt>
                      <dd className="metric mt-1 text-brand">
                        {formatRatio(quote.nextRunway, 1)} days
                      </dd>
                    </div>
                  </dl>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full min-h-11"
                    onClick={() => setOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void confirm();
                  }}
                >
                  <div className="flex rounded-lg bg-muted p-[3px]">
                    {(
                      [
                        { id: "cycles", label: "Cycles" },
                        { id: "icp", label: "ICP" },
                        { id: "usdc", label: "USDC", soon: true },
                      ] as const
                    ).map((tab) => {
                      const active = asset === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setAsset(tab.id);
                            setAmount(tab.id === "icp" ? "1" : "10");
                          }}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-background font-medium text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {tab.label}
                          {"soon" in tab ? (
                            <span className="metric text-[10px] tracking-[0.08em] text-gold uppercase">
                              Soon
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {asset === "usdc" ? (
                    <div className="rounded-xl border border-edge/80 bg-background/40 px-4 py-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        ckUSDC settlement is queued. Cycle top-ups currently
                        settle in ICP at the protocol XDR rate.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="top-up-amount"
                          className="label-micro text-muted-foreground"
                        >
                          {asset === "cycles" ? "Amount (T cycles)" : "Amount (ICP)"}
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="top-up-amount"
                            inputMode="decimal"
                            autoComplete="off"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="metric h-12 w-full rounded-lg border border-edge bg-background px-3 pr-16 text-lg tracking-[-0.02em] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                          <span className="metric pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
                            {asset === "cycles" ? "T" : "ICP"}
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {asset === "cycles"
                            ? CYCLE_PRESETS_T.map((n) => {
                                const active = parsed === n;
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setAmount(String(n))}
                                    className={cn(
                                      "min-h-9 rounded-md border px-2.5 text-[12px] transition-colors",
                                      active
                                        ? "border-brand/40 bg-brand/10 text-foreground"
                                        : "border-edge text-muted-foreground hover:border-edge-strong hover:text-foreground"
                                    )}
                                  >
                                    {n}T
                                  </button>
                                );
                              })
                            : ICP_PRESETS.map((n) => {
                                const active = parsed === n;
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setAmount(String(n))}
                                    className={cn(
                                      "min-h-9 rounded-md border px-2.5 text-[12px] transition-colors",
                                      active
                                        ? "border-brand/40 bg-brand/10 text-foreground"
                                        : "border-edge text-muted-foreground hover:border-edge-strong hover:text-foreground"
                                    )}
                                  >
                                    {n} ICP
                                  </button>
                                );
                              })}
                        </div>
                      </div>

                      <div className="rounded-xl border border-edge/80 bg-background/40 px-4 py-3.5">
                        <p className="label-micro">Canister credit</p>
                        <p className="metric mt-2 text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">
                          {quote ? formatCycles(quote.cycles, false) : "—"}
                        </p>
                        <p className="mt-3 text-[13px] text-muted-foreground">
                          {quote
                            ? `${formatRatio(quote.icp, 4)} ICP · ${formatUsd(quote.usd, true)} at ${formatUsd(usdPerTrillionCycles, true)} / 1T`
                            : "Enter an amount to price the top-up."}
                        </p>
                        <p className="metric mt-2 text-[11px] text-muted-foreground">
                          {canisterId}
                        </p>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-edge/80 px-4 py-3.5 text-[13px]">
                        <div>
                          <dt className="text-muted-foreground">Balance</dt>
                          <dd className="metric mt-1 text-foreground">
                            {formatCycles(cycleBalance, false)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Runway</dt>
                          <dd className="metric mt-1 text-foreground">
                            {formatRatio(runwayDays, 1)}d
                            {quote ? (
                              <span className="text-brand">
                                {" "}
                                → {formatRatio(quote.nextRunway, 1)}d
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full min-h-11"
                    disabled={
                      busy || asset === "usdc" || quote === null
                    }
                  >
                    {busy ? "Submitting…" : "Confirm Top-up"}
                  </Button>
                </form>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <FlashNotice notice={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
