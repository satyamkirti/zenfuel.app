'use client';

import { Activity, BarChart3, Calendar, CalendarDays, Flame, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDisplayDate } from '@/utils/dateUtils';

export function StatsGrid() {
  const { analytics, streaks } = useApp();
  const primary = [
    { label: 'Today', value: analytics.todayCount, note: 'Events logged', icon: <CalendarDays size={16} />, accent: true },
    { label: 'This week', value: analytics.weekCount, note: 'Last 7 days', icon: <Calendar size={16} /> },
    { label: 'This month', value: analytics.monthCount, note: 'Current month', icon: <BarChart3 size={16} /> },
    { label: 'All time', value: analytics.lifetimeCount, note: 'Total recorded', icon: <Activity size={16} /> },
  ];
  const secondary = [
    { label: 'This year', value: String(analytics.yearCount) },
    { label: 'Daily average', value: analytics.averagePerDay > 0 ? analytics.averagePerDay.toFixed(2) : '—', sub: `${analytics.averagePerWeek.toFixed(1)} per week` },
    { label: 'Monthly average', value: analytics.averagePerMonth > 0 ? analytics.averagePerMonth.toFixed(1) : '—', sub: `${analytics.averagePerYear.toFixed(0)} per year` },
    { label: 'Busiest day', value: analytics.highestActivityDay ? String(analytics.highestActivityDay.count) : '—', sub: analytics.highestActivityDay ? formatDisplayDate(analytics.highestActivityDay.date) : 'No data yet' },
  ];

  return (
    <section aria-label="Activity totals" className="space-y-3">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {primary.map(s => (
          <article key={s.label} className="relative min-w-0 overflow-hidden rounded-[20px] border border-line bg-surface p-4 sm:p-[18px] shadow-card">
            {s.accent && <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 to-teal-400" aria-hidden="true" />}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-muted">{s.label}</p>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-teal-300 flex items-center justify-center shrink-0" aria-hidden="true">{s.icon}</span>
            </div>
            <p className={`mt-3 text-[30px] leading-none font-bold tracking-tight tabular-nums ${s.accent ? 'text-brand-text' : 'text-ink'}`}>{s.value}</p>
            <p className="mt-2 text-[11px] text-muted">{s.note}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[20px] border border-line bg-surface-2/70 px-4 sm:px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-brand-text" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Your activity at a glance</p>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
          {secondary.map(s => (
            <div key={s.label} className="min-w-0">
              <dt className="text-[11px] font-medium text-muted">{s.label}</dt>
              <dd className="mt-0.5 text-base font-bold tabular-nums text-ink truncate">{s.value}</dd>
              {s.sub && <dd className="text-[11px] text-muted truncate">{s.sub}</dd>}
            </div>
          ))}
        </dl>
        {streaks.currentStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-line flex items-center gap-2 text-xs text-ink-2">
            <Flame size={14} className="text-orange-500" aria-hidden="true" />
            <span><strong className="text-ink">{streaks.currentStreak}-day streak</strong> — keep your momentum going.</span>
          </div>
        )}
      </div>
    </section>
  );
}
