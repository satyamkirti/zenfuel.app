import { useId } from 'react';

/*
  Original vector illustrations in the ZenFuel blue & teal palette. All are decorative (aria-hidden) and carry
  no figures: they never stand in for data.
*/

export type ChallengeArtKind = 'social' | 'video' | 'gaming' | 'calm' | 'food' | 'breath' | 'summit';

const ART: Record<Exclude<ChallengeArtKind, 'summit'>, { sky: [string, string]; glow: string; hill: [string, string]; ink: string; accent: string }> = {
  social: { sky: ['#1d3a8a', '#0c2456'], glow: '#8b5cf6', hill: ['#1a3f86', '#0e2858'], ink: '#c5dcfc', accent: '#48a8f5' },
  video: { sky: ['#2a2a7a', '#0f1f52'], glow: '#f35c9b', hill: ['#26357e', '#11245a'], ink: '#fccce1', accent: '#ef5350' },
  gaming: { sky: ['#2b2378', '#0f1a4c'], glow: '#a855f7', hill: ['#2a3283', '#121f56'], ink: '#ddd6fe', accent: '#2cc8e8' },
  calm: { sky: ['#0c3a6a', '#0a2246'], glow: '#11bfa9', hill: ['#0f4670', '#0b294e'], ink: '#a5eee2', accent: '#ffc83d' },
  food: { sky: ['#1d3a7a', '#0c2050'], glow: '#ff982f', hill: ['#1b4282', '#0e2758'], ink: '#ffe9d0', accent: '#ffc83d' },
  breath: { sky: ['#123f86', '#0a2352'], glow: '#2cc8e8', hill: ['#164a92', '#0c2c66'], ink: '#cff4fc', accent: '#48a8f5' },
};

function Motif({ kind, ink, accent }: { kind: Exclude<ChallengeArtKind, 'summit'>; ink: string; accent: string }) {
  switch (kind) {
    case 'social':
      // A phone set down, its chat bubbles fading away.
      return (
        <g>
          <g transform="rotate(-8)">
            <rect x="-22" y="-36" width="44" height="74" rx="9" fill="#071a40" stroke={ink} strokeOpacity="0.85" strokeWidth="2.5" />
            <rect x="-15" y="-27" width="30" height="50" rx="4" fill={ink} fillOpacity="0.12" />
            <rect x="-7" y="30" width="14" height="2.5" rx="1.25" fill={ink} fillOpacity="0.6" />
          </g>
          <g fill={ink}>
            <path d="M30 -40h34a9 9 0 0 1 9 9v10a9 9 0 0 1-9 9H44l-8 7v-7h-6a9 9 0 0 1-9-9v-10a9 9 0 0 1 9-9Z" fillOpacity="0.55" />
            <path d="M58 -6h24a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H66l-6 5v-5h-2a8 8 0 0 1-8-8v-6a8 8 0 0 1 8-8Z" fillOpacity="0.28" />
            <circle cx="88" cy="28" r="4" fillOpacity="0.16" />
          </g>
          <g fill="#071a40"><circle cx="40" cy="-26" r="2.4" /><circle cx="47" cy="-26" r="2.4" /><circle cx="54" cy="-26" r="2.4" /></g>
          <circle cx="-30" cy="-30" r="3" fill={accent} />
        </g>
      );
    case 'video':
      // A play button with a timer arc closing around it.
      return (
        <g>
          <circle r="34" fill="#071a40" fillOpacity="0.7" stroke={ink} strokeOpacity="0.25" strokeWidth="2" />
          <circle r="34" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" strokeDasharray="160 214" transform="rotate(-90)" />
          <path d="M-9 -15 L17 0 L-9 15 Z" fill={ink} />
          <g fill={accent}><circle cx="46" cy="-24" r="3" /><circle cx="-46" cy="20" r="2" fillOpacity="0.7" /></g>
          <path d="M44 22l8 0M48 18l0 8" stroke={ink} strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'gaming':
      // A controller resting, with a few sparks.
      return (
        <g>
          <path d="M-30 -18H30c12 0 18 10 20 24l3 16c2 10-7 16-15 8l-10-10h-56l-10 10c-8 8-17 2-15-8l3-16c2-14 8-24 20-24Z" fill="#071a40" stroke={ink} strokeOpacity="0.9" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M-30 -4v12M-36 2h12" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="24" cy="-3" r="3.6" fill={accent} />
          <circle cx="33" cy="5" r="3.6" fill={ink} />
          <g fill={ink}>
            <path d="M-56 -40l2.2 5.4 5.8.6-4.4 3.8 1.3 5.7-4.9-3-4.9 3 1.3-5.7-4.4-3.8 5.8-.6Z" fillOpacity="0.8" />
            <path d="M58 -38l1.6 3.8 4 .4-3 2.7.9 4-3.5-2.1-3.5 2.1.9-4-3-2.7 4-.4Z" fillOpacity="0.5" />
          </g>
        </g>
      );
    case 'calm':
      // A lotus opening at sunrise over still water. Deliberately says nothing about the habit.
      return (
        <g>
          <circle cy="-10" r="26" fill={accent} fillOpacity="0.9" />
          <g fill={ink}>
            {[-56, -28, 0, 28, 56].map(a => (
              <path key={a} d="M0 18C-11 4-8-16 0-26c8 10 11 30 0 44Z" transform={`rotate(${a} 0 18)`} fillOpacity={a === 0 ? 1 : 0.65} />
            ))}
          </g>
          <g stroke={ink} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M-50 30h100" /><path d="M-34 38h68" strokeOpacity="0.28" />
          </g>
        </g>
      );
    case 'food':
      // An apple with a fresh leaf.
      return (
        <g>
          <path d="M0-14c-10-8-34-6-36 18-2 22 14 40 26 40 4 0 6-2 10-2s6 2 10 2c12 0 28-18 26-40-2-24-26-26-36-18Z" fill="#071a40" stroke={ink} strokeOpacity="0.9" strokeWidth="2.5" />
          <path d="M0-14c0-8 2-14 6-18" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M6-30c12-10 26-8 30-2-8 10-22 10-30 2Z" fill={accent} />
          <path d="M-18 4c-2 8 0 16 4 22" stroke={ink} strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'breath':
      // Air moving freely, and a sprout growing.
      return (
        <g fill="none" strokeLinecap="round">
          <g stroke={ink} strokeWidth="3">
            <path d="M-64-14h60a12 12 0 1 0-12-12" />
            <path d="M-50 4h78a10 10 0 1 1-10 10" strokeOpacity="0.7" />
            <path d="M-70 20h36" strokeOpacity="0.45" />
          </g>
          <path d="M44 34V8" stroke={accent} strokeWidth="3" />
          <path d="M44 16c-12 0-18-8-18-16 10 0 18 6 18 16Z" fill={accent} stroke="none" />
          <path d="M44 10c10 0 16-8 16-16-9 0-16 6-16 16Z" fill={accent} fillOpacity="0.7" stroke="none" />
        </g>
      );
  }
}

/** A banner scene per challenge kind, so a list of challenges does not repeat one picture. */
export function ChallengeArt({ kind, className }: { kind: Exclude<ChallengeArtKind, 'summit'>; className?: string }) {
  const id = useId().replace(/:/g, '');
  const c = ART[kind];
  return (
    <svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.sky[0]} /><stop offset="1" stopColor={c.sky[1]} /></linearGradient>
        <radialGradient id={`${id}g`} cx="0.7" cy="0.42" r="0.45"><stop offset="0" stopColor={c.glow} stopOpacity="0.42" /><stop offset="1" stopColor={c.glow} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="360" height="120" fill={`url(#${id}s)`} />
      <rect width="360" height="120" fill={`url(#${id}g)`} />
      <g fill={c.ink} fillOpacity="0.35">
        <circle cx="40" cy="22" r="1.2" /><circle cx="92" cy="40" r="1" /><circle cx="150" cy="16" r="1.4" /><circle cx="330" cy="26" r="1.1" /><circle cx="196" cy="34" r="0.9" />
      </g>
      <path d="M0 90C60 74 120 86 180 80S300 70 360 84V120H0Z" fill={c.hill[0]} />
      <path d="M0 104C80 94 160 102 240 96S330 98 360 102V120H0Z" fill={c.hill[1]} />
      <g transform="translate(252 58)"><Motif kind={kind} ink={c.ink} accent={c.accent} /></g>
    </svg>
  );
}

/** A decorative chart for empty Analytics: soft bars and a trend line, no values or axes. */
export function ChartPreviewArt({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const bars = [46, 62, 38, 70, 54, 30, 44];
  return (
    <svg viewBox="0 0 280 150" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#48a8f5" /><stop offset="1" stopColor="#1769f5" /></linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.45" r="0.55"><stop offset="0" stopColor="#2cc8e8" stopOpacity="0.22" /><stop offset="1" stopColor="#2cc8e8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="280" height="150" fill={`url(#${id}g)`} />
      <rect x="30" y="18" width="220" height="118" rx="18" className="fill-surface stroke-line" strokeWidth="1.5" />
      <g className="stroke-line" strokeWidth="1" strokeDasharray="3 5">
        <path d="M48 52H232M48 80H232M48 108H232" />
      </g>
      {bars.map((h, i) => (
        <rect key={i} x={54 + i * 26} y={118 - h} width="16" height={h} rx="6" fill={`url(#${id}b)`} fillOpacity={i === 6 ? 0.95 : 0.28 + i * 0.05} />
      ))}
      <path d="M62 76C88 66 104 92 130 72S176 50 198 62 222 84 238 70" fill="none" stroke="#2cc8e8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="238" cy="70" r="5" fill="#2cc8e8" stroke="#071a40" strokeWidth="2" />
      <g transform="translate(232 24)">
        <circle r="17" fill="#8b5cf6" />
        <path d="M0-8l2.3 5.7L8-0l-5.7 2.3L0 8l-2.3-5.7L-8 0l5.7-2.3Z" fill="#fff" />
      </g>
    </svg>
  );
}

/** A phone with a time ring, for Screen Time set-up and access states. */
export function PhoneTimeArt({ className, tone = 'teal' }: { className?: string; tone?: 'teal' | 'warn' }) {
  const id = useId().replace(/:/g, '');
  const ring = tone === 'warn' ? '#ffc83d' : '#2cc8e8';
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={ring} stopOpacity="0.28" /><stop offset="1" stopColor={ring} stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#${id}g)`} />
      <rect x="38" y="20" width="44" height="80" rx="10" fill="#071a40" stroke="#30568e" strokeWidth="2.5" />
      <rect x="44" y="28" width="32" height="56" rx="5" fill="#0d244c" />
      <circle cx="60" cy="56" r="14" fill="none" stroke="#1f4070" strokeWidth="4" />
      <circle cx="60" cy="56" r="14" fill="none" stroke={ring} strokeWidth="4" strokeLinecap="round" strokeDasharray="58 88" transform="rotate(-90 60 56)" />
      <path d="M60 49v7l4.5 3" stroke="#f0f6ff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="53" y="91" width="14" height="3" rx="1.5" fill="#30568e" />
      {tone === 'warn'
        ? <g transform="translate(86 30)"><circle r="11" fill="#ffc83d" /><path d="M0-5v5.5" stroke="#071a40" strokeWidth="2.6" strokeLinecap="round" /><circle cy="5" r="1.5" fill="#071a40" /></g>
        : <g transform="translate(86 30)"><circle r="11" fill="#2cc8e8" /><path d="M-4.5 0.5l3 3 6-6.5" stroke="#071a40" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>}
    </svg>
  );
}

/** Which banner a challenge gets, from its habit. Hidden Mode always uses the neutral summit. */
export function challengeArtKind(habitId: string, category: string | undefined, masked: boolean): ChallengeArtKind {
  if (masked || habitId === 'all') return 'summit';
  if (habitId === 'short-videos' || habitId === 'youtube' || habitId === 'netflix' || habitId === 'binge-watching') return 'video';
  if (habitId === 'gaming') return 'gaming';
  if (category === 'adult') return 'calm';
  if (category === 'food') return 'food';
  if (category === 'substance') return 'breath';
  if (category === 'digital') return 'social';
  return 'summit';
}
