'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { YearlyCount } from '@/types';

interface YearlyChartProps {
  data: YearlyCount[];
}

export function YearlyChart({ data }: YearlyChartProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Year-over-Year</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v} sessions`, 'Annual total']}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fill: '#8b5cf6', fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
