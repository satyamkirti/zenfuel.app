'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * ZenFuel's signature landscape: layered mountains with a glowing sun rising behind the far ridge
 * (or, at night, a crescent moon), drifting clouds, mist, a small waterfall and a few stars.
 *
 * All motion is CSS (see "Mountain scene" in globals.css) on transform and opacity only, so it runs
 * on the compositor with no JavaScript loop. It pauses when the scene is off screen or the app is
 * in the background, and is a still frame when reduced motion is requested.
 *
 * This file imports only React so the brand script can render the same artwork as a still frame
 * for the Android launch screen.
 */
interface MountainSceneProps {
  className?: string;
  /** A still frame: no animation at all (challenge banners, launch screen). */
  still?: boolean;
  /** Plant a small flag on a summit (challenge banners). */
  flag?: boolean;
  /** Move the sun left or right (in scene units) so repeated banners look different. */
  sunShift?: number;
  /** Frame the band with the sun and ridges, for short, wide banners. */
  banner?: boolean;
  /**
   * Theme-aware colours (the Home hero): a bright daytime landscape in light mode and a rich blue
   * one in dark mode, from the --ms-* variables in globals.css. Without it (banners, launch
   * screen) the scene keeps its fixed dusk colours, which are also the fallbacks here.
   */
  themed?: boolean;
  /**
   * The sun (`day`) or a crescent moon with a night sky (`night`). The Home hero sets it from
   * the device's local time; a change cross-fades. Other scenes keep the sun.
   */
  phase?: 'day' | 'night';
}

// Wide framing only: the waterfall at 55% width and 42% height, scaled about its base on the hills,
// and leaning gently with the slope (which falls to the right) so it reads as water, not a spire.
const FALLS_WIDE = 'translate(134.6 205) skewX(14) scale(0.55 0.42) translate(-134.6 -205)';

export function MountainScene({ className = '', still = false, flag = false, sunShift = 0, banner = false, themed = false, phase = 'day' }: MountainSceneProps) {
  // A colour (and optional opacity) that follows the theme when `themed`, else the fixed value.
  const c = (name: string, color: string, opacity?: number) => themed
    ? { style: { stopColor: `var(--ms-${name}, ${color})`, ...(opacity !== undefined ? { stopOpacity: `var(--ms-${name}-o, ${opacity})` } : {}) } }
    : { stopColor: color, ...(opacity !== undefined ? { stopOpacity: opacity } : {}) };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `ms${uid}${name}`;
  const ref = useRef<SVGSVGElement>(null);

  // Pause while off screen. (Backgrounding is handled globally by MotionController.)
  useEffect(() => {
    const el = ref.current;
    if (still || !el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.removeAttribute('data-paused');
      else el.setAttribute('data-paused', '');
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  const sunX = 252 + sunShift;
  const sunY = 142;
  // The moon sits higher than the sun, to the right of the greeting, above the far ridge.
  const moonX = banner ? 300 : 306;
  const moonY = banner ? 118 : 96;
  // Only the Home hero changes with the time of day, so only it carries the moon.
  const hasMoon = themed || phase === 'night';

  return (
    <svg
      ref={ref}
      className={`ms ${still ? 'ms-still' : ''} ${banner ? 'ms-banner' : ''} ${themed ? 'ms-themed' : ''} ${phase === 'night' ? 'ms-night' : ''} ${className}`}
      viewBox={banner ? '0 96 400 112' : '0 0 400 240'}
      preserveAspectRatio={banner ? 'xMidYMid slice' : 'xMidYMax slice'}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          {/* Premium blue sky: deep navy overhead, royal and sky blue lower down, warm light at the horizon. */}
          <stop offset="0" {...c('sky0', '#082a6a')} />
          <stop offset="0.36" {...c('sky1', '#1265d8')} />
          <stop offset="0.66" {...c('sky2', '#1877f2')} />
          <stop offset="0.84" {...c('sky3', '#48a8f5')} />
          <stop offset="1" {...c('sky4', '#ffc98a')} />
        </linearGradient>
        {/* Warm light only close to the sun, so the rest of the sky stays clearly blue. */}
        <radialGradient id={id('warm')} cx={sunX / 400} cy={sunY / 240} r="0.42">
          <stop offset="0" {...c('warm', '#ffb85c', 0.45)} />
          <stop offset="0.4" stopColor="#f5a04a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#f5a04a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('bloom')}>
          <stop offset="0" {...c('bloom0', '#ffe7a3', 0.55)} />
          <stop offset="0.3" {...c('bloom1', '#f9cd5c', 0.22)} />
          <stop offset="0.65" stopColor="#f5b82e" stopOpacity="0.07" />
          <stop offset="1" stopColor="#f5b82e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#ffe08a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f5b82e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('core')} cx="0.42" cy="0.4">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.55" stopColor="#ffeab0" />
          <stop offset="1" stopColor="#f7c242" />
        </radialGradient>
        <linearGradient id={id('ray')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" {...c('ray0', '#ffe7a3', 0.16)} />
          <stop offset="0.7" {...c('ray1', '#ffe7a3', 0.03)} />
          <stop offset="1" stopColor="#ffe7a3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('far')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" {...c('far0', '#2f63b8', 0.72)} />
          <stop offset="1" {...c('far1', '#123f86', 0.96)} />
        </linearGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8ebcff" stopOpacity="0.15" />
          <stop offset={(sunX - 60) / 400} stopColor="#ffd77a" stopOpacity="0.15" />
          <stop offset={sunX / 400} stopColor="#ffe7a3" stopOpacity="0.85" />
          <stop offset={(sunX + 60) / 400} stopColor="#ffd77a" stopOpacity="0.2" />
          <stop offset="1" stopColor="#8ebcff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={id('mid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" {...c('mid0', '#164a92')} />
          <stop offset="1" {...c('mid1', '#0c2c66')} />
        </linearGradient>
        <linearGradient id={id('near')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" {...c('near0', '#0c2a5e')} />
          <stop offset="1" {...c('near1', '#071a40')} />
        </linearGradient>
        <linearGradient id={id('mist')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dcff" stopOpacity="0" />
          <stop offset="0.5" {...c('mist', '#c9dcff', 0.13)} />
          <stop offset="1" stopColor="#c9dcff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('cloud')}>
          <stop offset="0" {...c('cloud0', '#eef5ff', 0.26)} />
          <stop offset="0.6" {...c('cloud1', '#d6e6ff', 0.1)} />
          <stop offset="1" stopColor="#d6e6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('fade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#071a40" stopOpacity="0" />
          <stop offset="1" {...c('fade', '#071a40', 0.85)} />
        </linearGradient>
        <radialGradient id={id('cloudWarm')}>
          <stop offset="0" {...c('cw0', '#ffe7b0', 0.24)} />
          <stop offset="0.6" {...c('cw1', '#f9cd5c', 0.08)} />
          <stop offset="1" stopColor="#f9cd5c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="1">
          {/* Transparent at the very top, so the water emerges from the rock. */}
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.14" {...c('water0', '#eaf6ff', 0.95)} />
          <stop offset="0.55" {...c('water1', '#a9d8f7', 0.8)} />
          <stop offset="1" {...c('water2', '#a9d8f7', 0.5)} />
        </linearGradient>
        {hasMoon && (
          <>
            <radialGradient id={id('moonlight')} cx={moonX / 400} cy={moonY / 240} r="0.4">
              <stop offset="0" stopColor="#dfe8ff" stopOpacity="0.32" />
              <stop offset="0.45" stopColor="#b9cdf7" stopOpacity="0.1" />
              <stop offset="1" stopColor="#b9cdf7" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('moonHalo')}>
              <stop offset="0" stopColor="#f4f7ff" stopOpacity="0.6" />
              <stop offset="0.5" stopColor="#dbe6ff" stopOpacity="0.2" />
              <stop offset="1" stopColor="#dbe6ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('moonCore')} cx="0.35" cy="0.4">
              <stop offset="0" stopColor="#fffef6" />
              <stop offset="0.7" stopColor="#fbf6df" />
              <stop offset="1" stopColor="#ece5c4" />
            </radialGradient>
            {/* Moonlight along the ridges, brightest below the moon. */}
            <linearGradient id={id('rimMoon')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#a9c1f2" stopOpacity="0.12" />
              <stop offset={(moonX - 70) / 400} stopColor="#c9d8fa" stopOpacity="0.22" />
              <stop offset={moonX / 400} stopColor="#eef3ff" stopOpacity="0.9" />
              <stop offset={Math.min(1, (moonX + 70) / 400)} stopColor="#c9d8fa" stopOpacity="0.25" />
              <stop offset="1" stopColor="#a9c1f2" stopOpacity="0.15" />
            </linearGradient>
            <mask id={id('crescent')} maskUnits="userSpaceOnUse" x={moonX - 20} y={moonY - 20} width="40" height="40">
              <circle cx={moonX} cy={moonY} r="12" fill="#fff" />
              <circle cx={moonX + 5.5} cy={moonY - 3.5} r="10.6" fill="#000" />
            </mask>
          </>
        )}
      </defs>

      {/* Sky and warm light around the sun (the light slowly breathes) */}
      <rect x="-60" y="-20" width="520" height="280" fill={`url(#${id('sky')})`} />
      <g className="ms-day-only">
        <rect className="ms-light" x="-60" y="-20" width="520" height="280" fill={`url(#${id('warm')})`} />
      </g>
      {hasMoon && (
        <g className="ms-night-only">
          <rect className="ms-moonlight" x="-60" y="-20" width="520" height="280" fill={`url(#${id('moonlight')})`} />
        </g>
      )}

      {/* Stars in the darker upper sky */}
      <g className="ms-stars" fill="#eef5ff" style={themed ? { opacity: 'var(--ms-stars-o, 1)' } : undefined}>
        <circle cx="34" cy="22" r="0.9" />
        <circle cx="92" cy="12" r="0.7" style={{ animationDelay: '-2s' }} />
        <circle cx="150" cy="30" r="0.8" style={{ animationDelay: '-4s' }} />
        <circle cx="212" cy="10" r="0.6" style={{ animationDelay: '-1s' }} />
        <circle cx="62" cy="48" r="0.6" style={{ animationDelay: '-3s' }} />
        <circle cx="372" cy="20" r="0.8" style={{ animationDelay: '-5s' }} />
      </g>

      {/* The sun: bloom, slow light rays, halo and a luminous core, rising behind the far ridge */}
      <g className="ms-day-only"><g className="ms-sun">
        <circle className="ms-bloom" cx={sunX} cy={sunY} r="150" fill={`url(#${id('bloom')})`} />
        <g className="ms-rays" style={{ transformOrigin: `${sunX}px ${sunY}px` }} fill={`url(#${id('ray')})`}>
          <path d={`M${sunX} ${sunY} L${sunX - 90} ${sunY - 150} L${sunX - 70} ${sunY - 150} Z`} />
          <path d={`M${sunX} ${sunY} L${sunX - 22} ${sunY - 160} L${sunX - 6} ${sunY - 160} Z`} />
          <path d={`M${sunX} ${sunY} L${sunX + 40} ${sunY - 160} L${sunX + 58} ${sunY - 160} Z`} />
          <path d={`M${sunX} ${sunY} L${sunX + 110} ${sunY - 140} L${sunX + 128} ${sunY - 132} Z`} />
        </g>
        <circle className="ms-halo" cx={sunX} cy={sunY} r="44" fill={`url(#${id('halo')})`} />
        <circle cx={sunX} cy={sunY} r="17" fill={`url(#${id('core')})`} />
      </g></g>

      {/* The crescent moon: a soft halo, the faint unlit disc and the lit crescent, gently floating */}
      {hasMoon && (
        <g className="ms-night-only"><g className="ms-moon">
          <circle className="ms-moon-halo" cx={moonX} cy={moonY} r="38" fill={`url(#${id('moonHalo')})`} />
          <circle cx={moonX} cy={moonY} r="12" fill="#c9d6f5" fillOpacity="0.16" />
          <circle cx={moonX} cy={moonY} r="12" fill={`url(#${id('moonCore')})`} mask={`url(#${id('crescent')})`} />
        </g></g>
      )}

      {/* Distant range: hazy, with a warm rim where the sun catches it. A valley lets the sun show. */}
      <g className="ms-par-far"><g className="ms-drift-far">
        <path
          d="M-60 160 L-30 150 L-8 154 L14 140 L28 144 L46 128 L58 132 L72 120 L88 134 L104 128 L120 140 L138 126 L150 130 L166 114 L180 122 L196 136 L212 144 L228 150 L244 156 L262 154 L278 146 L292 132 L306 136 L320 118 L332 124 L348 110 L364 122 L380 130 L398 120 L420 132 L460 126 L460 260 L-60 260 Z"
          fill={`url(#${id('far')})`}
        />
        <path
          d="M-60 160 L-30 150 L-8 154 L14 140 L28 144 L46 128 L58 132 L72 120 L88 134 L104 128 L120 140 L138 126 L150 130 L166 114 L180 122 L196 136 L212 144 L228 150 L244 156 L262 154 L278 146 L292 132 L306 136 L320 118 L332 124 L348 110 L364 122 L380 130 L398 120 L420 132 L460 126"
          className="ms-day-only" fill="none" stroke={`url(#${id('rim')})`} strokeWidth="1.1" strokeLinejoin="round"
        />
        {hasMoon && (
          <path
            d="M-60 160 L-30 150 L-8 154 L14 140 L28 144 L46 128 L58 132 L72 120 L88 134 L104 128 L120 140 L138 126 L150 130 L166 114 L180 122 L196 136 L212 144 L228 150 L244 156 L262 154 L278 146 L292 132 L306 136 L320 118 L332 124 L348 110 L364 122 L380 130 L398 120 L420 132 L460 126"
            className="ms-night-only" fill="none" stroke={`url(#${id('rimMoon')})`} strokeWidth="1.2" strokeLinejoin="round"
          />
        )}
      </g></g>

      {/* Clouds drift slowly across, at different speeds and depths */}
      <g className="ms-cloud ms-cloud-a">
        <ellipse cx="40" cy="78" rx="62" ry="13" fill={`url(#${id('cloudWarm')})`} />
        <ellipse cx="72" cy="72" rx="38" ry="11" fill={`url(#${id('cloudWarm')})`} />
      </g>
      <g className="ms-cloud ms-cloud-b">
        <ellipse cx="40" cy="104" rx="74" ry="11" fill={`url(#${id('cloud')})`} />
        <ellipse cx="0" cy="100" rx="40" ry="9" fill={`url(#${id('cloud')})`} />
      </g>
      <g className="ms-cloud ms-cloud-c">
        <ellipse cx="40" cy="54" rx="48" ry="9" fill={`url(#${id('cloud')})`} />
      </g>

      {/* Middle range */}
      <g className="ms-par-mid"><g className="ms-drift-mid">
        <path
          d="M-60 204 L-30 196 L-10 184 L8 188 L26 172 L40 176 L58 160 L70 166 L84 154 L98 166 L112 172 L128 168 L146 182 L164 176 L184 188 L200 180 L216 186 L236 176 L252 182 L270 172 L286 160 L300 166 L316 156 L332 170 L350 178 L368 168 L386 176 L410 166 L460 178 L460 260 L-60 260 Z"
          fill={`url(#${id('mid')})`}
        />
        <path
          d="M-30 196 L-10 184 L8 188 L26 172 L40 176 L58 160 L70 166 L84 154 L98 166 L112 172 L128 168 L146 182 L164 176 L184 188 L200 180 L216 186 L236 176 L252 182 L270 172 L286 160 L300 166 L316 156 L332 170 L350 178 L368 168 L386 176 L410 166 L460 178"
          className="ms-day-only" fill="none" stroke="#ffd77a" strokeOpacity="0.16" strokeWidth="0.8" strokeLinejoin="round"
        />
        {hasMoon && (
          <path
            d="M-30 196 L-10 184 L8 188 L26 172 L40 176 L58 160 L70 166 L84 154 L98 166 L112 172 L128 168 L146 182 L164 176 L184 188 L200 180 L216 186 L236 176 L252 182 L270 172 L286 160 L300 166 L316 156 L332 170 L350 178 L368 168 L386 176 L410 166 L460 178"
            className="ms-night-only" fill="none" stroke="#e3ecff" strokeOpacity="0.26" strokeWidth="0.8" strokeLinejoin="round"
          />
        )}
        {/* A narrow waterfall emerging just below the ridge and widening as it cascades down to
            the near hills: the water, three streams of light flowing down it, a splash at the
            ledge and spray where it lands. Home hero only. The wide framing (tablets and desktops)
            enlarges the whole scene, so there the same waterfall is drawn smaller, anchored where
            it meets the hills: narrower and shorter, keeping the same spot on the slope. */}
        {themed && <g className="ms-falls" transform={banner ? FALLS_WIDE : undefined}>
          <path d="M133.4 175 C 133.6 181 132.4 187 131.6 193 C 130.9 198 130.2 203 129.8 220 L139.4 220 C 138.6 203 137.6 198 136.8 193 C 136 187 135.4 181 135 175 Z" fill={`url(#${id('water')})`} />
          <path className="ms-fall ms-fall-a" d="M134.2 177 C 134.3 183 133.4 190 132.9 196 C 132.4 202 132.2 208 132.2 220" stroke="#fff" strokeOpacity="0.95" strokeWidth="0.9" strokeDasharray="4 8" strokeLinecap="round" fill="none" />
          <path className="ms-fall ms-fall-b" d="M135 179 C 135.1 185 135.6 192 136 198 C 136.4 204 136.8 210 137 220" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.7" strokeDasharray="3 9" strokeLinecap="round" fill="none" />
          <path className="ms-fall ms-fall-c" d="M134.5 182 C 134.5 189 134.4 196 134.6 220" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.6" strokeDasharray="2 10" strokeLinecap="round" fill="none" />
          <ellipse className="ms-spray ms-spray-b" cx="134.3" cy="189" rx="3" ry="1.1" fill="#fff" fillOpacity="0.6" />
          <ellipse cx="134.6" cy="205" rx="12" ry="4" fill="#fff" fillOpacity="0.18" />
          <ellipse className="ms-spray" cx="134.6" cy="204.4" rx="8.5" ry="2.6" fill="#fff" fillOpacity="0.6" />
        </g>}
        {flag && (
          <g>
            <line x1="84" y1="154" x2="84" y2="136" stroke="#eef5ff" strokeWidth="1.1" />
            <path className="ms-flag" d="M84 136 L97 140 L84 144 Z" fill="#11bfa9" />
          </g>
        )}
      </g></g>

      {/* Mist between the middle and near ranges */}
      <rect className="ms-mist" x="-60" y="178" width="520" height="34" fill={`url(#${id('mist')})`} />

      {/* Near range with pine silhouettes */}
      <g className="ms-par-near"><g className="ms-drift-near">
        <path
          d="M-60 260 L-60 214 L-20 206 L10 200 L36 208 L60 198 L84 190 L108 196 L130 206 L156 200 L180 208 L206 204 L232 214 L258 204 L280 196 L300 200 L324 210 L350 198 L372 192 L396 200 L420 206 L460 200 L460 260 Z"
          fill={`url(#${id('near')})`}
        />
        <g className="ms-trees" fill="#061536" style={themed ? { fill: 'var(--ms-tree, #061536)' } : undefined}>
          {[[4, 202], [12, 201], [76, 193], [86, 191], [95, 193], [272, 199], [282, 197], [291, 199], [362, 195], [372, 193], [381, 195]].map(([x, y], i) => (
            <path key={i} d={`M${x - 4} ${y + 2} L${x} ${y - 13 - (i % 3) * 3} L${x + 4} ${y + 2} Z`} />
          ))}
        </g>
      </g></g>

      {/* Fade into the card at the bottom */}
      <rect x="-60" y="196" width="520" height="60" fill={`url(#${id('fade')})`} />
    </svg>
  );
}
