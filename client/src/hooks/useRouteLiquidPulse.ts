import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Hook: useRouteLiquidPulse
 * Triggers a brief liquid pulse animation on the provided element whenever the route changes.
 *
 * Usage:
 *   const headerRef = useLiquidHeaderMotion<HTMLElement>();
 *   useRouteLiquidPulse(headerRef);
 */
export function useRouteLiquidPulse<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [location] = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // Respect accessibility preference

    // retrigger animation by toggling class
    el.classList.remove("liquid-pulse");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("liquid-pulse");

    const timeout = window.setTimeout(() => {
      el.classList.remove("liquid-pulse");
    }, 600);

    return () => {
      window.clearTimeout(timeout);
      el.classList.remove("liquid-pulse");
    };
  }, [location, ref]);
}

export default useRouteLiquidPulse;