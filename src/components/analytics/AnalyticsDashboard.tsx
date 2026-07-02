'use client';

import { useMemo, useState } from 'react';
import { LogEntry, FilterPeriod, Habit } from '@/types';
import { Card, StatCard } from '@/components/ui/Card';
import { DateFilter } from '@/components/filters/DateFilter';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { WeeklyChart } from '@/components/charts/WeeklyChart';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { YearlyChart } from '@/components/charts/YearlyChart';
import { HourlyChart } from '@/components/charts/HourlyChart';
import { WeekdayChart } from '@/components/charts/WeekdayChart';
import { HabitComparisonChart } from '@/components/charts/HabitComparisonChart';
import { computeAnalytics } from '@/utils/analytics';
import { filterEntriesByPeriod } from '@/utils/dateUtils';
import { LockOverlay } from '@/components/subscription/LockOverlay';

interface AnalyticsDashboardProps {
  entries: LogEntry[];
  habits: Habit[];
  isPremium?: boolean;
}

const DAY_COUNT: Record<string, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365, lifetime: 365, custom: 30 };

export function AnalyticsDashboard({ entries, habits, isPremium = true }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<FilterPeriod>('30d');
  const [selectedHabitId, setSelectedHabitId] = useState('all');

  const filteredEntries = useMemo(() => {
    const periodFiltered = filterEntriesByPeriod(entries, period);
    return selectedHabitId === 'all' ? periodFiltered : periodFiltered.filter(e => e.habitId === selectedHabitId);
  }, [entries, period, selectedHabitId]);

  const analytics = useMemo(() => computeAnalytics(filteredEntries), [filteredEntries]);

  const habitAnalytics = useMemo(() => {
    const periodFiltered = filterEntriesByPeriod(entries, period);
    return habits.map(h => ({
      ...computeAnalytics(periodFiltered.filter(e => e.habitId === h.id)),
      habitId: h.id, habitName: h.name, habitIcon: h.icon, habitColor: h.color,
      percentOfTotal: periodFiltered.length > 0 ? Math.round((periodFiltered.filter(e => e.habitId === h.id).length / periodFiltered.length) * 100) : 0,
      streak: { currentStreak: 0, longestStreak: 0, streakHistory: [], totalStreaks: 0, averageStreakLength: 0 },
    }));
  }, [entries, habits, period]);

  const usedHabits = useMemo(() => {
    const ids = new Set(filterEntriesByPeriod(entries, period).map(e => e.habitId));
    return habits.filter(h => ids.has(h.id));
  }, [entries, habits, period]);

  const dayCount = DAY_COUNT[period] ?? 30;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex-1">Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <select value={selectedHabitId} onChange={e => setSelectedHabitId(e.target.value)} className="input w-auto text-sm py-1.5">
            <option value="all">All Habits</option>
            {usedHabits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
          </select>
          <DateFilter value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={analytics.lifetimeCount} accent />
        <StatCard label="Daily Average" value={analytics.averagePerDay > 0 ? analytics.averagePerDay.toFixed(2) : '—'} />
        <StatCard label="Weekly Average" value={analytics.averagePerWeek > 0 ? analytics.averagePerWeek.toFixed(1) : '—'} />
        <StatCard label="Monthly Average" value={analytics.averagePerMonth > 0 ? analytics.averagePerMonth.toFixed(1) : '—'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {analytics.highestActivityDay && <StatCard label="Peak Day" value={analytics.highestActivityDay.count} subValue={analytics.highestActivityDay.date} />}
        {analytics.mostActiveWeekday && <StatCard label="Most Active Day" value={analytics.mostActiveWeekday.day} subValue={`${analytics.mostActiveWeekday.count} events`} />}
        {analytics.highestActivityMonth && <StatCard label="Peak Month" value={analytics.highestActivityMonth.count} subValue={analytics.highestActivityMonth.label} />}
      </div>

      {selectedHabitId === 'all' && (
        isPremium ? (
          <Card>
            <HabitComparisonChart data={habitAnalytics} period={period === 'today' || period === '7d' ? 'week' : period === '30d' ? 'month' : 'lifetime'} />
          </Card>
        ) : (
          <LockOverlay feature="Habit Comparison Chart" description="See a side-by-side comparison of all your habits. Premium feature.">
            <Card><HabitComparisonChart data={habitAnalytics} period="month" /></Card>
          </LockOverlay>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><ActivityBarChart data={analytics.dailyCounts} days={Math.min(dayCount, 90)} title="Daily Events" /></Card>
        <Card><WeeklyChart data={analytics.weeklyCounts} averagePerWeek={analytics.averagePerWeek} /></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><MonthlyChart data={analytics.monthlyCounts} averagePerMonth={analytics.averagePerMonth} /></Card>
        {isPremium ? (
          <Card><WeekdayChart data={analytics.weekdayStats} /></Card>
        ) : (
          <LockOverlay feature="Weekday Risk Radar" description="See which days of the week are highest risk. Premium." compact>
            <Card><WeekdayChart data={analytics.weekdayStats} /></Card>
          </LockOverlay>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isPremium ? (
          <Card><HourlyChart data={analytics.hourlyStats} /></Card>
        ) : (
          <LockOverlay feature="Hourly Activity Chart" description="Identify your peak trigger hours. Premium feature." compact>
            <Card><HourlyChart data={analytics.hourlyStats} /></Card>
          </LockOverlay>
        )}
        {analytics.yearlyCounts.length >= 2 && (
          isPremium ? (
            <Card><YearlyChart data={analytics.yearlyCounts} /></Card>
          ) : (
            <LockOverlay feature="Year-over-Year Chart" description="Compare your progress across years. Premium." compact>
              <Card><YearlyChart data={analytics.yearlyCounts} /></Card>
            </LockOverlay>
          )
        )}
      </div>

      {analytics.mostActiveWeekday && (
        <Card>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Weekday Breakdown</h4>
          <div className="grid grid-cols-7 gap-2">
            {analytics.weekdayStats.map(d => {
              const max = Math.max(1, ...analytics.weekdayStats.map(x => x.count));
              const height = Math.round((d.count / max) * 60) + 10;
              return (
                <div key={d.day} className="flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-violet-500/20 border-t-2 border-violet-500" style={{ height }} title={`${d.day}: ${d.count}`} />
                  <span className="text-[10px] text-slate-400">{d.shortDay}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d.count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Most active: <strong className="text-slate-800 dark:text-slate-200">{analytics.mostActiveWeekday?.day}</strong></span>
            {analytics.leastActiveWeekday && <span>Least active: <strong className="text-slate-800 dark:text-slate-200">{analytics.leastActiveWeekday.day}</strong></span>}
          </div>
        </Card>
      )}
    </div>
  );
}
