"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { Delta } from "@/components/metrics/delta";
import { LiveText } from "@/components/metrics/live-text";
import { Card } from "@/components/ui/card";
import type { Agent } from "@/lib/types";
import {
  formatCycles,
  formatPercent,
  formatRatio,
  formatSignedPercent,
  formatSignedUsd,
  formatSince,
  TONE_TEXT,
  toneOf,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusDot } from "./status-dot";
import { StrategyBadge, VenueList } from "./strategy-badge";

export function AgentCard({ agent, asOf }: { agent: Agent; asOf: string }) {
  const { performance, compute } = agent;
  const tone = toneOf(performance.pnl30d);

  return (
    <Card className="group h-full gap-0 py-0 hover-lift">
      <Link
        href={`/agents/${agent.id}`}
        className="flex h-full flex-col rounded-xl focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="metric text-[15px] leading-none font-medium text-foreground">
                {agent.name}
              </h3>
              <ArrowUpRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-2.5">
              <StrategyBadge strategy={agent.strategy} />
            </div>
          </div>
          <StatusDot status={agent.status} />
        </div>

        <p className="line-clamp-2 px-5 text-[13px] leading-relaxed text-muted-foreground">
          {agent.mandate}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4 px-5">
          <div>
            <p className="label-micro">30-day return</p>
            <p className="mt-1.5">
              <span
                className={cn(
                  "metric text-xl leading-none font-medium",
                  TONE_TEXT[tone]
                )}
              >
                <LiveText
                  value={performance.pnl30d / agent.deployedCapital}
                  kind="percent"
                  seed={agent.id.length}
                  format={(n) => formatSignedPercent(n)}
                />
              </span>
            </p>
          </div>
          <Delta
            value={performance.pnl30d}
            label={
              <LiveText
                value={performance.pnl30d}
                kind="pnl"
                seed={agent.id.length + 3}
                format={(n) => formatSignedUsd(n, true)}
              />
            }
            showIcon={false}
          />
        </div>

        <div className="mt-3 -mb-px">
          <Sparkline
            points={agent.equityIndex}
            tone={tone === "negative" ? "negative" : "brand"}
            height={52}
          />
        </div>

        <dl className="grid grid-cols-3 divide-x divide-edge border-t border-edge">
          <MiniStat
            label="Sharpe"
            value={
              <LiveText
                value={performance.sharpe}
                kind="ratio"
                seed={agent.id.length + 5}
                format={(n) => formatRatio(n)}
              />
            }
          />
          <MiniStat
            label="Max DD"
            value={formatPercent(performance.maxDrawdown, 1)}
          />
          <MiniStat label="Win rate" value={formatPercent(performance.winRate, 1)} />
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-edge px-5 py-3.5">
          <VenueList venues={agent.venues} />
          <span className="metric text-[11px] text-muted-foreground">
            <LiveText
              value={compute.cycles24h}
              kind="cycles"
              seed={agent.id.length + 7}
              format={(n) => formatCycles(n, false)}
            />{" "}
            / 24h · {formatSince(agent.updatedAt, asOf)}
          </span>
        </div>
      </Link>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-5 py-3.5">
      <dt className="label-micro">{label}</dt>
      <dd className="metric mt-1 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}
