'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyCount } from '@/types';
import { formatDateStyle } from '@/i18n/format';
import { t } from '@/i18n/translate';
import { BAR_FILL, BAR_PEAK_FILL, barGradients } from './chartDefs';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, chartTitleClass, activities } from './chartTheme';

interface ActivityBarChartProps {
  data: DailyCount[];
  days?: number;
  title?: string;
}

export function ActivityBarChart({ data, days = 30, title }: ActivityBarChartProps) {
  const heading = title ?? t('charts.perDayDefault');
  const motion = useChartMotion();
  const chartData = (() => {
    const end = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const found = data.find(x => x.date === dateStr);
      result.push({
        date: dateStr,
        count: found?.count ?? 0,
        label: formatDateStyle(d, 'dayMonth'),
      });
    }
    return result;
  })();

  const maxVal = Math.max(1, ...chartData.map(d => d.count));
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <figure aria-label={t('charts.perDayAria', { title: heading, activities: activities(total), days })}>
      {title && <h4 className={chartTitleClass}>{title}</h4>}
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={chartData} barCategoryGap={days > 60 ? 1 : 2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          {barGradients()}
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tick={axisTick}
            className={AXIS_CLASS}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(days / 6) - 1)}
            minTickGap={8}
          />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [activities(v), '']} separator="" />
          <Bar {...motion} dataKey="count" radius={[6, 6, 2, 2]} maxBarSize={16}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === 0 ? BRAND_HEX : entry.count === maxVal ? BAR_PEAK_FILL : BAR_FILL}
                className={entry.count === 0 ? BAR_EMPTY_CLASS : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
