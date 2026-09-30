"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/types";
import { CHART_COLORS } from "./chart-theme";

/**
 * Trend-only microchart. No axes, no tooltip: it exists to show shape, and the
 * precise numbers live in the metric beside it.
 */
export function Sparkline({
  points,
  tone = "brand",
  height = 56,
  strokeWidth = 1.25,
}: {
  points: SeriesPoint[];
  tone?: "brand" | "positive" | "negative" | "gold" | "neutral";
  height?: number;
  strokeWidth?: number;
}) {
  const color = CHART_COLORS[tone];
  const gradientId = `spark-${tone}`;

  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.25 || 1;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min - pad, max + pad]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
