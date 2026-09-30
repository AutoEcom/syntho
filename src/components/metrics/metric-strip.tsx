import type { ReactNode } from "react";
import { Enter } from "@/components/motion/enter";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface StripMetric {
  label: string;
  /** Pre-formatted primary readout. */
  value: string;
  /** Optional secondary line: a delta, a limit, or a unit. */
  meta?: ReactNode;
  tone?: "default" | "brand" | "positive" | "negative" | "gold";
}

const TONE_CLASS = {
  default: "text-foreground",
  brand: "text-brand",
  positive: "text-positive",
  negative: "text-negative",
  gold: "text-gold",
} as const;

/**
 * Dense hairline-divided readout. Wraps on small screens so the page never
 * scrolls horizontally; each cell is a full metric, not a clipped fragment.
 */
export function MetricStrip({
  metrics,
  className,
  stagger = false,
  staggerFrom = 0,
}: {
  metrics: StripMetric[];
  className?: string;
  stagger?: boolean;
  staggerFrom?: number;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-edge bg-edge shadow-panel",
        className
      )}
    >
      <dl className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:grid-cols-7">
        {metrics.map((metric, i) => {
          const cell = (
            <div className="flex h-full min-w-0 flex-col gap-2 bg-surface/90 px-4 py-4 sm:px-5">
              <dt className="label-micro truncate">{metric.label}</dt>
              <dd className="flex min-w-0 flex-col gap-1">
                <span
                  className={cn(
                    "metric text-[1.0625rem] leading-none font-medium sm:text-lg",
                    TONE_CLASS[metric.tone ?? "default"]
                  )}
                >
                  {metric.value}
                </span>
                {metric.meta ? (
                  <span className="text-[11px] leading-4 text-muted-foreground">
                    {metric.meta}
                  </span>
                ) : null}
              </dd>
            </div>
          );

          if (!stagger) {
            return <div key={metric.label}>{cell}</div>;
          }

          return (
            <Enter
              key={metric.label}
              delay={staggerFrom + i * MOTION.stagger}
              className="h-full min-w-0"
            >
              {cell}
            </Enter>
          );
        })}
      </dl>
    </div>
  );
}
