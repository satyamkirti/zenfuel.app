'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyCount } from '@/types';
import { SHORT_MONTHS } from '@/utils/dateUtils';

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

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={days > 60 ? 3 : days > 30 ? 5 : 8}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'currentColor', fontSize: 10 }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            interval={Math.floor(days / 7)}
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
            contentStyle={{
              backgroundColor: 'var(--color-surface, #1e293b)',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
            formatter={(v: number) => [`${v} session${v !== 1 ? 's' : ''}`, 'Count']}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === 0 ? '#e2e8f0' : entry.count === maxVal ? '#6d28d9' : '#8b5cf6'}
                className={entry.count === 0 ? 'dark:fill-slate-700' : ''}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
