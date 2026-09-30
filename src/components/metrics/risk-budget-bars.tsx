import type { RiskBudget, RiskSeverity } from "@/lib/types";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILL: Record<RiskSeverity, string> = {
  critical: "bg-negative",
  elevated: "bg-gold",
  watch: "bg-brand",
  nominal: "bg-brand/55",
};

/**
 * Risk budgets as utilisation bars. The number that matters is how much of a
 * hard limit is consumed, so the limit itself is always printed beside it.
 */
export function RiskBudgetBars({
  budgets,
  className,
}: {
  budgets: RiskBudget[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-5", className)}>
      {budgets.map((budget) => {
        const pct = Math.min(1, Math.max(0, budget.utilisation));
        return (
          <li key={budget.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-foreground">
                {budget.label}
              </span>
              <span className="metric text-[13px] text-foreground">
                {formatPercent(budget.utilisation, 1)}
              </span>
            </div>

            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2"
              role="meter"
              aria-valuenow={Math.round(budget.utilisation * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${budget.label} budget utilisation`}
            >
              <div
                className={cn("h-full rounded-full", FILL[budget.severity])}
                style={{ width: `${pct * 100}%` }}
              />
            </div>

            <p className="metric mt-1.5 text-[11px] text-muted-foreground">
              of {budget.limitLabel}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
