"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExposureBucket } from "@/lib/types";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import { AXIS, CHART_COLORS, GRID } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/** Long and short notional per underlying, mirrored around zero. */
export function ExposureChart({
  buckets,
}: {
  buckets: ExposureBucket[];
  height?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="chart-stage w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            layout="vertical"
            stackOffset="sign"
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            barCategoryGap="28%"
          >
            <CartesianGrid {...GRID} vertical horizontal={false} />

            <XAxis
              {...AXIS}
              type="number"
              tickFormatter={(value: number) => formatUsdCompact(value)}
            />
            <YAxis
              {...AXIS}
              type="category"
              dataKey="label"
              width={84}
              tick={{ fill: "#9aa0a6", fontSize: 11 }}
            />

            <ReferenceLine x={0} stroke={CHART_COLORS.neutral} />

            <Tooltip
              cursor={{ fill: "#1c1f26", fillOpacity: 0.6 }}
              content={
                <ChartTooltip
                  rows={(payload) => {
                    const point = payload[0]?.payload as
                      | ExposureBucket
                      | undefined;
                    if (!point) return [];
                    return [
                      {
                        key: "long",
                        label: "Long",
                        value: formatUsd(point.long),
                        color: CHART_COLORS.brand,
                      },
                      {
                        key: "short",
                        label: "Short",
                        value: formatUsd(point.short),
                        color: CHART_COLORS.negative,
                      },
                      {
                        key: "net",
                        label: "Net",
                        value: formatUsd(point.long + point.short),
                      },
                    ];
                  }}
                  formatLabel={() => "Notional exposure"}
                />
              }
            />

            <Bar
              dataKey="long"
              stackId="exposure"
              fill={CHART_COLORS.brand}
              fillOpacity={0.8}
              radius={[0, 2, 2, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="short"
              stackId="exposure"
              fill={CHART_COLORS.negative}
              fillOpacity={0.7}
              radius={[2, 0, 0, 2]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ backgroundColor: CHART_COLORS.brand }}
          />
          Long notional
        </span>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ backgroundColor: CHART_COLORS.negative }}
          />
          Short notional
        </span>
      </div>
    </div>
  );
}
