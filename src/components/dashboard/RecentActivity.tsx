'use client';

import Link from 'next/link';
import { History, StickyNote, CircleDot } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatRelativeDate } from '@/utils/dateUtils';
import { brandColor, tint } from '@/utils/palette';
import { HabitGlyph } from './HabitGlyph';
import { useT } from '@/i18n/I18nProvider';

// The last few logged entries (real data only), masked in Hidden Mode.
export function RecentActivity({ limit = 5 }: { limit?: number }) {
  const { entries, habits } = useApp();
  const { habitName, note } = usePrivacy();
  const t = useT();
  if (entries.length === 0) return null;
  const habitMap = new Map(habits.map(h => [h.id, h]));
  const recent = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

  return (
    <Card padding="none">
      <CardHeader
        icon={<History size={17} />}
        tone="pink"
        title={t('home.recentActivity')}
        action={<Link href="/history" className="text-xs font-medium text-brand-text hover:underline">{t('nav.history')}</Link>}
      />
      <ul className="px-2 pb-3">
        {recent.map(e => {
          const habit = habitMap.get(e.habitId);
          const n = note(e.notes);
          return (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2/70 transition-colors">
              <span className="tint w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={tint(brandColor(habit?.color))} aria-hidden="true">{habit ? <HabitGlyph habit={habit} size={18} /> : <CircleDot size={18} />}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{habitName(habit, e.habitId)}</p>
                {n && (
                  <p className="text-xs text-muted truncate flex items-center gap-1">
                    <StickyNote size={11} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{n}</span>
                  </p>
                )}
              </div>
              <span className="text-xs text-muted tabular-nums text-right shrink-0">
                {formatRelativeDate(e.date)}<br />{e.time}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
