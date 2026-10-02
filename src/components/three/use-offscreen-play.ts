"use client";

import { useEffect, useState, type RefObject } from "react";

/** Pauses WebGL work when off-screen, hidden, or when the user prefers reduced motion. */
export function useOffscreenPlay(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.12
) {
  const [play, setPlay] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setPlay(false);
      return;
    }

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio > threshold;
        setPlay(inView && !reduced && document.visibilityState === "visible");
      },
      { threshold: [0, threshold, 0.35] }
    );
    io.observe(el);

    const onVisibility = () => {
      setPlay(inView && !reduced && document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref, reduced, threshold]);

  return { play, reduced };
}
