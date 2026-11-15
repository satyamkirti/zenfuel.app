'use client';

import { CalendarCheck, CalendarDays, CalendarRange, Infinity as InfinityIcon, Sigma, Activity, BarChart3, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDisplayDate } from '@/utils/dateUtils';
import { Card, CardHeader, IconTile, MetricCard, Tone } from '@/components/ui/Card';
import { useT } from '@/i18n/I18nProvider';
import { formatNumber } from '@/i18n/format';

// Four colourful headline counts (Today blue, week teal, month orange, all time purple), then
// the supporting averages in an "at a glance" panel.
export function StatsGrid() {
  const { analytics } = useApp();
  const t = useT();
  const primary: { label: string; value: number; sub: string; icon: JSX.Element; tone: Tone }[] = [
    { label: t('stats.today'), value: analytics.todayCount, sub: t('stats.todaySub'), icon: <CalendarCheck size={16} />, tone: 'blue' },
    { label: t('stats.week'), value: analytics.weekCount, sub: t('stats.weekSub'), icon: <CalendarDays size={16} />, tone: 'teal' },
    { label: t('stats.month'), value: analytics.monthCount, sub: t('stats.monthSub'), icon: <CalendarRange size={16} />, tone: 'orange' },
    { label: t('stats.allTime'), value: analytics.lifetimeCount, sub: t('stats.allTimeSub'), icon: <InfinityIcon size={16} />, tone: 'purple' },
  ];
  const secondary: { label: string; value: string; sub?: string; icon: JSX.Element; tone: Tone }[] = [
    { label: t('stats.year'), value: formatNumber(analytics.yearCount), sub: t('stats.yearSub'), icon: <Sigma size={16} />, tone: 'cyan' },
    { label: t('explore.dailyAvg'), value: analytics.averagePerDay > 0 ? formatNumber(Number(analytics.averagePerDay.toFixed(2))) : '—', sub: t('stats.perWeek', { value: Number(analytics.averagePerWeek.toFixed(1)) }), icon: <Activity size={16} />, tone: 'teal' },
    { label: t('explore.monthlyAvg'), value: analytics.averagePerMonth > 0 ? formatNumber(Number(analytics.averagePerMonth.toFixed(1))) : '—', sub: t('stats.perYear', { value: Math.round(analytics.averagePerYear) }), icon: <BarChart3 size={16} />, tone: 'orange' },
    { label: t('explore.busiestDay'), value: analytics.highestActivityDay ? formatNumber(analytics.highestActivityDay.count) : '—', sub: analytics.highestActivityDay ? formatDisplayDate(analytics.highestActivityDay.date) : t('stats.noData'), icon: <Trophy size={16} />, tone: 'pink' },
  ];

  return (
    <section aria-label={t('stats.label')} className="space-y-4 lg:space-y-5">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {primary.map(s => <MetricCard key={s.label} gradient label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} />)}
      </dl>
      <Card padding="none">
        <CardHeader icon={<Activity size={17} />} tone="indigo" title={t('stats.glanceTitle')} subtitle={t('stats.glanceSub')} />
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 px-5 pb-5">
          {secondary.map(s => (
            <div key={s.label} className="tile flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 min-w-0">
              <IconTile tone={s.tone}>{s.icon}</IconTile>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium text-muted truncate">{s.label}</dt>
                <dd className="text-lg font-bold leading-tight tabular-nums text-ink">{s.value}</dd>
                {s.sub && <dd className="text-[11px] text-muted truncate">{s.sub}</dd>}
              </div>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}
