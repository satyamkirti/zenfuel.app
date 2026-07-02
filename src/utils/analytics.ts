import { LogEntry, AppAnalytics, DailyCount, WeeklyCount, MonthlyCount, YearlyCount, WeekdayStats, HourlyStats } from '@/types';
import {
  formatDate, getStartOfDay, getStartOfWeek, getStartOfMonth, getStartOfYear,
  getWeekKey, getMonthKey, getDaysBetween, WEEKDAYS, SHORT_WEEKDAYS, SHORT_MONTHS, formatHour
} from './dateUtils';

function emptyAnalytics(): AppAnalytics {
  return {
    todayCount: 0, weekCount: 0, monthCount: 0, yearCount: 0, lifetimeCount: 0,
    averagePerDay: 0, averagePerWeek: 0, averagePerMonth: 0, averagePerYear: 0,
    highestActivityDay: null, highestActivityWeek: null, highestActivityMonth: null,
    lowestActivityWeek: null, lowestActivityMonth: null,
    weekdayStats: WEEKDAYS.map((day, i) => ({ day, shortDay: SHORT_WEEKDAYS[i], dayIndex: i, count: 0, average: 0 })),
    mostActiveWeekday: null, leastActiveWeekday: null,
    hourlyStats: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, label: formatHour(h) })),
    peakHours: [],
    dailyCounts: [], weeklyCounts: [], monthlyCounts: [], yearlyCounts: [],
  };
}

export function computeAnalytics(allEntries: LogEntry[]): AppAnalytics {
  if (allEntries.length === 0) return emptyAnalytics();

  const now = new Date();
  const todayTs = getStartOfDay(now).getTime();
  const weekTs = getStartOfWeek(now).getTime();
  const monthTs = getStartOfMonth(now).getTime();
  const yearTs = getStartOfYear(now).getTime();

  const todayCount = allEntries.filter(e => e.timestamp >= todayTs).length;
  const weekCount = allEntries.filter(e => e.timestamp >= weekTs).length;
  const monthCount = allEntries.filter(e => e.timestamp >= monthTs).length;
  const yearCount = allEntries.filter(e => e.timestamp >= yearTs).length;
  const lifetimeCount = allEntries.length;

  const dailyMap = new Map<string, number>();
  const weeklyMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();
  const yearlyMap = new Map<number, number>();
  const weekdayMap = new Map<number, number>();
  const hourlyMap = new Map<number, number>();

  for (let i = 0; i < 7; i++) weekdayMap.set(i, 0);

  allEntries.forEach(entry => {
    const d = new Date(entry.timestamp);
    const dateKey = formatDate(d);
    const weekKey = getWeekKey(d);
    const monthKey = getMonthKey(d);
    const year = d.getFullYear();
    const dayIdx = d.getDay();
    const hour = d.getHours();

    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) ?? 0) + 1);
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1);
    yearlyMap.set(year, (yearlyMap.get(year) ?? 0) + 1);
    weekdayMap.set(dayIdx, (weekdayMap.get(dayIdx) ?? 0) + 1);
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
  });

  const dailyCounts: DailyCount[] = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weeklyCounts: WeeklyCount[] = Array.from(weeklyMap.entries())
    .map(([week, count]) => {
      const d = new Date(week + 'T00:00:00');
      return { week, count, label: `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}` };
    })
    .sort((a, b) => a.week.localeCompare(b.week));

  const monthlyCounts: MonthlyCount[] = Array.from(monthlyMap.entries())
    .map(([month, count]) => {
      const [y, m] = month.split('-');
      return { month, count, label: `${SHORT_MONTHS[parseInt(m) - 1]} ${y}` };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  const yearlyCounts: YearlyCount[] = Array.from(yearlyMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const firstEntry = allEntries.reduce((min, e) => e.timestamp < min.timestamp ? e : min, allEntries[0]);
  const daysSince = getDaysBetween(getStartOfDay(new Date(firstEntry.timestamp)), now);
  const weeksSince = Math.max(1, daysSince / 7);
  const monthsSince = Math.max(1, daysSince / 30.44);
  const yearsSince = Math.max(1, daysSince / 365.25);

  const sortedDaily = [...dailyCounts].sort((a, b) => b.count - a.count);
  const sortedWeekly = [...weeklyCounts].sort((a, b) => b.count - a.count);
  const sortedMonthly = [...monthlyCounts].sort((a, b) => b.count - a.count);

  const weekdayStats: WeekdayStats[] = Array.from(weekdayMap.entries()).map(([dayIndex, count]) => ({
    day: WEEKDAYS[dayIndex],
    shortDay: SHORT_WEEKDAYS[dayIndex],
    dayIndex,
    count,
    average: count / Math.max(1, Math.floor(daysSince / 7)),
  })).sort((a, b) => a.dayIndex - b.dayIndex);

  const sortedWeekdays = [...weekdayStats].sort((a, b) => b.count - a.count);

  const hourlyStats: HourlyStats[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourlyMap.get(h) ?? 0,
    label: formatHour(h),
  }));

  const peakHours = [...hourlyStats]
    .sort((a, b) => b.count - a.count)
    .filter(h => h.count > 0)
    .slice(0, 3)
    .map(h => h.hour);

  return {
    todayCount, weekCount, monthCount, yearCount, lifetimeCount,
    averagePerDay: Math.round((lifetimeCount / daysSince) * 100) / 100,
    averagePerWeek: Math.round((lifetimeCount / weeksSince) * 100) / 100,
    averagePerMonth: Math.round((lifetimeCount / monthsSince) * 100) / 100,
    averagePerYear: Math.round((lifetimeCount / yearsSince) * 100) / 100,
    highestActivityDay: sortedDaily[0] ?? null,
    highestActivityWeek: sortedWeekly[0] ?? null,
    highestActivityMonth: sortedMonthly[0] ?? null,
    lowestActivityWeek: sortedWeekly[sortedWeekly.length - 1] ?? null,
    lowestActivityMonth: sortedMonthly[sortedMonthly.length - 1] ?? null,
    weekdayStats,
    mostActiveWeekday: sortedWeekdays[0] ?? null,
    leastActiveWeekday: sortedWeekdays[sortedWeekdays.length - 1] ?? null,
    hourlyStats,
    peakHours,
    dailyCounts,
    weeklyCounts,
    monthlyCounts,
    yearlyCounts,
  };
}
