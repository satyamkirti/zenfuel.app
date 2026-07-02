'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MonthlyCount } from '@/types';

interface MonthlyChartProps {
  data: MonthlyCount[];
  averagePerMonth?: number;
}

export function MonthlyChart({ data, averagePerMonth }: MonthlyChartProps) {
  const chartData = data.slice(-24);

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Monthly Trend</h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={24}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v} sessions`, 'Month total']}
          />
          {averagePerMonth && (
            <ReferenceLine y={averagePerMonth} stroke="#f59e0b" strokeDasharray="4 2" />
          )}
          <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#monthGrad)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
