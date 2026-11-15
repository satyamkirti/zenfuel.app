'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A number that counts up to its value when it first appears (and eases to new values). It runs
 * for under a second and stops; with reduced motion it shows the value straight away.
 */
export function CountUp({ value, duration = 700, decimals = 0, className }: { value: number; duration?: number; decimals?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduced || start === value || typeof requestAnimationFrame === 'undefined') {
      setShown(value);
      from.current = value;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration]);

  const text = decimals ? shown.toFixed(decimals) : String(Math.round(shown));
  // Screen readers get the final value, not every step.
  return <span className={className} aria-label={decimals ? value.toFixed(decimals) : String(value)}><span aria-hidden="true">{text}</span></span>;
}
