"use client";

import { useLiveMetric, type LiveKind } from "@/hooks/use-live-metrics";

export function LiveText({
  value,
  format,
  kind,
  seed = 1,
}: {
  value: number;
  format: (n: number) => string;
  kind: LiveKind;
  seed?: number;
}) {
  const live = useLiveMetric(value, kind, seed);
  return <span className="tabular-nums">{format(live)}</span>;
}
