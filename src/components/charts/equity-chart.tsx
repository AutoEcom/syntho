"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/types";
import {
  formatDate,
  formatDateShort,
  formatPercent,
  formatUsd,
  formatUsdCompact,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { AXIS, CHART_COLORS, CURSOR_LINE, GRID } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

const RANGES = [
  { label: "30D", days: 30 },
  { label: "60D", days: 60 },
  { label: "90D", days: 90 },
] as const;

export function EquityChart({
  points,
  showHighWaterMark = true,
  className,
}: {
  points: EquityPoint[];
  /** @deprecated Charts size themselves via `.chart-stage`. Kept for call-site compatibility. */
  height?: number;
  showHighWaterMark?: boolean;
  className?: string;
}) {
  const [days, setDays] = useState<number>(90);

  const data = useMemo(() => points.slice(-days), [points, days]);

  const domain = useMemo<[number, number]>(() => {
    const values = data.flatMap((p) =>
      showHighWaterMark ? [p.equity, p.highWaterMark] : [p.equity]
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.18 || max * 0.02;
    return [min - pad, max + pad];
  }, [data, showHighWaterMark]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-end">
        <div
          role="group"
          aria-label="Equity curve range"
          className="inline-flex items-center gap-0.5 rounded-lg border border-edge bg-surface-2/60 p-0.5"
        >
          {RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={cn(
                "metric min-h-11 min-w-11 rounded-md px-2.5 text-[11px] transition-colors sm:min-h-0 sm:min-w-0 sm:py-1",
                days === range.days
                  ? "bg-surface text-foreground shadow-panel"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-stage w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={CHART_COLORS.brand}
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_COLORS.brand}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid {...GRID} />

            <XAxis
              {...AXIS}
              dataKey="date"
              tickFormatter={(value: string) => formatDateShort(value)}
            />
            <YAxis
              {...AXIS}
              orientation="right"
              width={64}
              domain={domain}
              tickFormatter={(value: number) => formatUsdCompact(value)}
            />

            <Tooltip
              cursor={CURSOR_LINE}
              content={
                <ChartTooltip
                  formatLabel={(label) => formatDate(String(label))}
                  rows={(payload) => {
                    const point = payload[0]?.payload as
                      | EquityPoint
                      | undefined;
                    if (!point) return [];
                    return [
                      {
                        key: "equity",
                        label: "Equity",
                        value: formatUsd(point.equity),
                        color: CHART_COLORS.brand,
                      },
                      {
                        key: "daily",
                        label: "Daily return",
                        value: formatPercent(point.dailyReturn),
                      },
                      {
                        key: "drawdown",
                        label: "Drawdown",
                        value: formatPercent(point.drawdown),
                      },
                      {
                        key: "exposure",
                        label: "Gross exposure",
                        value: formatUsd(point.exposure),
                      },
                    ];
                  }}
                />
              }
            />

            {showHighWaterMark ? (
              <Line
                type="stepAfter"
                dataKey="highWaterMark"
                stroke={CHART_COLORS.neutral}
                strokeWidth={1}
                strokeDasharray="3 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ) : null}

            <Area
              type="monotone"
              dataKey="equity"
              stroke={CHART_COLORS.brand}
              strokeWidth={1.75}
              fill="url(#equity-fill)"
              dot={false}
              activeDot={{
                r: 3,
                fill: CHART_COLORS.brand,
                stroke: "#0a0b0f",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showHighWaterMark ? (
        <div className="flex items-center gap-5">
          <LegendSwatch color={CHART_COLORS.brand} label="Portfolio equity" />
          <LegendSwatch
            color={CHART_COLORS.neutral}
            label="High-water mark"
            dashed
          />
        </div>
      ) : null}
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span
        aria-hidden="true"
        className="h-px w-5"
        style={
          dashed
            ? {
                backgroundImage: `repeating-linear-gradient(to right, ${color} 0 3px, transparent 3px 7px)`,
              }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}
