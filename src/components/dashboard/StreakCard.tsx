'use client';

import { HabitIconById } from './HabitGlyph';
import { Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatDisplayDate } from '@/utils/dateUtils';
import { useT } from '@/i18n/I18nProvider';

export function StreakCard() {
  const { streaks, habitAnalytics } = useApp();
  const { habitName, habitIcon, discreet } = usePrivacy();
  const t = useT();
  const d = (n: number) => t('streaks.daysShort', { count: n });

  const perHabitStreaks = habitAnalytics
    .filter(h => h.streak.currentStreak > 0 || h.streak.longestStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
    .slice(0, 4);

  const stats = [
    { label: t('streaks.current'), value: d(streaks.currentStreak), highlight: streaks.currentStreak > 0 },
    { label: t('streaks.longest'), value: d(streaks.longestStreak) },
    { label: t('streaks.count'), value: String(streaks.totalStreaks) },
    { label: t('streaks.average'), value: streaks.averageStreakLength > 0 ? d(streaks.averageStreakLength) : '—' },
  ];

  return (
    <Card padding="none">
      <CardHeader
        icon={<Flame size={17} />}
        tone="orange"
        title={discreet(t('streaks.title'), t('streaks.titleDiscreet'))}
        subtitle={t('streaks.sub')}
      />
      <dl className="grid grid-cols-4 gap-2 px-5">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl px-2 py-3 text-center flex flex-col-reverse ${s.highlight ? "bg-accent-soft" : "tile"}`}>
            <dt className="text-[11px] text-muted">{s.label}</dt>
            <dd className={`text-xl font-bold tabular-nums ${s.highlight ? 'text-accent-text' : 'text-ink'}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      {perHabitStreaks.length > 0 && (
        <div className="px-5 pt-4">
          <p className="eyebrow mb-2">{t('streaks.byHabit')}</p>
          <ul className="space-y-1.5">
            {perHabitStreaks.map(h => {
              const ref = { id: h.habitId, name: h.habitName, icon: h.habitIcon };
              return (
                <li key={h.habitId} className="flex items-center gap-2 text-sm">
                  <HabitIconById id={h.habitId} size={16} className="text-muted" />
                  <span className="flex-1 min-w-0 truncate text-ink-2">{habitName(ref)}</span>
                  <span className={`tabular-nums font-semibold ${h.streak.currentStreak > 0 ? 'text-accent-text' : 'text-muted'}`}>{d(h.streak.currentStreak)}</span>
                  <span className="tabular-nums text-xs text-muted min-w-16 text-right">{t('streaks.best', { count: h.streak.longestStreak })}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {streaks.streakHistory.length > 0 && (
        <div className="px-5 pt-4">
          <p className="eyebrow mb-2">{t('streaks.top')}</p>
          <div className="flex flex-wrap gap-1.5">
            {streaks.streakHistory.slice(0, 5).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 ring-1 ring-line text-xs">
                <span className="font-semibold text-ink tabular-nums">{d(s.length)}</span>
                <span className="text-muted">{t('streaks.from', { date: formatDisplayDate(s.start) })}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="h-5" />
    </Card>
  );
}
