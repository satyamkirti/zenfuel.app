'use client';

import { useMemo } from 'react';
import { History } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntryList } from '@/components/history/EntryList';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { useT } from '@/i18n/I18nProvider';

export default function HistoryPage() {
  const { entries, habits, updateEntry, deleteEntry, isPremium, historyCutoff } = useApp();
  const t = useT();

  const visibleEntries = useMemo(() => {
    if (!historyCutoff) return entries;
    return entries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [entries, historyCutoff]);

  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <AppLayout title={t('history.title')}>
      <div className="space-y-4">
        <PageHeader
          icon={<History size={21} />}
          tone="pink"
          title={t('history.title')}
          description={isPremium ? t('history.desc', { count: entries.length }) : t('history.descFree', { count: visibleEntries.length })}
        />

        {!isPremium && hiddenCount > 0 && (
          <UpgradeBanner
            message={t('history.olderHidden', { count: hiddenCount })}
            cta={t('history.unlock')}
            variant="prominent"
            dismissKey="history-limit"
          />
        )}

        {!isPremium && hiddenCount === 0 && entries.length > 0 && (
          <UpgradeBanner
            message={t('history.last30')}
            dismissKey="history-30d"
          />
        )}

        <EntryList entries={visibleEntries} habits={habits} onUpdate={updateEntry} onDelete={deleteEntry} />
      </div>
    </AppLayout>
  );
}
