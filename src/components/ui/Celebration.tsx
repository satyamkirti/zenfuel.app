'use client';

import { clsx } from 'clsx';

const COLORS = ['#1877f2', '#8b5cf6', '#11bfa9', '#ff982f', '#f35c9b', '#ffc83d', '#2cc8e8', '#22c77a'];

/**
 * A short burst of brand-coloured sparks for real achievements (a finished challenge, a goal
 * reached). It plays once (under a second) and is hidden under reduced motion. Place it inside a
 * relatively positioned element.
 */
export function Celebration({ className }: { className?: string }) {
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 46 + (i % 3) * 16;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, c: COLORS[i % COLORS.length], round: i % 2 === 0 };
  });
  return (
    <span className={clsx('burst pointer-events-none absolute left-1/2 top-1/2 z-10', className)} aria-hidden="true">
      {sparks.map((s, i) => (
        <span
          key={i}
          className={clsx('absolute -ml-1 -mt-1 w-2 h-2', s.round ? 'rounded-full' : 'rounded-[2px] rotate-45')}
          style={{ background: s.c, ['--dx' as string]: `${s.dx}px`, ['--dy' as string]: `${s.dy}px`, animationDelay: `${(i % 4) * 25}ms` }}
        />
      ))}
    </span>
  );
}
