import { ReactNode, useId } from 'react';
import { clsx } from 'clsx';

type RingTone = 'teal' | 'warm' | 'good' | 'bad' | 'light';

const STOPS: Record<RingTone, [string, string]> = {
  teal: ['#2cc8e8', '#1877f2'],
  warm: ['#ffc83d', '#ff982f'],
  good: ['#3ccd8c', '#22c77a'],
  bad: ['#f37b78', '#ef5350'],
  light: ['#2cc8e8', '#48a8f5'],
};

interface ProgressRingProps {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: RingTone;
  trackClassName?: string;
  className?: string;
  children?: ReactNode;
  label?: string;
}

/**
 * A circular progress indicator with a gradient stroke. It draws itself in when it first appears
 * (CSS, see .ring-draw) and eases to new values.
 */
export function ProgressRing({ value, size = 120, stroke = 10, tone = 'teal', trackClassName, className, children, label }: ProgressRingProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={clsx('relative shrink-0', className)} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={STOPS[tone][0]} />
            <stop offset="100%" stopColor={STOPS[tone][1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={clsx(trackClassName ?? 'text-surface-3 dark:text-white/[0.07]')} />
        {v > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={`url(#ring-${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v)}
            className="ring-draw"
            style={{ ['--ring-from' as string]: c, transition: 'stroke-dashoffset 0.9s var(--ease-out)' }}
          />
        )}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
}

/**
 * An open arc gauge (like a speedometer, 260°) with a glowing teal stroke and an end dot. Used for
 * the Home hero. Draws in on first display.
 */
export function ArcGauge({ value, size = 220, stroke = 12, children, label, tone = 'teal', scrim }: { value: number; size?: number; stroke?: number; children?: ReactNode; label?: string; tone?: 'teal' | 'warm' | 'bad'; /** Darkens the centre, for gauges drawn over artwork. */ scrim?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const SWEEP = 260;
  const r = (size - stroke) / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const start = 90 + (360 - SWEEP) / 2; // degrees, measured clockwise from +x
  const pt = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const [sx, sy] = pt(start);
  const [ex, ey] = pt(start + SWEEP);
  const d = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const len = (SWEEP / 360) * 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const [dx, dy] = pt(start + SWEEP * v);
  const stops = tone === 'warm' ? ['#ffc83d', '#ff982f'] : tone === 'bad' ? ['#f37b78', '#ef5350'] : ['#1877f2', '#2cc8e8'];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 0.86 }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-x-0 top-0 overflow-visible">
        <defs>
          <linearGradient id={`arc-${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={stops[0]} />
            <stop offset="1" stopColor={stops[1]} />
          </linearGradient>
          <radialGradient id={`scrim-${id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#061d4a" stopOpacity="0.82" />
            <stop offset="0.62" stopColor="#061d4a" stopOpacity="0.6" />
            <stop offset="1" stopColor="#061d4a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {scrim && <circle cx={cx} cy={cy} r={r + stroke} fill={`url(#scrim-${id})`} />}
        <path d={d} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth={stroke} strokeLinecap="round" />
        {v > 0 && (
          <>
            {/* Soft glow under the value stroke: a wider, faint copy (no blur filter). */}
            <path d={d} fill="none" stroke={`url(#arc-${id})`} strokeOpacity="0.22" strokeWidth={stroke + 10} strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - v)} className="ring-draw" style={{ ['--ring-from' as string]: len, transition: 'stroke-dashoffset 0.9s var(--ease-out)' }} />
            <path d={d} fill="none" stroke={`url(#arc-${id})`} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - v)} className="ring-draw" style={{ ['--ring-from' as string]: len, transition: 'stroke-dashoffset 0.9s var(--ease-out)' }} />
            <circle cx={dx} cy={dy} r={stroke / 2 + 2.5} fill="#eef5ff" className="fade-in" style={{ animationDelay: '0.9s' }} />
          </>
        )}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center pb-2">{children}</div>}
    </div>
  );
}
