"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationSlice } from "@/lib/types";
import { formatPercent, formatUsd, formatUsdCompact } from "@/lib/format";
import { CHART_COLORS } from "./chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/** Capital allocation by agent, with the unallocated reserve shown explicitly. */
export function AllocationChart({
  slices,
  totalEquity,
  size = 208,
}: {
  slices: AllocationSlice[];
  totalEquity: number;
  size?: number;
}) {
  const deployed = slices
    .filter((s) => s.agentId !== "reserve")
    .reduce((sum, s) => sum + s.capital, 0);

  return (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices as unknown as Record<string, unknown>[]}
              dataKey="weight"
              nameKey="label"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={1.5}
              startAngle={90}
              endAngle={-270}
              stroke="#0a0b0f"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.agentId}
                  fill={CHART_COLORS[slice.tone]}
                  fillOpacity={slice.agentId === "reserve" ? 0.55 : 0.92}
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  formatLabel={() => "Allocation"}
                  rows={(payload) => {
                    const slice = payload[0]?.payload as
                      | AllocationSlice
                      | undefined;
                    if (!slice) return [];
                    return [
                      {
                        key: "weight",
                        label: slice.label,
                        value: formatPercent(slice.weight, 1),
                        color: CHART_COLORS[slice.tone],
                      },
                      {
                        key: "capital",
                        label: "Capital",
                        value: formatUsd(slice.capital),
                      },
                    ];
                  }}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="label-micro">Deployed</span>
          <span className="metric text-lg leading-none font-medium text-foreground">
            {formatUsdCompact(deployed)}
          </span>
          <span className="metric text-[11px] text-muted-foreground">
            {formatPercent(deployed / totalEquity, 1)} of equity
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice) => (
          <li
            key={slice.agentId}
            className="flex items-center gap-3 text-[13px]"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[slice.tone] }}
            />
            <span className="truncate text-muted-foreground">
              {slice.label}
            </span>
            <span className="metric ml-auto shrink-0 text-foreground">
              {formatPercent(slice.weight, 1)}
            </span>
            <span className="metric hidden w-20 shrink-0 text-right text-muted-foreground sm:inline">
              {formatUsdCompact(slice.capital)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
