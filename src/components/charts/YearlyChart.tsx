'use client';

import { useChartMotion } from '@/hooks/useReducedMotion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { YearlyCount } from '@/types';
import { BAR_FILL, barGradients } from './chartDefs';
import { tooltipProps, axisTick, AXIS_CLASS, GRID_CLASS, chartTitleClass, activities } from './chartTheme';
import { t } from '@/i18n/translate';

interface YearlyChartProps {
  data: YearlyCount[];
}

export function YearlyChart({ data }: YearlyChartProps) {
  const motion = useChartMotion();
  return (
    <figure aria-label={t('charts.yearlyAria', { list: data.map(d => `${d.year} ${d.count}`).join(', ') })}>
      <h4 className={chartTitleClass}>{t('charts.heading.yearly')}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
          {barGradients()}
          <CartesianGrid stroke="currentColor" className={GRID_CLASS} vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="year" tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} className={AXIS_CLASS} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
          <Tooltip {...tooltipProps} formatter={(v: number) => [activities(v), '']} separator="" />
          <Bar {...motion} dataKey="count" radius={[8, 8, 2, 2]} maxBarSize={48}>
            {data.map((_, i) => <Cell key={i} fill={BAR_FILL} />)}
            <LabelList dataKey="count" position="top" className="fill-ink-2" style={{ fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
