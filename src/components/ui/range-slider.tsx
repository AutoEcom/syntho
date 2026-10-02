"use client";

import { cn } from "@/lib/utils";

export function RangeSlider({
  id,
  label,
  valueLabel,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  /** Live primary readout, typically a percent or compact USD. */
  valueLabel: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  const span = max - min;
  const pct = span <= 0 ? 0 : Math.min(100, Math.max(0, ((value - min) / span) * 100));

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-foreground">
          {label}
        </label>
        <span className="metric text-[13px] text-brand">{valueLabel}</span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="syntho-range mt-3"
        style={{
          background: `linear-gradient(to right, var(--syntho-brand) ${pct}%, var(--syntho-surface-2) ${pct}%)`,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueLabel}
      />

      {hint ? (
        <p className="metric mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
