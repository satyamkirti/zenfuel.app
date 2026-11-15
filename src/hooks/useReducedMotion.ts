'use client';

import { useEffect, useState } from 'react';

/** True when the phone or browser asks for reduced motion (Android: "Remove animations"). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/** Shared props for Recharts series so every chart animates the same way, and not at all under reduced motion. */
export function useChartMotion() {
  const reduced = useReducedMotion();
  return { isAnimationActive: !reduced, animationDuration: 750, animationEasing: 'ease-out' as const };
}
