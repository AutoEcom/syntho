"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Agent } from "@/lib/types";
import { STRATEGY_LABELS } from "@/lib/types";
import {
  formatCycles,
  formatCount,
  formatPercent,
  formatRatio,
  formatSignedUsd,
  formatSince,
  formatUsdCompact,
  TONE_TEXT,
  toneOf,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusDot } from "./status-dot";

type SortKey =
  | "name"
  | "allocation"
  | "pnl30d"
  | "returnTotal"
  | "sharpe"
  | "maxDrawdown"
  | "winRate"
  | "trades24h"
  | "cycles24h";

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
  hint?: string;
}[] = [
  { key: "name", label: "Agent", align: "left" },
  { key: "allocation", label: "Alloc", align: "right" },
  { key: "pnl30d", label: "PnL 30D", align: "right" },
  { key: "returnTotal", label: "Return ITD", align: "right" },
  { key: "sharpe", label: "Sharpe", align: "right" },
  { key: "maxDrawdown", label: "Max DD", align: "right" },
  { key: "winRate", label: "Win", align: "right" },
  { key: "trades24h", label: "Trades 24H", align: "right" },
  { key: "cycles24h", label: "Cycles 24H", align: "right" },
];

function valueOf(agent: Agent, key: SortKey): number | string {
  switch (key) {
    case "name":
      return agent.name;
    case "allocation":
      return agent.allocation;
    case "pnl30d":
      return agent.performance.pnl30d;
    case "returnTotal":
      return agent.performance.returnTotal;
    case "sharpe":
      return agent.performance.sharpe;
    case "maxDrawdown":
      return agent.performance.maxDrawdown;
    case "winRate":
      return agent.performance.winRate;
    case "trades24h":
      return agent.performance.trades24h;
    case "cycles24h":
      return agent.compute.cycles24h;
  }
}

/** Dense agent roster. Sorting is the only interaction. */
export function AgentTable({
  agents,
  asOf,
}: {
  agents: Agent[];
  asOf: string;
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "allocation",
    desc: true,
  });

  const rows = useMemo(() => {
    const sorted = [...agents].sort((a, b) => {
      const va = valueOf(a, sort.key);
      const vb = valueOf(b, sort.key);
      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb));
      }
      return va - vb;
    });
    return sort.desc ? sorted.reverse() : sorted;
  }, [agents, sort]);

  const toggle = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, desc: !prev.desc } : { key, desc: true }
    );

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-edge bg-surface shadow-panel">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="border-edge hover:bg-transparent">
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              const Chevron = sort.desc ? ChevronDownIcon : ChevronUpIcon;
              return (
                <TableHead
                  key={column.key}
                  aria-sort={
                    active
                      ? sort.desc
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                  className={cn(
                    "h-11 bg-surface-2/40 px-4 font-normal",
                    column.align === "right" && "text-right"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(column.key)}
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] tracking-[0.1em] uppercase transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {column.label}
                    <Chevron
                      className={cn(
                        "size-3 transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                </TableHead>
              );
            })}
            <TableHead className="h-11 bg-surface-2/40 px-4 text-right text-[11px] font-normal tracking-[0.1em] text-muted-foreground uppercase">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((agent) => {
            const tone = toneOf(agent.performance.pnl30d);
            return (
              <TableRow
                key={agent.id}
                className="border-edge/70 hover:bg-surface-2/40"
              >
                <TableCell className="px-4 py-3.5">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="group flex items-center gap-3"
                  >
                    <StatusDot status={agent.status} showLabel={false} />
                    <span className="min-w-0">
                      <span className="metric block text-[13px] text-foreground transition-colors group-hover:text-brand">
                        {agent.name}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {STRATEGY_LABELS[agent.strategy]}
                      </span>
                    </span>
                  </Link>
                </TableCell>

                <NumCell>{formatPercent(agent.allocation, 1)}</NumCell>
                <NumCell className={TONE_TEXT[tone]}>
                  {formatSignedUsd(agent.performance.pnl30d, true)}
                </NumCell>
                <NumCell
                  className={TONE_TEXT[toneOf(agent.performance.returnTotal)]}
                >
                  {formatPercent(agent.performance.returnTotal, 1)}
                </NumCell>
                <NumCell>{formatRatio(agent.performance.sharpe)}</NumCell>
                <NumCell className="text-muted-foreground">
                  {formatPercent(agent.performance.maxDrawdown, 1)}
                </NumCell>
                <NumCell>{formatPercent(agent.performance.winRate, 1)}</NumCell>
                <NumCell className="text-muted-foreground">
                  {formatCount(agent.performance.trades24h)}
                </NumCell>
                <NumCell className="text-muted-foreground">
                  {formatCycles(agent.compute.cycles24h, false)}
                </NumCell>
                <NumCell className="text-muted-foreground">
                  {formatSince(agent.updatedAt, asOf)}
                </NumCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge bg-surface-2/30 px-4 py-3">
        <span className="text-[11px] text-muted-foreground">
          {agents.length} agents · capital deployed{" "}
          {formatUsdCompact(
            agents.reduce((sum, a) => sum + a.deployedCapital, 0)
          )}
        </span>
        <span className="metric text-[11px] text-muted-foreground">
          ITD = inception to date
        </span>
      </div>
    </div>
  );
}

function NumCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableCell
      className={cn("metric px-4 py-3.5 text-right text-foreground", className)}
    >
      {children}
    </TableCell>
  );
}
