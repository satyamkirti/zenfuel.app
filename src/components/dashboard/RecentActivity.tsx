'use client';

import Link from 'next/link';
import { History, StickyNote } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatRelativeDate } from '@/utils/dateUtils';

// The last few logged entries (real data only), masked in Hidden Mode.
export function RecentActivity({ limit = 5 }: { limit?: number }) {
  const { entries, habits } = useApp();
  const { habitName, habitIcon, note } = usePrivacy();
  if (entries.length === 0) return null;
  const habitMap = new Map(habits.map(h => [h.id, h]));
  const recent = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

  return (
    <Card padding="none">
      <CardHeader
        icon={<History size={16} />}
        title="Recent activity"
        action={<Link href="/history" className="text-xs font-medium text-brand-text hover:underline">History</Link>}
      />
      <ul className="px-2 pb-3">
        {recent.map(e => {
          const habit = habitMap.get(e.habitId);
          const n = note(e.notes);
          return (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <span className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-sm shrink-0" aria-hidden="true">{habitIcon(habit)}</span>
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
