'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntryList } from '@/components/history/EntryList';
import { Card } from '@/components/ui/Card';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';

export default function HistoryPage() {
  const { entries, habits, updateEntry, deleteEntry, isPremium, historyCutoff } = useApp();

  const visibleEntries = useMemo(() => {
    if (!historyCutoff) return entries;
    return entries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [entries, historyCutoff]);

  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <AppLayout title="History">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
            <History size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Event History</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isPremium ? `${entries.length} total events` : `Showing last 30 days (${visibleEntries.length} events)`}
            </p>
          </div>
        </div>

        {!isPremium && hiddenCount > 0 && (
          <UpgradeBanner
            message={`${hiddenCount} older event${hiddenCount !== 1 ? 's' : ''} hidden. Upgrade to access your full history.`}
            cta="Unlock full history"
            variant="prominent"
            dismissKey="history-limit"
          />
        )}

        {!isPremium && hiddenCount === 0 && entries.length > 0 && (
          <UpgradeBanner
            message="You're viewing the last 30 days. Upgrade to see and export your complete history."
            dismissKey="history-30d"
          />
        )}

        <Card>
          <EntryList entries={visibleEntries} habits={habits} onUpdate={updateEntry} onDelete={deleteEntry} />
        </Card>
      </div>
    </AppLayout>
  );
}
