'use client';

import Link from 'next/link';
import { PieChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';

export function HabitBreakdown() {
  const { habitAnalytics, analytics } = useApp();
  const { habitName, habitIcon, masked } = usePrivacy();
  const ref = (h: { habitId: string; habitName: string; habitIcon: string } | undefined) =>
    h ? { id: h.habitId, name: h.habitName, icon: h.habitIcon } : undefined;
  const active = habitAnalytics.filter(h => h.lifetimeCount > 0).sort((a, b) => b.lifetimeCount - a.lifetimeCount);

  if (active.length === 0) return null;

  return (
    <Card padding="none">
      <CardHeader
        icon={<PieChart size={16} />}
        title="Habit breakdown"
        subtitle={`${analytics.lifetimeCount} events in total`}
        action={<Link href="/habits" className="text-xs font-medium text-brand-text hover:underline">Manage</Link>}
      />
      <ul className="px-5 pb-5 space-y-3.5">
        {active.slice(0, 6).map(h => (
          <li key={h.habitId}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base leading-none" aria-hidden="true">{habitIcon(ref(h))}</span>
                <span className="text-sm font-medium text-ink truncate">{habitName(ref(h))}</span>
                {h.streak.currentStreak > 0 && (
                  <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300 font-medium">
                    {h.streak.currentStreak}d streak
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm tabular-nums">
                <span className="font-semibold text-ink">{h.lifetimeCount}</span>
                <span className="text-muted"> · {h.percentOfTotal}%</span>
              </span>
            </div>
            <div className="track h-1.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${h.percentOfTotal}%`, backgroundColor: masked ? '#8b5cf6' : h.habitColor }}
              />
            </div>
          </li>
        ))}
      </ul>
      {active.length > 6 && (
        <p className="px-5 pb-4 -mt-2 text-xs text-muted">+{active.length - 6} more habit{active.length - 6 === 1 ? '' : 's'} with fewer events</p>
      )}
    </Card>
  );
}
