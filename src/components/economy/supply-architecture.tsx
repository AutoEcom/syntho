import type { AllocationBucket, AllocationTone } from "@/lib/economy";
import { allocationAmount, SYNTHO_TOKEN } from "@/lib/economy";
import { formatCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE_FILL: Record<AllocationTone, string> = {
  brand: "bg-brand",
  gold: "bg-gold",
  info: "bg-chart-3",
  violet: "bg-chart-5",
  muted: "bg-muted-foreground/45",
};

export function SupplyArchitecture({
  buckets,
}: {
  buckets: readonly AllocationBucket[];
}) {
  return (
    <div className="space-y-8">
      <div
        className="flex h-2 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label="Supply allocation by bucket"
      >
        {buckets.map((bucket) => (
          <div
            key={bucket.id}
            className={cn("h-full", TONE_FILL[bucket.tone])}
            style={{ width: `${bucket.share * 100}%` }}
            title={`${bucket.label} ${formatPercent(bucket.share, 0)}`}
          />
        ))}
      </div>

      <ul className="divide-y divide-edge border-y border-edge">
        {buckets.map((bucket) => (
          <li
            key={bucket.id}
            className="grid gap-3 py-5 sm:grid-cols-[minmax(0,11rem)_5.5rem_minmax(0,7.5rem)_1fr] sm:items-baseline sm:gap-6 lg:grid-cols-[minmax(0,13rem)_6rem_minmax(0,8.5rem)_1fr]"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  TONE_FILL[bucket.tone]
                )}
              />
              <span className="text-sm font-medium text-foreground">
                {bucket.label}
              </span>
            </div>
            <p className="metric text-sm text-foreground">
              {formatPercent(bucket.share, 0)}
            </p>
            <p className="metric text-[13px] text-muted-foreground">
              {formatCount(allocationAmount(bucket.share))} {SYNTHO_TOKEN.symbol}
            </p>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {bucket.purpose}
              </p>
              {bucket.terms ? (
                <p className="metric mt-2 text-[11px] text-brand">
                  {bucket.terms}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
