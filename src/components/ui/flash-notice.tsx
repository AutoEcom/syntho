"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlashPayload {
  title: string;
  body?: string;
}

/** Inline glass confirmation, used after mocked canister writes. */
export function FlashNotice({
  notice,
  onDismiss,
  className,
}: {
  notice: FlashPayload | null;
  onDismiss: () => void;
  className?: string;
}) {
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/8 px-3.5 py-3",
        className
      )}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
        <CheckIcon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{notice.title}</p>
        {notice.body ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {notice.body}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        aria-label="Dismiss"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
