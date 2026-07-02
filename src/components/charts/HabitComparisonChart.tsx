'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HabitAnalytics } from '@/types';

interface HabitComparisonChartProps {
  data: HabitAnalytics[];
  period?: 'lifetime' | 'month' | 'week';
}

export function HabitComparisonChart({ data, period = 'lifetime' }: HabitComparisonChartProps) {
  const chartData = data
    .map(h => ({
      name: h.habitName,
      icon: h.habitIcon,
      count: period === 'month' ? h.monthCount : period === 'week' ? h.weekCount : h.lifetimeCount,
      color: h.habitColor,
    }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Habit Comparison</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={({ x, y, payload }) => (
              <text x={x - 4} y={y} textAnchor="end" dominantBaseline="central" fontSize={12} fill="currentColor" className="text-slate-600 dark:text-slate-400">
                {chartData.find(d => d.name === payload.value)?.icon} {payload.value}
              </text>
            )}
            width={110}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            formatter={(v: number) => [`${v} events`, 'Count']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
