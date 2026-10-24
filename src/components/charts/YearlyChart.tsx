'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { YearlyCount } from '@/types';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_CLASS, BRAND_HEX, chartTitleClass, plural } from './chartTheme';

interface YearlyChartProps {
  data: YearlyCount[];
}

export function YearlyChart({ data }: YearlyChartProps) {
  return (
    <figure aria-label={`Year over year: ${data.map(d => `${d.year} ${d.count}`).join(', ')}`}>
      <h4 className={chartTitleClass}>Year over year</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} />
          <XAxis dataKey="year" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [plural(v, 'event'), '']} separator="" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => <Cell key={i} fill={BRAND_HEX} className={BAR_CLASS} />)}
            <LabelList dataKey="count" position="top" className="fill-ink-2" style={{ fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
