import { useEffect, useRef } from "react";

/**
 * Hook: useLiquidHeaderMotion
 * Adds subtle physics-based motion to headers on scroll:
 * - Slight compression (scale) when scrolling down
 * - Increased saturation/blur for deeper glass feeling
 * Respects prefers-reduced-motion.
 */
export function useLiquidHeaderMotion<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // Respect accessibility preference

    let ticking = false;
    const BASE_BLUR = 12; // px
    const BASE_SAT = 1.3; // unitless multiplier
    const MAX_EXTRA_BLUR = 6; // px
    const MAX_SCALE_REDUCTION = 0.02; // 2%
    const RANGE = 80; // px of scroll to reach max effect

    const update = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const progress = Math.max(0, Math.min(1, y / RANGE));
      const blur = BASE_BLUR + progress * MAX_EXTRA_BLUR;
      const sat = BASE_SAT + progress * 0.15;
      const scale = 1 - progress * MAX_SCALE_REDUCTION;

      // Apply CSS variables for interpolation in CSS
      el.style.setProperty("--liquid-blur", `${blur}px`);
      el.style.setProperty("--liquid-sat", `${sat}`);
      el.style.setProperty("--liquid-scale", `${scale}`);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initialize
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return ref;
}

export default useLiquidHeaderMotion;