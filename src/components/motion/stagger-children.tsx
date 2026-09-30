"use client";

import { Children, type ReactNode } from "react";
import { MOTION } from "@/lib/motion";
import { Enter } from "./enter";
import { FadeIn } from "./fade-in";

/**
 * Sequential reveal of direct children. Uses CSS first-paint animation by
 * default, and the in-view FadeIn path when `inView` is set.
 */
export function StaggerChildren({
  children,
  className,
  itemClassName,
  stagger = MOTION.stagger,
  delay = 0,
  y = MOTION.distance,
  inView = false,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  stagger?: number;
  delay?: number;
  y?: number;
  inView?: boolean;
}) {
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => {
        const itemDelay = delay + i * stagger;
        if (inView) {
          return (
            <FadeIn
              key={i}
              inView
              delay={itemDelay}
              y={y}
              className={itemClassName}
            >
              {child}
            </FadeIn>
          );
        }
        return (
          <Enter key={i} delay={itemDelay} y={y} className={itemClassName}>
            {child}
          </Enter>
        );
      })}
    </div>
  );
}
