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
import type { SeriesPoint } from "@/lib/types";
import { formatDate, formatDateShort, formatRatio } from "@/lib/format";
import { AXIS, CHART_COLORS, CURSOR_LINE, GRID } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/**
 * Normalised performance index (start = 100). Used for agent-level series where
 * absolute capital is less informative than relative progression.
 */
export function IndexChart({
  points,
  tone = "brand",
}: {
  points: SeriesPoint[];
  tone?: "brand" | "negative";
  height?: number;
}) {
  const color = CHART_COLORS[tone];
  const values = points.map((p) => p.v);
  const min = Math.min(...values, 100);
  const max = Math.max(...values, 100);
  const pad = (max - min) * 0.25 || 1;

  return (
    <div className="chart-stage w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`index-fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID} />

          <XAxis
            {...AXIS}
            dataKey="t"
            tickFormatter={(value: string) => formatDateShort(value)}
          />
          <YAxis
            {...AXIS}
            orientation="right"
            width={48}
            domain={[min - pad, max + pad]}
            tickFormatter={(value: number) => formatRatio(value, 1)}
          />

          <ReferenceLine
            y={100}
            stroke={CHART_COLORS.neutral}
            strokeDasharray="3 4"
          />

          <Tooltip
            cursor={CURSOR_LINE}
            content={
              <ChartTooltip
                formatLabel={(label) => formatDate(String(label))}
                rows={(payload) => {
                  const point = payload[0]?.payload as SeriesPoint | undefined;
                  if (!point) return [];
                  return [
                    {
                      key: "index",
                      label: "Index",
                      value: formatRatio(point.v),
                      color,
                    },
                    {
                      key: "change",
                      label: "From start",
                      value: `${point.v >= 100 ? "+" : ""}${formatRatio(
                        point.v - 100
                      )}`,
                    },
                  ];
                }}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#index-fill-${tone})`}
            dot={false}
            activeDot={{
              r: 3,
              fill: color,
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
