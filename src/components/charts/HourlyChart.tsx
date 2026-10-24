'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HourlyStats } from '@/types';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_CLASS, BAR_PEAK_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, chartTitleClass, plural } from './chartTheme';

interface HourlyChartProps {
  data: HourlyStats[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const max = Math.max(1, ...data.map(d => d.count));
  const peak = data.find(d => d.count === max && d.count > 0);
  return (
    <figure aria-label={peak ? `Activity by hour of day. Busiest hour: ${peak.label}` : 'Activity by hour of day: no data'}>
      <h4 className={chartTitleClass}>Activity by hour of day</h4>
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={data} barCategoryGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} interval={3} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [plural(v, 'event'), '']} separator="" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={BRAND_HEX}
                className={entry.count === 0 ? BAR_EMPTY_CLASS : entry.count === max ? BAR_PEAK_CLASS : BAR_CLASS}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
