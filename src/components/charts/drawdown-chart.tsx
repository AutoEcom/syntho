"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/types";
import { formatDate, formatDateShort, formatPercent, formatUsd } from "@/lib/format";
import { AXIS, CHART_COLORS, CURSOR_LINE, GRID } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/**
 * Underwater plot. Always anchored at 0% so the shape of the drawdown is read
 * against the high-water mark rather than against a floating axis.
 */
export function DrawdownChart({
  points,
  limit = -0.15,
}: {
  points: EquityPoint[];
  height?: number;
  limit?: number;
}) {
  const worst = Math.min(...points.map((p) => p.drawdown), limit);

  return (
      <div className="chart-stage w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="drawdown-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={CHART_COLORS.negative}
                stopOpacity={0.02}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS.negative}
                stopOpacity={0.26}
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
            width={56}
            domain={[worst * 1.25, 0]}
            tickFormatter={(value: number) => formatPercent(value, 1)}
          />

          <ReferenceLine
            y={limit}
            stroke={CHART_COLORS.negative}
            strokeDasharray="3 4"
            strokeOpacity={0.5}
            label={{
              value: `halt ${formatPercent(limit, 0)}`,
              position: "insideBottomLeft",
              fill: CHART_COLORS.dim,
              fontSize: 10,
            }}
          />

          <Tooltip
            cursor={CURSOR_LINE}
            content={
              <ChartTooltip
                formatLabel={(label) => formatDate(String(label))}
                rows={(payload) => {
                  const point = payload[0]?.payload as EquityPoint | undefined;
                  if (!point) return [];
                  return [
                    {
                      key: "drawdown",
                      label: "Drawdown",
                      value: formatPercent(point.drawdown),
                      color: CHART_COLORS.negative,
                    },
                    {
                      key: "hwm",
                      label: "High-water mark",
                      value: formatUsd(point.highWaterMark),
                    },
                    {
                      key: "equity",
                      label: "Equity",
                      value: formatUsd(point.equity),
                    },
                  ];
                }}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="drawdown"
            stroke={CHART_COLORS.negative}
            strokeWidth={1.5}
            fill="url(#drawdown-fill)"
            dot={false}
            activeDot={{
              r: 3,
              fill: CHART_COLORS.negative,
              stroke: "#0a0b0f",
              strokeWidth: 2,
            }}
              isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
