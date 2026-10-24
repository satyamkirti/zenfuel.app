'use client';

import Link from 'next/link';
import { Trophy, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { computeChallengeProgress } from '@/utils/challenges';

export function ChallengesPanel() {
  const { challenges, entries, habits } = useApp();
  const { challengeName, habitIcon, masked } = usePrivacy();
  const active = challenges.filter(c => c.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <CardHeader
        icon={<Trophy size={16} />}
        title="Active challenges"
        action={<Link href="/challenges" className="text-xs font-medium text-brand-text hover:underline">View all</Link>}
      />
      <ul className="px-5 pb-5 space-y-4">
        {active.slice(0, 3).map(c => {
          const progress = computeChallengeProgress(c, entries);
          const habit = c.habitId === 'all' ? null : habitMap.get(c.habitId);
          return (
            <li key={c.id}>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-sm shrink-0" aria-hidden="true">
                  {habit ? habitIcon(habit) : masked ? '🏁' : '🧠'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{challengeName(c)}</p>
                  <p className="text-xs text-muted">Day {progress.daysDone} of {c.durationDays}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                  {progress.isViolated
                    ? <AlertCircle size={14} className="text-red-500" aria-label="Broken" />
                    : progress.percentage >= 100 && <CheckCircle2 size={14} className="text-emerald-500" aria-label="Complete" />}
                  {progress.percentage}%
                </span>
              </div>
              <div className="track h-1.5 mt-2">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', progress.isViolated ? 'bg-red-500' : 'bg-emerald-500')}
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
