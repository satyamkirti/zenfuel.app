'use client';

import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Zap } from 'lucide-react';

export function HabitBreakdown() {
  const { habitAnalytics, analytics } = useApp();
  const active = habitAnalytics.filter(h => h.lifetimeCount > 0).sort((a, b) => b.lifetimeCount - a.lifetimeCount);

  if (active.length === 0) {
    return null;
  }

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Zap size={16} className="text-violet-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Habit Breakdown</h3>
        <span className="ml-auto text-xs text-slate-400">{analytics.lifetimeCount} total</span>
      </div>
      <div className="p-4 space-y-3">
        {active.slice(0, 6).map(h => (
          <div key={h.habitId}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{h.habitIcon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{h.habitName}</span>
                {h.streak.currentStreak > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full font-medium">
                    🔥 {h.streak.currentStreak}d
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{h.lifetimeCount}</span>
                <span className="text-xs text-slate-400 ml-1">({h.percentOfTotal}%)</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${h.percentOfTotal}%`, backgroundColor: h.habitColor }}
              />
            </div>
          </div>
        ))}

        {active.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Most Active</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
                <span>{active[0]?.habitIcon}</span>
                <span className="truncate">{active[0]?.habitName}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Least Active</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
                <span>{active[active.length - 1]?.habitIcon}</span>
                <span className="truncate">{active[active.length - 1]?.habitName}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Today</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{analytics.todayCount} events</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
