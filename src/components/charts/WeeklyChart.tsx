'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeeklyCount } from '@/types';

interface WeeklyChartProps {
  data: WeeklyCount[];
  averagePerWeek?: number;
}

export function WeeklyChart({ data, averagePerWeek }: WeeklyChartProps) {
  const chartData = data.slice(-16);

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Weekly Activity</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
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
            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            formatter={(v: number) => [`${v} sessions`, 'Week total']}
          />
          {averagePerWeek && (
            <ReferenceLine y={averagePerWeek} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
          )}
          <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
