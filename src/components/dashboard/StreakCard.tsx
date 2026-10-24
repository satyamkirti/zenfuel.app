'use client';

import { Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatDisplayDate } from '@/utils/dateUtils';

export function StreakCard() {
  const { streaks, habitAnalytics } = useApp();
  const { habitName, habitIcon, discreet } = usePrivacy();

  const perHabitStreaks = habitAnalytics
    .filter(h => h.streak.currentStreak > 0 || h.streak.longestStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
    .slice(0, 4);

  const stats = [
    { label: 'Current', value: `${streaks.currentStreak}d`, highlight: streaks.currentStreak > 0 },
    { label: 'Longest', value: `${streaks.longestStreak}d` },
    { label: 'Streaks', value: String(streaks.totalStreaks) },
    { label: 'Average', value: streaks.averageStreakLength > 0 ? `${streaks.averageStreakLength}d` : '—' },
  ];

  return (
    <Card padding="none">
      <CardHeader
        icon={<Flame size={16} />}
        title={discreet('Detox streaks', 'Streaks')}
        subtitle="Consecutive days without logging a habit"
      />
      <dl className="grid grid-cols-4 gap-2 px-5">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl bg-surface-2 px-2 py-2.5 text-center flex flex-col-reverse">
            <dt className="text-[11px] text-muted">{s.label}</dt>
            <dd className={`text-lg font-semibold tabular-nums ${s.highlight ? 'text-orange-600 dark:text-orange-400' : 'text-ink'}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      {perHabitStreaks.length > 0 && (
        <div className="px-5 pt-4">
          <p className="eyebrow mb-2">By habit</p>
          <ul className="space-y-1.5">
            {perHabitStreaks.map(h => {
              const ref = { id: h.habitId, name: h.habitName, icon: h.habitIcon };
              return (
                <li key={h.habitId} className="flex items-center gap-2 text-sm">
                  <span aria-hidden="true">{habitIcon(ref)}</span>
                  <span className="flex-1 min-w-0 truncate text-ink-2">{habitName(ref)}</span>
                  <span className={`tabular-nums font-semibold ${h.streak.currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted'}`}>{h.streak.currentStreak}d</span>
                  <span className="tabular-nums text-xs text-muted w-16 text-right">best {h.streak.longestStreak}d</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {streaks.streakHistory.length > 0 && (
        <div className="px-5 pt-4">
          <p className="eyebrow mb-2">Top streaks</p>
          <div className="flex flex-wrap gap-1.5">
            {streaks.streakHistory.slice(0, 5).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-2 text-xs">
                <span className="font-semibold text-ink tabular-nums">{s.length}d</span>
                <span className="text-muted">from {formatDisplayDate(s.start)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="h-5" />
    </Card>
  );
}
