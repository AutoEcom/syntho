"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Seconds of delay, used to stagger sibling blocks. */
  delay?: number;
  /** Vertical travel in pixels. */
  y?: number;
  /** Animate once when scrolled into view rather than on first paint. */
  inView?: boolean;
}

/**
 * Entrance animation.
 *
 * - Default (first paint): CSS class `motion-enter`. Opacity is never written
 *   as an inline style, so SSR cannot leave the tree stuck at opacity 0.
 * - `inView`: stays visible through hydration. After a short observer grace
 *   period, off-screen nodes fade up when they enter the viewport. A failsafe
 *   forces visibility if the observer never fires.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = MOTION.distance,
  inView = false,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-72px 0px", amount: 0.12 });
  const [armed, setArmed] = useState(false);
  const [failsafe, setFailsafe] = useState(false);

  useEffect(() => {
    const arm = window.setTimeout(() => setArmed(true), 80);
    const lock = window.setTimeout(() => setFailsafe(true), 1200);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(lock);
    };
  }, []);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  if (!inView) {
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

  const visible = !armed || seen || failsafe;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: MOTION.duration,
        delay: visible ? delay : 0,
        ease: MOTION.ease,
      }}
    >
      {children}
    </motion.div>
  );
}
