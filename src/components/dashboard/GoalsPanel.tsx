'use client';

import Link from 'next/link';
import { Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { computeGoalProgress } from '@/utils/goals';

export function GoalsPanel() {
  const { goals, entries, habits } = useApp();
  const active = goals.filter(g => g.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Target size={16} className="text-blue-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Active Goals</h3>
        <Link href="/goals" className="ml-auto text-xs text-violet-500 hover:text-violet-700 flex items-center gap-0.5">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="p-4 space-y-3">
        {active.slice(0, 3).map(goal => {
          const progress = computeGoalProgress(goal, entries);
          const habit = habitMap.get(goal.habitId);
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{habit?.icon ?? '🎯'}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{goal.name}</p>
                    <p className="text-xs text-slate-400">{progress.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {progress.isAchieved && <CheckCircle2 size={14} className="text-emerald-500" />}
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{progress.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progress.isAchieved ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, progress.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
