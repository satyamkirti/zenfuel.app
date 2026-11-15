'use client';

import Link from 'next/link';
import { HabitTile } from '@/components/dashboard/HabitGlyph';
import { PieChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { brandColor } from '@/utils/palette';
import { useT } from '@/i18n/I18nProvider';

export function HabitBreakdown() {
  const { habitAnalytics, analytics } = useApp();
  const { habitName, habitIcon, masked } = usePrivacy();
  const t = useT();
  const ref = (h: { habitId: string; habitName: string; habitIcon: string } | undefined) =>
    h ? { id: h.habitId, name: h.habitName, icon: h.habitIcon } : undefined;
  const active = habitAnalytics.filter(h => h.lifetimeCount > 0).sort((a, b) => b.lifetimeCount - a.lifetimeCount);

  if (active.length === 0) return null;

  return (
    <Card padding="none">
      <CardHeader
        icon={<PieChart size={17} />}
        tone="teal"
        title={t('breakdown.title')}
        subtitle={t('breakdown.sub', { count: analytics.lifetimeCount })}
        action={<Link href="/habits" className="text-xs font-medium text-brand-text hover:underline">{t('habitsToday.manage')}</Link>}
      />
      <ul className="px-5 pb-5 space-y-3.5">
        {active.slice(0, 6).map(h => (
          <li key={h.habitId}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <HabitTile id={h.habitId} size="sm" />
                <span className="text-sm font-medium text-ink truncate">{habitName(ref(h))}</span>
                {h.streak.currentStreak > 0 && (
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300 font-medium">
                    {t('breakdown.streak', { count: h.streak.currentStreak })}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-sm tabular-nums">
                <span className="font-semibold text-ink">{h.lifetimeCount}</span>
                <span className="text-muted"> · {h.percentOfTotal}%</span>
              </span>
            </div>
            <div className="track h-2">
              <div
                className="h-full rounded-full transition-[width] duration-500 grow-x"
                style={{ width: `${h.percentOfTotal}%`, backgroundColor: masked ? '#1877f2' : brandColor(h.habitColor) }}
              />
            </div>
          </li>
        ))}
      </ul>
      {active.length > 6 && (
        <p className="px-5 pb-4 -mt-2 text-xs text-muted">{t('breakdown.more', { count: active.length - 6 })}</p>
      )}
    </Card>
  );
}
