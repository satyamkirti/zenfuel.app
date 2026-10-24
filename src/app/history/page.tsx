'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntryList } from '@/components/history/EntryList';
import { Card } from '@/components/ui/Card';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { PageHeader } from '@/components/ui/PageHeader';

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
        <PageHeader
          title="Event History"
          description={isPremium ? `${entries.length} total events · search, filter, edit or delete` : `Showing last 30 days (${visibleEntries.length} events)`}
        />

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
            message="You're viewing the last 30 days. Upgrade to see your complete history."
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
