/**
 * Shared motion tokens.
 *
 * Timing is institutional: short, the same everywhere, and GPU-only
 * (transform + opacity). CSS first-paint entrances read these as custom
 * properties; Framer in-view reveals read them as JS constants.
 */

export const MOTION = {
  duration: 0.55,
  durationMs: 550,
  /** Seconds between sibling reveals. */
  stagger: 0.07,
  /** Default fade-up travel, in pixels. */
  distance: 16,
  ease: [0.22, 1, 0.36, 1] as const,
  easeCss: "cubic-bezier(0.22, 1, 0.36, 1)",
  hoverMs: 180,
} as const;
