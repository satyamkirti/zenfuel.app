'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HourlyStats } from '@/types';

interface HourlyChartProps {
  data: HourlyStats[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Activity by Hour of Day</h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'currentColor', fontSize: 9 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={20}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v} sessions`, 'Count']}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === max && max > 0 ? '#6d28d9' : entry.count > 0 ? '#8b5cf6' : '#e2e8f0'}
                className={entry.count === 0 ? 'dark:fill-slate-700' : ''}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
