'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskTimeline } from '@/components/alerts/RiskTimeline';

export default function AnalyticsPage() {
  const { entries, habits, isPremium, historyCutoff } = useApp();

  const visibleEntries = useMemo(() => {
    if (!historyCutoff) return entries;
    return entries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [entries, historyCutoff]);

  return (
    <AppLayout title="Analytics">
      <div className="space-y-4">
        {!isPremium && (
          <UpgradeBanner
            message="Advanced charts (hourly, weekday radar, habit comparison) are a Premium feature."
            cta="Unlock full analytics"
            dismissKey="analytics-limit"
          />
        )}
        <RiskTimeline entries={entries} days={14} />
        <AnalyticsDashboard entries={visibleEntries} habits={habits} isPremium={isPremium} />
      </div>
    </AppLayout>
  );
}
