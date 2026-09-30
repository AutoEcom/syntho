import { Badge } from "@/components/ui/badge";
import { STRATEGY_LABELS } from "@/lib/types";
import type { StrategyType, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StrategyBadge({
  strategy,
  className,
}: {
  strategy: StrategyType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border-edge bg-surface-2/50 px-2 text-[11px] font-normal tracking-wide text-muted-foreground",
        className
      )}
    >
      {STRATEGY_LABELS[strategy]}
    </Badge>
  );
}

export function VenueList({
  venues,
  className,
}: {
  venues: Venue[];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "metric flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground",
        className
      )}
    >
      {venues.map((venue, i) => (
        <span key={venue} className="flex items-center gap-1.5">
          {venue}
          {i < venues.length - 1 ? (
            <span aria-hidden="true" className="text-edge-strong">
              ·
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
