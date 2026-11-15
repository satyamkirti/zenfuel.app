'use client';

import Link from 'next/link';
import { HabitTile } from '@/components/dashboard/HabitGlyph';
import { Trophy, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { computeChallengeProgress } from '@/utils/challenges';
import { t } from '@/i18n/translate';

export function ChallengesPanel() {
  const { challenges, entries, habits } = useApp();
  const { challengeName, habitIcon, masked } = usePrivacy();
  const active = challenges.filter(c => c.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <CardHeader
        icon={<Trophy size={17} />}
        tone="orange"
        title={t('challenges.panelTitle')}
        action={<Link href="/challenges" className="text-xs font-medium text-brand-text hover:underline">{t('common.viewAll')}</Link>}
      />
      <ul className="px-5 pb-5 space-y-4">
        {active.slice(0, 3).map(c => {
          const progress = computeChallengeProgress(c, entries);
          const habit = c.habitId === 'all' ? null : habitMap.get(c.habitId);
          return (
            <li key={c.id}>
              <div className="flex items-center gap-2.5">
                {habit ? <HabitTile id={habit.id} /> : <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/[0.12] dark:text-amber-300 flex items-center justify-center shrink-0" aria-hidden="true"><Trophy size={18} /></span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug text-ink [overflow-wrap:anywhere]">{challengeName(c)}</p>
                  <p className="text-xs text-muted">{t('challenges.dayOfPanel', { day: progress.daysDone, total: c.durationDays })}</p>
                </div>
                <span className="shrink-0 flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                  {progress.isViolated
                    ? <AlertCircle size={14} className="text-red-500" aria-label={t('challenges.brokenShort')} />
                    : progress.percentage >= 100 && <CheckCircle2 size={14} className="text-emerald-500" aria-label={t('challenges.completeShort')} />}
                  {progress.percentage}%
                </span>
              </div>
              <div className="track h-2 mt-2">
                <div
                  className={clsx('h-full rounded-full transition-[width] duration-500 grow-x', progress.isViolated ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500')}
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
