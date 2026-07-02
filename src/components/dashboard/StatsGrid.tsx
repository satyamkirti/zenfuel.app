'use client';

import { Calendar, CalendarDays, TrendingUp, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/Card';

export function StatsGrid() {
  const { analytics } = useApp();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Today" value={analytics.todayCount} icon={<Calendar size={15} />} accent={analytics.todayCount > 0} />
      <StatCard label="This Week" value={analytics.weekCount} icon={<CalendarDays size={15} />} />
      <StatCard label="This Month" value={analytics.monthCount} icon={<CalendarDays size={15} />} />
      <StatCard label="This Year" value={analytics.yearCount} icon={<TrendingUp size={15} />} />
      <StatCard label="Lifetime Total" value={analytics.lifetimeCount} icon={<Activity size={15} />} accent />
      <StatCard label="Daily Average" value={analytics.averagePerDay > 0 ? analytics.averagePerDay.toFixed(2) : '—'} subValue={`${analytics.averagePerWeek.toFixed(1)}/week`} />
      <StatCard label="Monthly Average" value={analytics.averagePerMonth > 0 ? analytics.averagePerMonth.toFixed(1) : '—'} subValue={`${analytics.averagePerYear.toFixed(0)}/year`} />
      <StatCard label="Peak Day" value={analytics.highestActivityDay?.count ?? '—'} subValue={analytics.highestActivityDay?.date ?? 'No data yet'} />
    </div>
  );
}
