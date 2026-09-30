import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Single horizontal measure shared by every page and by the nav. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-[1400px] px-4 sm:px-6 lg:px-12",
        className
      )}
    >
      {children}
    </div>
  );
}
