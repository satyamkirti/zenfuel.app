'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { HabitAnalytics } from '@/types';
import { brandColor } from '@/utils/palette';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, chartTitleClass, activities } from './chartTheme';
import { t } from '@/i18n/translate';

interface HabitComparisonChartProps {
  data: HabitAnalytics[];
  period?: 'lifetime' | 'month' | 'week';
}

// Bars keep each habit's own colour (identity follows the habit, not its rank); labels stay in ink.
export function HabitComparisonChart({ data, period = 'lifetime' }: HabitComparisonChartProps) {
  const motion = useChartMotion();
  const chartData = data
    .map(h => ({
      name: h.habitName,
      icon: h.habitIcon,
      count: period === 'month' ? h.monthCount : period === 'week' ? h.weekCount : h.lifetimeCount,
      color: brandColor(h.habitColor),
    }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <div>
        <h4 className={chartTitleClass}>{t('charts.heading.comparison')}</h4>
        <p className="flex items-center justify-center h-32 text-muted text-sm">{t('charts.heading.noPeriod')}</p>
      </div>
    );
  }

  const height = Math.max(120, chartData.length * 34 + 16);

  return (
    <figure aria-label={t('charts.comparisonAria', { list: chartData.map(d => `${d.name} ${d.count}`).join(', ') })}>
      <h4 className={chartTitleClass}>{t('charts.heading.comparison')}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 32, left: 4, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} horizontal={false} />
          <XAxis type="number" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={({ x, y, payload }) => (
              <text x={x - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize={12} fill="currentColor" className="text-ink-2">
                {String(payload.value).length > 14 ? `${String(payload.value).slice(0, 13)}…` : payload.value}
              </text>
            )}
            width={124}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...tooltipProps} formatter={(v: number) => [activities(v), '']} separator="" />
          <Bar {...motion} dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="right" className="fill-ink-2" style={{ fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
