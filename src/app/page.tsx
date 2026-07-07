'use client';

import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { DetoxScoreCard } from '@/components/dashboard/DetoxScore';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { HabitBreakdown } from '@/components/dashboard/HabitBreakdown';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { ChallengesPanel } from '@/components/dashboard/ChallengesPanel';
import { GoalsPanel } from '@/components/dashboard/GoalsPanel';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { Card } from '@/components/ui/Card';
import { PremiumScoreCards } from '@/components/subscription/PremiumScoreCards';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskAlert } from '@/components/alerts/RiskAlert';

export default function DashboardPage() {
  const { analytics, streaks, detoxScore, isLoaded, isPremium, entries, challenges, goals, habits, riskAssessment } = useApp();

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* ── Risk Alert — shown at top whenever risk >= moderate ── */}
        <RiskAlert assessment={riskAssessment} />

        {/* Top: Score + Quick Log */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <DetoxScoreCard score={detoxScore} currentStreak={streaks.currentStreak} todayCount={analytics.todayCount} />
          </div>
          <div className="lg:col-span-3">
            <QuickLog />
          </div>
        </div>

        {/* Habit limit banner for free users */}
        {!isPremium && habits.length >= 3 && (
          <UpgradeBanner
            message="You've reached the 3-habit free limit. Upgrade to track unlimited habits."
            dismissKey="habit-limit"
            variant="prominent"
          />
        )}

        {/* Stats */}
        <StatsGrid />

        {/* Premium Scores */}
        <PremiumScoreCards entries={entries} challenges={challenges} goals={goals} isPremium={isPremium} />

        {/* Habit breakdown */}
        <HabitBreakdown />

        {/* Active challenges + goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChallengesPanel />
          <GoalsPanel />
        </div>

        {/* Streaks */}
        <StreakCard />

        {/* History limit notice for free users */}
        {!isPremium && analytics.lifetimeCount > 0 && (
          <UpgradeBanner
            message="Heatmap shows last 30 days. Upgrade to see your full year history."
            dismissKey="heatmap-limit"
          />
        )}

        {/* Heatmap */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">{new Date().getFullYear()} Activity Heatmap</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All habits combined · hover for details</p>
          </div>
          <div className="p-5 overflow-x-auto">
            <HeatmapCalendar dailyCounts={analytics.dailyCounts} />
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><ActivityBarChart data={analytics.dailyCounts} days={30} title="Last 30 Days" /></Card>
          <Card><MonthlyChart data={analytics.monthlyCounts} averagePerMonth={analytics.averagePerMonth} /></Card>
        </div>

        {/* Insights */}
        <InsightsPanel />
      </div>
    </AppLayout>
  );
}
