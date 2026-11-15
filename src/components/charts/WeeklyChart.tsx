'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { WeeklyCount } from '@/types';
import { BAR_FILL, barGradients } from './chartDefs';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BAR_EMPTY_CLASS, BRAND_HEX, AVERAGE_HEX, chartTitleClass, activities } from './chartTheme';
import { t } from '@/i18n/translate';

interface WeeklyChartProps {
  data: WeeklyCount[];
  averagePerWeek?: number;
}

export function WeeklyChart({ data, averagePerWeek }: WeeklyChartProps) {
  const motion = useChartMotion();
  const chartData = data.slice(-16);

  return (
    <figure aria-label={t('charts.weeklyAria', { count: chartData.length }) + (averagePerWeek ? `, ${t('charts.averagePerWeek', { value: Number(averagePerWeek.toFixed(1)) })}` : '')}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-ink">{t('charts.heading.weekly')}</h4>
        {!!averagePerWeek && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-3 border-t-2 border-dashed border-purple-500" aria-hidden="true" />
            {t('charts.averageLegend', { value: Number(averagePerWeek.toFixed(1)) })}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          {barGradients()}
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [activities(v), '']} separator="" />
          {!!averagePerWeek && <ReferenceLine y={averagePerWeek} stroke={AVERAGE_HEX} strokeDasharray="4 3" />}
          <Bar {...motion} dataKey="count" radius={[6, 6, 2, 2]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.count === 0 ? BRAND_HEX : BAR_FILL} className={entry.count === 0 ? BAR_EMPTY_CLASS : undefined} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
