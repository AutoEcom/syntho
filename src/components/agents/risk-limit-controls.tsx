"use client";

import { useMemo, useState } from "react";
import { RiskBudgetBars } from "@/components/metrics/risk-budget-bars";
import { Button } from "@/components/ui/button";
import { FlashNotice, type FlashPayload } from "@/components/ui/flash-notice";
import { RangeSlider } from "@/components/ui/range-slider";
import type { RiskBudget, RiskSeverity } from "@/lib/types";
import { formatPercent, formatUsd, formatUsdCompact } from "@/lib/format";

const DRAWDOWN_MIN = 3;
const DRAWDOWN_MAX = 25;
const DRAWDOWN_STEP = 0.1;

const NOTIONAL_MIN = 500_000;
const NOTIONAL_MAX = 25_000_000;
const NOTIONAL_STEP = 50_000;

const ALLOC_MIN = 2;
const ALLOC_MAX = 40;
const ALLOC_STEP = 0.1;

function severityFor(utilisation: number): RiskSeverity {
  if (utilisation >= 0.9) return "critical";
  if (utilisation >= 0.7) return "elevated";
  if (utilisation >= 0.5) return "watch";
  return "nominal";
}

function nearlyEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

export function AgentRiskLimitsPanel({
  agentName,
  currentDrawdown,
  deployedCapital,
  allocation,
  maxDrawdown,
  maxNotional,
  maxAllocation,
  runwayDays,
}: {
  agentName: string;
  /** Decimal fraction, typically negative. */
  currentDrawdown: number;
  deployedCapital: number;
  allocation: number;
  maxDrawdown: number;
  maxNotional: number;
  maxAllocation: number;
  runwayDays: number;
}) {
  const initialHalt = Math.abs(maxDrawdown) * 100;
  const initialAlloc = maxAllocation * 100;

  const [haltPct, setHaltPct] = useState(initialHalt);
  const [notional, setNotional] = useState(maxNotional);
  const [allocPct, setAllocPct] = useState(initialAlloc);
  const [applied, setApplied] = useState({
    haltPct: initialHalt,
    notional: maxNotional,
    allocPct: initialAlloc,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<FlashPayload | null>(null);

  const dirty =
    !nearlyEqual(haltPct, applied.haltPct) ||
    !nearlyEqual(notional, applied.notional) ||
    !nearlyEqual(allocPct, applied.allocPct);

  const haltLimit = haltPct / 100;
  const allocLimit = allocPct / 100;
  const ddUtil = Math.abs(currentDrawdown) / Math.max(haltLimit, 0.0001);
  const notionalUtil = deployedCapital / Math.max(notional, 1);
  const allocUtil = allocation / Math.max(allocLimit, 0.0001);

  const budgets: RiskBudget[] = useMemo(
    () => [
      {
        label: "Drawdown budget",
        utilisation: ddUtil,
        limitLabel: `${formatPercent(haltLimit)} halt`,
        severity: severityFor(ddUtil),
      },
      {
        label: "Notional budget",
        utilisation: notionalUtil,
        limitLabel: `${formatUsd(notional)} cap`,
        severity: severityFor(notionalUtil),
      },
      {
        label: "Allocation budget",
        utilisation: allocUtil,
        limitLabel: `${formatPercent(allocLimit)} of equity`,
        severity: severityFor(allocUtil),
      },
      {
        label: "Cycle runway",
        utilisation: Math.min(1, 20 / Math.max(runwayDays, 0.1)),
        limitLabel: "20-day top-up threshold",
        severity: severityFor(Math.min(1, 20 / Math.max(runwayDays, 0.1))),
      },
    ],
    [ddUtil, haltLimit, notionalUtil, notional, allocUtil, allocLimit, runwayDays]
  );

  async function apply() {
    setSaving(true);
    await new Promise((r) => window.setTimeout(r, 700));
    setApplied({ haltPct, notional, allocPct });
    setSaving(false);
    setNotice({
      title: `Limits queued for ${agentName}`,
      body: `Halt ${formatPercent(haltLimit)} · notional ${formatUsdCompact(notional)} · weight ${formatPercent(allocLimit)}`,
    });
  }

  return (
    <>
      <div className="mt-7 space-y-6">
        <div className="space-y-5 rounded-xl border border-edge/80 bg-background/30 px-4 py-4 sm:px-5">
          <RangeSlider
            id="limit-drawdown"
            label="Drawdown halt"
            valueLabel={formatPercent(haltLimit)}
            hint={`Current drawdown ${formatPercent(Math.abs(currentDrawdown))}`}
            min={DRAWDOWN_MIN}
            max={DRAWDOWN_MAX}
            step={DRAWDOWN_STEP}
            value={haltPct}
            onChange={setHaltPct}
          />
          <RangeSlider
            id="limit-notional"
            label="Notional cap"
            valueLabel={formatUsdCompact(notional)}
            hint={`${formatPercent(notionalUtil, 1)} of deployed ${formatUsdCompact(deployedCapital)}`}
            min={NOTIONAL_MIN}
            max={NOTIONAL_MAX}
            step={NOTIONAL_STEP}
            value={notional}
            onChange={setNotional}
          />
          <RangeSlider
            id="limit-allocation"
            label="Allocation weight"
            valueLabel={formatPercent(allocLimit)}
            hint={`Currently ${formatPercent(allocation, 1)} of portfolio equity`}
            min={ALLOC_MIN}
            max={ALLOC_MAX}
            step={ALLOC_STEP}
            value={allocPct}
            onChange={setAllocPct}
          />
        </div>

        <RiskBudgetBars budgets={budgets} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              className="w-full min-h-11 sm:w-auto"
              disabled={!dirty || saving}
              onClick={() => void apply()}
            >
              {saving ? "Applying…" : "Save / Apply Limits"}
            </Button>
            {dirty ? (
              <p className="text-[12px] text-muted-foreground sm:ml-1">
                Uncommitted. The risk canister still enforces the last applied set.
              </p>
            ) : null}
          </div>
          <FlashNotice notice={notice} onDismiss={() => setNotice(null)} />
        </div>
      </div>
    </>
  );
}
