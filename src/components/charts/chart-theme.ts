/**
 * Shared Recharts styling.
 *
 * Colours are literal hex rather than CSS variables: SVG presentation
 * attributes do not resolve `var()` reliably across browsers, and the theme is
 * fixed by design. Axis typography is applied from `globals.css` instead.
 */

export const CHART_COLORS = {
  brand: "#00d4c8",
  gold: "#c9a227",
  info: "#5b8def",
  positive: "#00c853",
  negative: "#ff4d4f",
  violet: "#8f7fd1",
  neutral: "#3b4048",
  dim: "#9aa0a6",
} as const;

export type ChartTone = keyof typeof CHART_COLORS;

export const GRID = {
  stroke: "#2a2d35",
  strokeDasharray: "2 4",
  vertical: false,
} as const;

export const AXIS_TICK = {
  fill: "#6f757e",
  fontSize: 11,
} as const;

export const AXIS = {
  stroke: "#2a2d35",
  tickLine: false,
  axisLine: false,
  tick: AXIS_TICK,
  tickMargin: 10,
  minTickGap: 24,
} as const;

export const CURSOR_LINE = {
  stroke: "#3b4048",
  strokeWidth: 1,
} as const;

/** Axis margin that leaves room for tick labels without clipping the plot. */
export const PLOT_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 } as const;
