'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskTimeline } from '@/components/alerts/RiskTimeline';
import { PatternInsights } from '@/components/analytics/PatternInsights';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AnalyticsPage() {
  const { entries, habits, isPremium, historyCutoff } = useApp();

  const visibleEntries = useMemo(() => {
    if (!historyCutoff) return entries;
    return entries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [entries, historyCutoff]);

  return (
    <AppLayout title="Analytics">
      <div className="space-y-4 lg:space-y-5">
        <PageHeader title="Analytics" description="Patterns in your logs: when, how often and which habits." />
        {!isPremium && (
          <UpgradeBanner
            message="Advanced charts (hourly, weekday radar, habit comparison) are a Premium feature."
            cta="Unlock full analytics"
            dismissKey="analytics-limit"
          />
        )}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5 items-start">
          <RiskTimeline entries={entries} days={14} />
          <PatternInsights entries={entries} habits={habits} />
        </div>
        <AnalyticsDashboard entries={visibleEntries} habits={habits} isPremium={isPremium} />
      </div>
    </AppLayout>
  );
}
