import type { Variants } from "framer-motion";
import { MOTION } from "@/lib/motion";

export const motionTransition = {
  duration: MOTION.duration,
  ease: MOTION.ease,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: MOTION.distance },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: MOTION.stagger,
      delayChildren: 0.04,
    },
  },
};

/** Hover only — never used as an entrance. Cap is 1.015. */
export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1 },
};
