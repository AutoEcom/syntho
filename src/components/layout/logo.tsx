import { cn } from "@/lib/utils";

/** Geometric mark: a signal resolving inside a lattice. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 text-brand", className)}
    >
      <path
        d="M12 1.75 22.25 12 12 22.25 1.75 12 12 1.75Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeOpacity="0.4"
      />
      <path
        d="M12 6.5 17.5 12 12 17.5 6.5 12 12 6.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeOpacity="0.7"
      />
      <path d="M12 10 14 12l-2 2-2-2 2-2Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {showWordmark ? (
        <span className="text-[18px] leading-none font-medium tracking-[-0.015em] text-foreground">
          Syntho
        </span>
      ) : null}
    </span>
  );
}
