import { t } from '@/i18n/translate';
// Shared chart styling. Tooltip styles are inline (CSS variables resolve there); mark colours
// are Tailwind fill classes because SVG presentation attributes cannot read CSS variables.

export const tooltipProps = {
  contentStyle: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--line))',
    borderRadius: 14,
    fontSize: 12,
    padding: '8px 12px',
    boxShadow: 'var(--shadow-pop)',
    color: 'rgb(var(--ink))',
  },
  labelStyle: { color: 'rgb(var(--ink))', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'rgb(var(--ink-2))', padding: 0 },
  cursor: { fill: 'rgba(24, 119, 242, 0.08)' },
};

export const axisTick = { fill: 'currentColor', fontSize: 11 };
export const AXIS_CLASS = 'text-muted';
export const GRID_CLASS = 'text-line';

// Single-series bars use the gradients in chartDefs.tsx; these classes are the solid fallbacks.
export const BAR_CLASS = 'fill-blue-500 dark:fill-blue-400';
export const BAR_PEAK_CLASS = 'fill-cyan-400 dark:fill-cyan-300';
export const BAR_EMPTY_CLASS = 'fill-line dark:fill-surface-3';
export const BRAND_HEX = '#1877f2';
export const TEAL_HEX = '#2cc8e8';
export const AVERAGE_HEX = '#8b5cf6';
export const PURPLE_HEX = '#8b5cf6';

export const chartTitleClass = 'font-display text-[15px] font-semibold tracking-tight text-ink mb-3';

/** "3 activities" in the interface language (tooltips and chart labels). */
export const activities = (n: number) => t('quicklog.activities', { count: n });
