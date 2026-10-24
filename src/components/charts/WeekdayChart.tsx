'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { WeekdayStats } from '@/types';
import { tooltipProps, BRAND_HEX, chartTitleClass, plural } from './chartTheme';

interface WeekdayChartProps {
  data: WeekdayStats[];
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  const chartData = data.map(d => ({ day: d.shortDay, count: d.count, average: Math.round(d.average * 100) / 100 }));
  return (
    <figure aria-label={`Activity by day of week: ${chartData.map(d => `${d.day} ${d.count}`).join(', ')}`}>
      <h4 className={chartTitleClass}>Activity by day of week</h4>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="currentColor" className="text-line" />
          <PolarAngleAxis dataKey="day" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-muted" />
          <Radar name="Events" dataKey="count" stroke={BRAND_HEX} fill={BRAND_HEX} fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: BRAND_HEX }} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [plural(v, 'event'), '']} separator="" />
        </RadarChart>
      </ResponsiveContainer>
    </figure>
  );
}
