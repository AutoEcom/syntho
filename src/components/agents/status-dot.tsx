import { STATUS_LABELS } from "@/lib/types";
import type { AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE: Record<AgentStatus, { dot: string; text: string }> = {
  active: { dot: "bg-positive", text: "text-foreground" },
  throttled: { dot: "bg-gold", text: "text-gold" },
  degraded: { dot: "bg-negative", text: "text-negative" },
  paused: { dot: "bg-edge-strong", text: "text-muted-foreground" },
  retired: { dot: "bg-edge", text: "text-muted-foreground" },
};

export function StatusDot({
  status,
  showLabel = true,
  className,
}: {
  status: AgentStatus;
  showLabel?: boolean;
  className?: string;
}) {
  const style = STYLE[status];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex size-1.5 shrink-0">
        {status === "active" ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-50" />
        ) : null}
        <span
          className={cn("relative inline-flex size-1.5 rounded-full", style.dot)}
        />
      </span>
      {showLabel ? (
        <span className={cn("text-[13px]", style.text)}>
          {STATUS_LABELS[status]}
        </span>
      ) : (
        <span className="sr-only">{STATUS_LABELS[status]}</span>
      )}
    </span>
  );
}
