'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ProgressOverview } from '@/components/analytics/ProgressOverview';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskTimeline } from '@/components/alerts/RiskTimeline';
import { PatternInsights } from '@/components/analytics/PatternInsights';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { HabitBreakdown } from '@/components/dashboard/HabitBreakdown';
import { PremiumScoreCards } from '@/components/subscription/PremiumScoreCards';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Disclosure } from '@/components/ui/Disclosure';
import { useT } from '@/i18n/I18nProvider';

export default function AnalyticsPage() {
  const { entries, reductionEntries, habits, challenges, goals, isPremium, historyCutoff, analytics } = useApp();
  const t = useT();

  const visibleEntries = useMemo(() => {
    if (!historyCutoff) return entries;
    return entries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [entries, historyCutoff]);
  // Progress, patterns, risk and scores are about the habits being reduced (good habits excluded).
  const visibleReduction = useMemo(() => {
    if (!historyCutoff) return reductionEntries;
    return reductionEntries.filter(e => e.timestamp >= historyCutoff.getTime());
  }, [reductionEntries, historyCutoff]);
  const hasGoodHabits = reductionEntries.length !== entries.length;

  const hasData = entries.length > 0;

  return (
    <AppLayout title={t('analytics.title')}>
      <div className="space-y-6 lg:space-y-8 max-w-5xl">
        <PageHeader icon={<BarChart3 size={21} />} tone="indigo" title={t('analytics.title')} description={t('analytics.desc')} />

        <ProgressOverview entries={visibleReduction} habits={habits} />
        {hasGoodHabits && <p className="-mt-2 px-1 text-xs text-muted leading-relaxed">{t('analytics.goodHabitsNote')}</p>}

        {hasData && (
          <section aria-labelledby="more-details" className="space-y-3">
            <h2 id="more-details" className="section-heading">{t('analytics.moreDetails')}</h2>

            {!isPremium && (
              <UpgradeBanner
                message={t('analytics.premiumCharts')}
                cta={t('analytics.unlockFull')}
                dismissKey="analytics-limit"
              />
            )}

            <Disclosure title={t('analytics.patternsRisk')} hint={t('analytics.patternsRiskHint')}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <RiskTimeline entries={reductionEntries} days={14} />
                <PatternInsights entries={reductionEntries} habits={habits} />
              </div>
            </Disclosure>

            <Disclosure title={t('analytics.totals')} hint={t('analytics.totalsHint')}>
              <div className="space-y-4">
                <StatsGrid />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  <StreakCard />
                  <HabitBreakdown />
                </div>
                <PremiumScoreCards entries={reductionEntries} challenges={challenges} goals={goals} isPremium={isPremium} />
              </div>
            </Disclosure>

            <Disclosure title={t('analytics.yearGlance', { year: String(new Date().getFullYear()) })} hint={t('analytics.yearGlanceHint')}>
              <HeatmapCalendar dailyCounts={analytics.dailyCounts} />
            </Disclosure>

            <Disclosure title={t('analytics.allCharts')} hint={t('analytics.allChartsHint')}>
              <AnalyticsDashboard entries={visibleEntries} habits={habits} isPremium={isPremium} />
            </Disclosure>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
