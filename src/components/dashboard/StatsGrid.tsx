'use client';

import { useApp } from '@/context/AppContext';
import { formatDisplayDate } from '@/utils/dateUtils';

// One card instead of eight: headline counts on top, averages and peak underneath.
export function StatsGrid() {
  const { analytics } = useApp();
  const primary = [
    { label: 'Today', value: analytics.todayCount },
    { label: 'This week', value: analytics.weekCount },
    { label: 'This month', value: analytics.monthCount },
    { label: 'All time', value: analytics.lifetimeCount },
  ];
  const secondary = [
    { label: 'This year', value: String(analytics.yearCount) },
    { label: 'Daily average', value: analytics.averagePerDay > 0 ? analytics.averagePerDay.toFixed(2) : '—', sub: `${analytics.averagePerWeek.toFixed(1)} per week` },
    { label: 'Monthly average', value: analytics.averagePerMonth > 0 ? analytics.averagePerMonth.toFixed(1) : '—', sub: `${analytics.averagePerYear.toFixed(0)} per year` },
    { label: 'Busiest day', value: analytics.highestActivityDay ? String(analytics.highestActivityDay.count) : '—', sub: analytics.highestActivityDay ? formatDisplayDate(analytics.highestActivityDay.date) : 'No data yet' },
  ];

  return (
    <section aria-label="Activity totals" className="bg-surface border border-line rounded-2xl shadow-card">
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {primary.map((s, i) => (
          <div key={s.label} className={`p-4 sm:p-5 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-line' : ''} ${i === 2 ? 'sm:border-l' : ''}`}>
            <dt className="text-xs font-medium text-muted">{s.label}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 px-4 sm:px-5 py-4 border-t border-line bg-surface-2/50 rounded-b-2xl">
        {secondary.map(s => (
          <div key={s.label} className="min-w-0">
            <dt className="text-[11px] font-medium text-muted">{s.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-ink">{s.value}</dd>
            {s.sub && <dd className="text-[11px] text-muted truncate">{s.sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
