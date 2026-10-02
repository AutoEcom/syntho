import type { ReactNode } from "react";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { TONE_TEXT, toneOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = {
  positive: ArrowUpRightIcon,
  negative: ArrowDownRightIcon,
  neutral: ArrowRightIcon,
};

/**
 * Signed change readout. The caller formats the number so the component never
 * guesses at precision or units.
 */
export function Delta({
  value,
  label,
  showIcon = true,
  className,
}: {
  /** Raw value, used only to pick the tone. */
  value: number;
  /** Pre-formatted text, e.g. `+1.24%` or `+$128,430`. */
  label: ReactNode;
  showIcon?: boolean;
  className?: string;
}) {
  const tone = toneOf(value);
  const Icon = ICONS[tone];

  return (
    <span
      className={cn(
        "metric inline-flex items-center gap-1 text-[13px]",
        TONE_TEXT[tone],
        className
      )}
    >
      {showIcon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
