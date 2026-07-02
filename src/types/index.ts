export type HabitCategory = 'digital' | 'adult' | 'food' | 'substance' | 'other';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  isDefault: boolean;
  createdAt: number;
  isHidden?: boolean;
}

export interface LogEntry {
  id: string;
  habitId: string;
  date: string;
  time: string;
  timestamp: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark';

export type FilterPeriod = 'today' | '7d' | '30d' | '90d' | '6m' | '1y' | 'lifetime' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

export interface StreakInfo {
  start: string;
  end: string;
  length: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakHistory: StreakInfo[];
  totalStreaks: number;
  averageStreakLength: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface WeeklyCount {
  week: string;
  count: number;
  label: string;
}

export interface MonthlyCount {
  month: string;
  count: number;
  label: string;
}

export interface YearlyCount {
  year: number;
  count: number;
}

export interface WeekdayStats {
  day: string;
  shortDay: string;
  dayIndex: number;
  count: number;
  average: number;
}

export interface HourlyStats {
  hour: number;
  count: number;
  label: string;
}

export interface AppAnalytics {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  yearCount: number;
  lifetimeCount: number;
  averagePerDay: number;
  averagePerWeek: number;
  averagePerMonth: number;
  averagePerYear: number;
  highestActivityDay: DailyCount | null;
  highestActivityWeek: WeeklyCount | null;
  highestActivityMonth: MonthlyCount | null;
  lowestActivityWeek: WeeklyCount | null;
  lowestActivityMonth: MonthlyCount | null;
  weekdayStats: WeekdayStats[];
  mostActiveWeekday: WeekdayStats | null;
  leastActiveWeekday: WeekdayStats | null;
  hourlyStats: HourlyStats[];
  peakHours: number[];
  dailyCounts: DailyCount[];
  weeklyCounts: WeeklyCount[];
  monthlyCounts: MonthlyCount[];
  yearlyCounts: YearlyCount[];
}

export interface HabitAnalytics extends AppAnalytics {
  habitId: string;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  percentOfTotal: number;
  streak: StreakData;
}

export interface DetoxScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement';
  color: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Insight {
  id: string;
  type: 'info' | 'positive' | 'neutral' | 'warning';
  message: string;
  icon: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  habitId: string;
  durationDays: number;
  startDate: string | null;
  isActive: boolean;
  isCompleted: boolean;
  isBuiltIn: boolean;
  createdAt: number;
}

export type GoalType = 'reduce_by_percent' | 'max_per_week' | 'streak_days' | 'free_for_days';

export interface Goal {
  id: string;
  name: string;
  habitId: string;
  type: GoalType;
  targetValue: number;
  startDate: string;
  isActive: boolean;
  createdAt: number;
}

export interface AppSettings {
  theme: Theme;
  pinEnabled: boolean;
  pinHash: string;
  autoLockMinutes: number;
  hiddenMode: boolean;
  hiddenTitle: string;
}
