import type { CSSProperties, ReactNode } from "react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * First-paint entrance.
 *
 * Implemented as a CSS animation so it runs with the stylesheet — not after
 * hydration. Framer's `initial={{ opacity: 0 }}` would serialize a stuck
 * inline style into the SSR HTML; this class never does.
 */
export function Enter({
  children,
  className,
  delay = 0,
  y = MOTION.distance,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <div
      className={cn("motion-enter", className)}
      style={
        {
          "--motion-delay": `${delay}s`,
          "--motion-y": `${y}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
