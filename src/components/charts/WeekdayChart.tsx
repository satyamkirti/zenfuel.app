'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { WeekdayStats } from '@/types';

interface WeekdayChartProps {
  data: WeekdayStats[];
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  const chartData = data.map(d => ({ day: d.shortDay, count: d.count, average: Math.round(d.average * 100) / 100 }));
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Activity by Day of Week</h4>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="day" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-400" />
          <Radar name="Sessions" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v} sessions`, 'Total']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
