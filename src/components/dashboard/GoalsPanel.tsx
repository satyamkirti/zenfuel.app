'use client';

import Link from 'next/link';
import { Target, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { computeGoalProgress } from '@/utils/goals';

export function GoalsPanel() {
  const { goals, entries, habits } = useApp();
  const { goalName, habitIcon } = usePrivacy();
  const active = goals.filter(g => g.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <CardHeader
        icon={<Target size={16} />}
        title="Active goals"
        action={<Link href="/goals" className="text-xs font-medium text-brand-text hover:underline">View all</Link>}
      />
      <ul className="px-5 pb-5 space-y-4">
        {active.slice(0, 3).map(goal => {
          const progress = computeGoalProgress(goal, entries);
          const habit = habitMap.get(goal.habitId);
          return (
            <li key={goal.id}>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-sm shrink-0" aria-hidden="true">
                  {habit ? habitIcon(habit) : '🎯'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{goalName(goal)}</p>
                  <p className="text-xs text-muted truncate">{progress.label}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                  {progress.isAchieved && <CheckCircle2 size={14} className="text-emerald-500" aria-label="Achieved" />}
                  {progress.percentage}%
                </span>
              </div>
              <div className="track h-1.5 mt-2">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', progress.isAchieved ? 'bg-emerald-500' : 'bg-blue-500')}
                  style={{ width: `${Math.min(100, progress.percentage)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
