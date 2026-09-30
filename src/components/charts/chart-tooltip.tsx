"use client";

import { cn } from "@/lib/utils";

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color?: string;
}

/** Raw Recharts payload entry, narrowed to the fields we actually read. */
export interface RechartsPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: RechartsPayloadItem[];
  label?: string | number;
  /** Renders the header line, usually a formatted date. */
  formatLabel?: (label: string | number | undefined) => string;
  /** Maps the payload into label/value rows. */
  rows?: (payload: RechartsPayloadItem[]) => TooltipRow[];
  className?: string;
}

/**
 * One tooltip shell for every chart: hairline border, elevated surface,
 * monospaced values. Content is supplied by the calling chart.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  rows,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const resolved = rows
    ? rows(payload)
    : payload.map((item, i) => ({
        key: String(item.dataKey ?? i),
        label: String(item.name ?? item.dataKey ?? ""),
        value: String(item.value ?? ""),
        color: item.color,
      }));

  return (
    <div
      className={cn(
        "min-w-[11rem] rounded-lg border border-edge bg-surface-2/95 px-3 py-2.5 shadow-elevated backdrop-blur-sm",
        className
      )}
    >
      <p className="metric text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        {formatLabel ? formatLabel(label) : label}
      </p>
      <dl className="mt-2 space-y-1.5">
        {resolved.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            {row.color ? (
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            ) : null}
            <dt className="text-[12px] text-muted-foreground">{row.label}</dt>
            <dd className="metric ml-auto text-[12px] text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
