import Link from "next/link";
import { CATEGORY_LABELS, SEVERITY_LABELS } from "@/lib/types";
import type { RiskFlag, RiskSeverity } from "@/lib/types";
import {
  formatCycles,
  formatMs,
  formatPercent,
  formatRatio,
  formatSince,
  formatUsd,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<
  RiskSeverity,
  { text: string; bar: string; dot: string }
> = {
  critical: {
    text: "text-negative",
    bar: "bg-negative",
    dot: "bg-negative",
  },
  elevated: { text: "text-gold", bar: "bg-gold", dot: "bg-gold" },
  watch: { text: "text-brand", bar: "bg-brand", dot: "bg-brand" },
  nominal: {
    text: "text-muted-foreground",
    bar: "bg-edge-strong",
    dot: "bg-edge-strong",
  },
};

function formatRiskValue(value: number, unit: RiskFlag["unit"]): string {
  switch (unit) {
    case "percent":
      return formatPercent(value);
    case "usd":
      return formatUsd(value);
    case "ms":
      return formatMs(value);
    case "cycles":
      return formatCycles(value, false);
    default:
      return formatRatio(value);
  }
}

export function RiskFlagList({
  flags,
  asOf,
  className,
}: {
  flags: RiskFlag[];
  asOf: string;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-edge", className)}>
      {flags.map((flag) => {
        const style = SEVERITY_STYLE[flag.severity];
        return (
          <li
            key={flag.id}
            className="group relative flex gap-4 py-5 transition-colors first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className={cn("mt-1.5 w-0.5 shrink-0 self-stretch", style.bar)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span
                  className={cn(
                    "metric text-[11px] tracking-[0.1em] uppercase",
                    style.text
                  )}
                >
                  {SEVERITY_LABELS[flag.severity]}
                </span>
                <span className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                  {CATEGORY_LABELS[flag.category]}
                </span>
                {flag.agentId ? (
                  <Link
                    href={`/agents/${flag.agentId}`}
                    className="metric rounded border border-edge px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-edge-strong hover:text-foreground"
                  >
                    {flag.agentId}
                  </Link>
                ) : (
                  <span className="metric rounded border border-edge px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    portfolio
                  </span>
                )}
                <span className="metric ml-auto text-[11px] text-muted-foreground">
                  {formatSince(flag.raisedAt, asOf)}
                </span>
              </div>

              <p className="mt-2 text-sm leading-snug text-foreground">
                {flag.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {flag.detail}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="metric text-[11px] text-muted-foreground">
                  observed{" "}
                  <span className={style.text}>
                    {formatRiskValue(flag.value, flag.unit)}
                  </span>
                </span>
                <span className="metric text-[11px] text-muted-foreground">
                  limit {formatRiskValue(flag.threshold, flag.unit)}
                </span>
                {flag.acknowledged ? (
                  <span className="metric text-[11px] text-muted-foreground">
                    action applied automatically
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
