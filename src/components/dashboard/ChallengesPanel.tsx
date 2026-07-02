'use client';

import Link from 'next/link';
import { Trophy, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { computeChallengeProgress } from '@/utils/challenges';

export function ChallengesPanel() {
  const { challenges, entries, habits } = useApp();
  const active = challenges.filter(c => c.isActive);
  if (active.length === 0) return null;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Trophy size={16} className="text-amber-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Active Challenges</h3>
        <Link href="/challenges" className="ml-auto text-xs text-violet-500 hover:text-violet-700 flex items-center gap-0.5">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="p-4 space-y-3">
        {active.slice(0, 3).map(c => {
          const progress = computeChallengeProgress(c, entries);
          const habit = c.habitId === 'all' ? null : habitMap.get(c.habitId);
          return (
            <div key={c.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{habit?.icon ?? '🧠'}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.durationDays} days · {progress.daysDone} done</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {progress.isViolated
                    ? <AlertCircle size={14} className="text-red-500" />
                    : progress.percentage >= 100
                    ? <CheckCircle2 size={14} className="text-emerald-500" />
                    : null}
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{progress.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progress.isViolated ? 'bg-red-500' : 'bg-emerald-500'}`}
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
