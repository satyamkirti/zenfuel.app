// SVG gradients shared by the bar charts. Recharts renders a <defs> element placed directly
// inside a chart, so each chart calls barGradients() as its first child.
export const BAR_FILL = 'url(#zf-bar)';
export const BAR_PEAK_FILL = 'url(#zf-bar-peak)';

export function barGradients(horizontal = false) {
  const dir = horizontal ? { x1: 0, y1: 0, x2: 1, y2: 0 } : { x1: 0, y1: 0, x2: 0, y2: 1 };
  return (
    <defs>
      <linearGradient id="zf-bar" {...dir}>
        <stop offset="0%" stopColor="#1877f2" />
        <stop offset="100%" stopColor="#1265d8" />
      </linearGradient>
      <linearGradient id="zf-bar-peak" {...dir}>
        <stop offset="0%" stopColor="#2cc8e8" />
        <stop offset="100%" stopColor="#1877f2" />
      </linearGradient>
    </defs>
  );
}
