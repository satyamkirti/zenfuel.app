import type { CSSProperties } from 'react';

// ZenFuel's categorical palette for charts and habit colours: royal blue first, then the
// coordinated accents (purple, teal, orange, pink, cyan, green, yellow), a slate and a red, in an
// order where neighbouring chart series stay distinguishable. Users' saved habit colours are not
// changed; they are only displayed through this palette.

export const BRAND_PALETTE = [
  '#1877f2', // blue
  '#8b5cf6', // purple
  '#11bfa9', // teal
  '#ff982f', // orange
  '#f35c9b', // pink
  '#2cc8e8', // cyan
  '#22c77a', // green
  '#ffc83d', // yellow
  '#7b8ba3', // slate
  '#ef5350', // red
] as const;

/**
 * Each palette colour's partner for two-tone tiles, plus icon colours that stay readable on its
 * tint: `deep` on light surfaces, `light` on Blue Night surfaces.
 */
const SWATCH: Record<string, { pair: string; deep: string; light: string }> = {
  '#1877f2': { pair: '#11bfa9', deep: '#1265d8', light: '#6eb6f9' },
  '#8b5cf6': { pair: '#a855f7', deep: '#7c3aed', light: '#c4b5fd' },
  '#11bfa9': { pair: '#22c77a', deep: '#0b7b6f', light: '#6ee0cf' },
  '#ff982f': { pair: '#ffc83d', deep: '#c45e0c', light: '#ffb468' },
  '#f35c9b': { pair: '#f97373', deep: '#c02762', light: '#f9a3c6' },
  '#2cc8e8': { pair: '#1877f2', deep: '#0d6c88', light: '#67d8f0' },
  '#22c77a': { pair: '#11bfa9', deep: '#138352', light: '#6ad9a8' },
  '#ffc83d': { pair: '#ff982f', deep: '#b46609', light: '#ffd65a' },
  '#7b8ba3': { pair: '#b5c8e0', deep: '#4b5d78', light: '#b5c8e0' },
  '#ef5350': { pair: '#f97373', deep: '#b92d2b', light: '#f7a9a6' },
};

// Saved colours from the built-in habits and earlier palettes, mapped to their display colour.
// The built-in habits follow the category colours: social media blue/teal, gaming violet,
// short videos coral/pink, junk food amber/orange, smoking slate, alcohol emerald/mint.
const LEGACY: Record<string, string> = {
  '#3b82f6': '#1877f2', // social media
  '#ef4444': '#1877f2', // personal
  '#10b981': '#8b5cf6', // gaming
  '#f59e0b': '#f35c9b', // short videos
  '#f97316': '#ff982f', // junk food
  '#94a3b8': '#7b8ba3', // smoking
  '#84cc16': '#22c77a', // alcohol
  '#ec4899': '#f35c9b',
  '#06b6d4': '#2cc8e8',
  '#a855f7': '#8b5cf6',
  '#14b8a6': '#11bfa9',
  // Colours from earlier palettes.
  '#3887fa': '#1877f2',
  '#50dacc': '#11bfa9',
  '#f4b942': '#ffc83d',
  '#ef6262': '#ef5350',
  '#1452d9': '#1877f2',
  '#04c7c6': '#2cc8e8',
  '#8ebcff': '#2cc8e8',
  '#94aac0': '#7b8ba3',
  '#16b8a6': '#11bfa9',
  '#f5b82e': '#ffc83d',
  '#9270e8': '#8b5cf6',
  '#0d9b83': '#11bfa9',
  '#7adbcf': '#2cc8e8',
  '#b6a0f0': '#8b5cf6',
  '#8a9799': '#7b8ba3',
};

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The palette colour used to display a habit whose saved colour is `hex`. */
export function brandColor(hex: string | undefined, fallbackIndex = 0): string {
  const key = (hex ?? '').toLowerCase();
  if ((BRAND_PALETTE as readonly string[]).includes(key)) return key;
  if (LEGACY[key]) return LEGACY[key];
  const c = rgb(key);
  if (!c) return BRAND_PALETTE[fallbackIndex % BRAND_PALETTE.length];
  // Nearest palette colour by simple RGB distance.
  let best: string = BRAND_PALETTE[0];
  let bestD = Infinity;
  for (const p of BRAND_PALETTE) {
    const q = rgb(p)!;
    const d = (c[0] - q[0]) ** 2 + (c[1] - q[1]) ** 2 + (c[2] - q[2]) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

/**
 * Style variables for a palette colour: the two-tone icon tile (`tint` class) and the
 * colour-coded category card (`cat-card` / `cat-icon` classes), each with dark-mode values.
 */
export function tint(color: string): CSSProperties {
  const s = SWATCH[color] ?? SWATCH[brandColor(color)];
  return {
    '--t1': `${color}33`,
    '--t2': `${s.pair}1f`,
    '--t1d': `${color}4d`,
    '--t2d': `${s.pair}24`,
    '--ti': s.deep,
    '--tid': s.light,
    // Category card: wash, border, selected wash, and the solid colour for the selected icon.
    '--tc1': `${color}14`,
    '--tc2': `${s.pair}0d`,
    '--tc1on': `${color}2b`,
    '--tb': `${color}40`,
    '--tbh': `${color}80`,
    '--tsolid': color,
    '--tc1d': `${color}1f`,
    '--tc2d': `${s.pair}0f`,
    '--tc1ond': `${color}40`,
    '--tbd': `${color}4d`,
    '--tbhd': `${color}99`,
  } as CSSProperties;
}

/** Readable text colour on a solid fill of `color` (white, or deep navy on light fills). */
export function onColor(color: string): string {
  const c = rgb(color);
  if (!c) return '#ffffff';
  const [r, g, b] = c.map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Whichever of white and deep navy contrasts more (they are equal at L ≈ 0.2).
  return L > 0.2 ? '#071a40' : '#ffffff';
}

/** Colour for score values (0–100) on the shared good → bad scale. */
export function scoreColor(score: number): string {
  if (score >= 80) return '#22c77a';
  if (score >= 60) return '#1877f2';
  if (score >= 40) return '#ffc83d';
  return '#ef5350';
}
