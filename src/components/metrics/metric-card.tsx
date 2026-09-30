import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  delta,
  footnote,
  visual,
  emphasis = "default",
  className,
}: {
  label: string;
  /** Pre-formatted primary readout. */
  value: string;
  /** Small trailing unit, set apart from the number. */
  unit?: string;
  delta?: ReactNode;
  footnote?: string;
  /** Optional sparkline or bar, rendered flush to the card floor. */
  visual?: ReactNode;
  emphasis?: "default" | "brand" | "gold";
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 py-0 transition-colors duration-200 hover-lift",
        className
      )}
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="label-micro">{label}</span>
          {delta}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "metric text-[1.5rem] leading-none font-medium sm:text-[1.75rem]",
              emphasis === "brand" && "text-brand",
              emphasis === "gold" && "text-gold",
              emphasis === "default" && "text-foreground"
            )}
          >
            {value}
          </span>
          {unit ? (
            <span className="metric text-xs text-muted-foreground">{unit}</span>
          ) : null}
        </div>

        {footnote ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {footnote}
          </p>
        ) : null}
      </div>

      {visual ? <div className="mt-auto h-14 w-full">{visual}</div> : null}
    </Card>
  );
}
