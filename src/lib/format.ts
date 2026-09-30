/**
 * Display formatters.
 *
 * Every formatter pins an explicit locale so that server-rendered and
 * client-rendered output are byte-identical. Metrics are rendered with fixed
 * precision rather than "nice" rounding — an institutional readout should never
 * hide a digit that changes a decision.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_PRECISE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatUsd(value: number, precise = false): string {
  return precise ? USD_PRECISE.format(value) : USD.format(value);
}

export function formatUsdCompact(value: number): string {
  return USD_COMPACT.format(value);
}

/** Signed currency, e.g. `+$128,430` / `-$12,904`. */
export function formatSignedUsd(value: number, compact = false): string {
  const body = compact
    ? USD_COMPACT.format(Math.abs(value))
    : USD.format(Math.abs(value));
  return `${value < 0 ? "-" : "+"}${body}`;
}

/** `value` is a decimal fraction: 0.1284 renders as `12.84%`. */
export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** Signed percentage, e.g. `+12.84%` / `-3.10%`. */
export function formatSignedPercent(value: number, digits = 2): string {
  return `${value < 0 ? "-" : "+"}${(Math.abs(value) * 100).toFixed(digits)}%`;
}

/** Unitless ratios such as Sharpe, Sortino, profit factor. */
export function formatRatio(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function formatCount(value: number): string {
  return INT.format(value);
}

const CYCLE_UNITS: Array<[threshold: number, suffix: string]> = [
  [1e15, "P"],
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/**
 * Cycles are large integers; operators read them in T/B/M cycles.
 * `4.128e14` renders as `412.80T cycles`.
 */
export function formatCycles(value: number, withUnit = true): string {
  const suffix = CYCLE_UNITS.find(([t]) => Math.abs(value) >= t);
  const body = suffix
    ? `${(value / suffix[0]).toFixed(2)}${suffix[1]}`
    : INT.format(value);
  return withUnit ? `${body} cycles` : body;
}

export function formatBytes(value: number): string {
  const units = ["B", "KiB", "MiB", "GiB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatMs(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `2026-09-30` renders as `30 Sep 2026`. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `2026-09-30` renders as `30 Sep`. */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** `2026-09-30T17:42:00Z` renders as `17:42 UTC`. */
export function formatTimeUtc(iso: string): string {
  const d = new Date(iso);
  const hh = `${d.getUTCHours()}`.padStart(2, "0");
  const mm = `${d.getUTCMinutes()}`.padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

/**
 * Coarse relative time against an explicit reference point. The reference is
 * always passed in so output stays deterministic across render passes.
 */
export function formatSince(iso: string, reference: string): string {
  const deltaSec = Math.max(
    0,
    Math.round((new Date(reference).getTime() - new Date(iso).getTime()) / 1000)
  );
  if (deltaSec < 60) return `${deltaSec}s ago`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}

/** `rrkah-fqaaa-aaaaa-aaaaq-cai` renders as `rrkah…aaaaq-cai`. */
export function truncatePrincipal(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 5)}…${id.slice(-9)}`;
}

export type Tone = "positive" | "negative" | "neutral";

export function toneOf(value: number, epsilon = 0): Tone {
  if (value > epsilon) return "positive";
  if (value < -epsilon) return "negative";
  return "neutral";
}

export const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-muted-foreground",
};
