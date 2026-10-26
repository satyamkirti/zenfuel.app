// Shared chart styling. Tooltip styles are inline (CSS variables resolve there); mark colours
// are Tailwind fill classes because SVG presentation attributes cannot read CSS variables.

export const tooltipProps = {
  contentStyle: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--line))',
    borderRadius: 12,
    fontSize: 12,
    padding: '8px 10px',
    boxShadow: 'var(--shadow-pop)',
    color: 'rgb(var(--ink))',
  },
  labelStyle: { color: 'rgb(var(--ink))', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'rgb(var(--ink-2))', padding: 0 },
  cursor: { fill: 'rgba(139, 92, 246, 0.08)' },
};

export const axisTick = { fill: 'currentColor', fontSize: 11 };
export const AXIS_CLASS = 'text-muted';
export const GRID_CLASS = 'text-line';

// Single-series sequential blue: regular, peak, and empty (zero) bars.
export const BAR_CLASS = 'fill-blue-500 dark:fill-blue-400';
export const BAR_PEAK_CLASS = 'fill-blue-700 dark:fill-blue-200';
export const BAR_EMPTY_CLASS = 'fill-line';
export const BRAND_HEX = '#087FF5';
export const AVERAGE_HEX = '#d97706';

export const chartTitleClass = 'text-sm font-semibold text-ink mb-3';

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
