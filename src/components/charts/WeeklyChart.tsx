'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { WeeklyCount } from '@/types';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, AVERAGE_HEX, chartTitleClass, plural } from './chartTheme';

interface WeeklyChartProps {
  data: WeeklyCount[];
  averagePerWeek?: number;
}

export function WeeklyChart({ data, averagePerWeek }: WeeklyChartProps) {
  const chartData = data.slice(-16);

  return (
    <figure aria-label={`Weekly activity over ${plural(chartData.length, 'week')}${averagePerWeek ? `, average ${averagePerWeek.toFixed(1)} per week` : ''}`}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-ink">Weekly activity</h4>
        {!!averagePerWeek && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-3 border-t-2 border-dashed border-amber-600" aria-hidden="true" />
            Average {averagePerWeek.toFixed(1)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [plural(v, 'event'), '']} separator="" />
          {!!averagePerWeek && <ReferenceLine y={averagePerWeek} stroke={AVERAGE_HEX} strokeDasharray="4 3" />}
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={BRAND_HEX} className={entry.count === 0 ? BAR_EMPTY_CLASS : BAR_CLASS} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
