import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label/value pair for detail panels. Values are monospaced and right-aligned. */
export function StatRow({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "brand" | "muted";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 py-2.5",
        className
      )}
    >
      <span className="text-[13px] text-muted-foreground">
        {label}
        {hint ? (
          <span className="ml-1.5 text-[11px] text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "metric shrink-0 text-[13px]",
          tone === "default" && "text-foreground",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          tone === "brand" && "text-brand",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Vertical list of `StatRow`s with hairline separators. */
export function StatList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-edge/70", className)}>{children}</div>
  );
}
