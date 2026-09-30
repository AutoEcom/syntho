"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CycleBurnPoint } from "@/lib/types";
import { formatCycles, formatDate, formatDateShort } from "@/lib/format";
import { AXIS, CHART_COLORS, GRID } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

const SERIES = [
  { key: "agents", label: "Agent inference", color: CHART_COLORS.brand },
  { key: "marketData", label: "Market data", color: CHART_COLORS.info },
  { key: "orchestration", label: "Orchestration", color: CHART_COLORS.gold },
  {
    key: "riskAndSettlement",
    label: "Risk & settlement",
    color: CHART_COLORS.violet,
  },
] as const;

/** Daily cycle burn, stacked by workload. */
export function CyclesChart({
  points,
}: {
  points: CycleBurnPoint[];
  height?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="chart-stage w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={points}
            margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
            barCategoryGap="22%"
          >
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
              tickFormatter={(value: number) => formatCycles(value, false)}
            />

            <Tooltip
              cursor={{ fill: "#1c1f26", fillOpacity: 0.6 }}
              content={
                <ChartTooltip
                  formatLabel={(label) => formatDate(String(label))}
                  rows={(payload) => {
                    const point = payload[0]?.payload as
                      | CycleBurnPoint
                      | undefined;
                    if (!point) return [];
                    const total =
                      point.agents +
                      point.orchestration +
                      point.marketData +
                      point.riskAndSettlement;
                    return [
                      ...SERIES.map((s) => ({
                        key: s.key,
                        label: s.label,
                        value: formatCycles(point[s.key], false),
                        color: s.color,
                      })),
                      {
                        key: "total",
                        label: "Total",
                        value: formatCycles(total, false),
                      },
                    ];
                  }}
                />
              }
            />

            {SERIES.map((series, i) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                stackId="burn"
                fill={series.color}
                fillOpacity={0.85}
                radius={i === SERIES.length - 1 ? [2, 2, 0, 0] : undefined}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {SERIES.map((series) => (
          <span
            key={series.key}
            className="flex items-center gap-2 text-[11px] text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}
