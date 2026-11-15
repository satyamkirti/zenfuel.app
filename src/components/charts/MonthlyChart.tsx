'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MonthlyCount } from '@/types';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, BRAND_HEX, TEAL_HEX, AVERAGE_HEX, chartTitleClass, activities } from './chartTheme';
import { t } from '@/i18n/translate';

interface MonthlyChartProps {
  data: MonthlyCount[];
  averagePerMonth?: number;
}

export function MonthlyChart({ data, averagePerMonth }: MonthlyChartProps) {
  const motion = useChartMotion();
  const chartData = data.slice(-24);

  return (
    <figure aria-label={t('charts.monthlyAria', { count: chartData.length }) + (averagePerMonth ? `, ${t('charts.averagePerMonth', { value: Number(averagePerMonth.toFixed(1)) })}` : '')}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-ink">{t('charts.heading.monthly')}</h4>
        {!!averagePerMonth && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-3 border-t-2 border-dashed border-purple-500" aria-hidden="true" />
            {t('charts.averageLegend', { value: Number(averagePerMonth.toFixed(1)) })}
          </span>
        )}
      </div>
      {chartData.length === 0 ? (
        <p className="h-[180px] flex items-center justify-center text-sm text-muted">{t('charts.heading.noMonthly')}</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND_HEX} stopOpacity={0.32} />
                <stop offset="100%" stopColor={TEAL_HEX} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              className={AXIS_CLASS}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip {...tooltipProps} cursor={{ stroke: 'rgb(var(--line-strong))' }} formatter={(v: number) => [activities(v), '']} separator="" />
            {!!averagePerMonth && <ReferenceLine y={averagePerMonth} stroke={AVERAGE_HEX} strokeDasharray="4 3" />}
            <Area {...motion} type="monotone" dataKey="count" stroke={BRAND_HEX} strokeWidth={2.5} fill="url(#monthGrad)" dot={{ fill: BRAND_HEX, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
