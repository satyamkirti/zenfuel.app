'use client';

import { Flame, Trophy, BarChart2, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';

export function StreakCard() {
  const { streaks, habitAnalytics } = useApp();

  const perHabitStreaks = habitAnalytics
    .filter(h => h.streak.currentStreak > 0 || h.streak.longestStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
    .slice(0, 4);

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Flame size={16} className="text-orange-500" />
          Detox Streaks
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Consecutive days without triggering a habit</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 dark:divide-slate-700">
        {[
          { label: 'Global Streak', value: `${streaks.currentStreak}d`, icon: <Flame size={18} className="text-orange-500" />, highlight: streaks.currentStreak > 0 },
          { label: 'Longest Ever', value: `${streaks.longestStreak}d`, icon: <Trophy size={18} className="text-amber-500" /> },
          { label: 'Total Streaks', value: streaks.totalStreaks, icon: <BarChart2 size={18} className="text-violet-500" /> },
          { label: 'Avg Length', value: streaks.averageStreakLength > 0 ? `${streaks.averageStreakLength}d` : '—', icon: <TrendingUp size={18} className="text-blue-500" /> },
        ].map(item => (
          <div key={item.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">{item.icon}</div>
            <p className={`text-2xl font-bold ${item.highlight ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {perHabitStreaks.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Per-Habit Streaks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {perHabitStreaks.map(h => (
              <div key={h.habitId} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{h.habitIcon}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{h.habitName}</span>
                </div>
                <p className={`text-lg font-bold ${h.streak.currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {h.streak.currentStreak}d
                </p>
                <p className="text-[10px] text-slate-400">Best: {h.streak.longestStreak}d</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {streaks.streakHistory.length > 0 && (
        <div className="px-5 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Top Global Streaks</p>
          <div className="flex flex-wrap gap-2">
            {streaks.streakHistory.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-full border border-orange-200 dark:border-orange-500/20">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">{s.length}d</span>
                <span className="text-xs text-orange-500/70">{s.start}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
