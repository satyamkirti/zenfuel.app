'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HourlyStats } from '@/types';
import { BAR_FILL, BAR_PEAK_FILL, barGradients } from './chartDefs';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, chartTitleClass, activities } from './chartTheme';
import { t } from '@/i18n/translate';

interface HourlyChartProps {
  data: HourlyStats[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const motion = useChartMotion();
  const max = Math.max(1, ...data.map(d => d.count));
  const peak = data.find(d => d.count === max && d.count > 0);
  return (
    <figure aria-label={peak ? t('charts.hourlyAria', { hour: peak.label }) : t('charts.hourlyEmpty')}>
      <h4 className={chartTitleClass}>{t('charts.heading.hourly')}</h4>
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={data} barCategoryGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          {barGradients()}
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [activities(v), '']} separator="" />
          <Bar {...motion} dataKey="count" radius={[5, 5, 2, 2]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === 0 ? BRAND_HEX : entry.count === max ? BAR_PEAK_FILL : BAR_FILL}
                className={entry.count === 0 ? BAR_EMPTY_CLASS : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
