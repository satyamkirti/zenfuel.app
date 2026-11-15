'use client';

import Link from 'next/link';
import { HabitTile } from '@/components/dashboard/HabitGlyph';
import { Target, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { computeGoalProgress } from '@/utils/goals';
import { useT } from '@/i18n/I18nProvider';

export function GoalsPanel() {
  const { goals, entries, habits } = useApp();
  const { goalName, habitIcon } = usePrivacy();
  const t = useT();
  const active = goals.filter(g => g.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <CardHeader
        icon={<Target size={17} />}
        tone="violet"
        title={t('home.activeGoals')}
        action={<Link href="/goals" className="text-xs font-medium text-brand-text hover:underline">{t('common.viewAll')}</Link>}
      />
      <ul className="px-5 pb-5 space-y-4">
        {active.slice(0, 3).map(goal => {
          const progress = computeGoalProgress(goal, entries);
          const habit = habitMap.get(goal.habitId);
          return (
            <li key={goal.id}>
              <div className="flex items-center gap-2.5">
                <HabitTile id={goal.habitId} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{goalName(goal)}</p>
                  <p className="text-xs text-muted truncate">{progress.label}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                  {progress.isAchieved && <CheckCircle2 size={14} className="text-emerald-500" aria-label={t('home.achieved')} />}
                  {progress.percentage}%
                </span>
              </div>
              <div className="track h-2 mt-2">
                <div
                  className={clsx('h-full rounded-full transition-[width] duration-500 grow-x', progress.isAchieved ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-blue-500')}
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
