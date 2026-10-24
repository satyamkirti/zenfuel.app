'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyCount } from '@/types';
import { SHORT_MONTHS } from '@/utils/dateUtils';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_CLASS, BAR_PEAK_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, chartTitleClass, plural } from './chartTheme';

interface ActivityBarChartProps {
  data: DailyCount[];
  days?: number;
  title?: string;
}

export function ActivityBarChart({ data, days = 30, title = 'Daily Activity' }: ActivityBarChartProps) {
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
        label: `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`,
      });
    }
    return result;
  })();

  const maxVal = Math.max(1, ...chartData.map(d => d.count));
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <figure aria-label={`${title}: ${plural(total, 'event')} in the last ${days} days`}>
      {title && <h4 className={chartTitleClass}>{title}</h4>}
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={chartData} barCategoryGap={days > 60 ? 1 : 2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} />
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
          <Tooltip {...tooltipProps} formatter={(v: number) => [plural(v, 'event'), '']} separator="" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={14}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={BRAND_HEX}
                className={entry.count === 0 ? BAR_EMPTY_CLASS : entry.count === maxVal ? BAR_PEAK_CLASS : BAR_CLASS}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
