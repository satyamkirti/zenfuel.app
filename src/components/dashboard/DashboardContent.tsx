'use client';

import Link from 'next/link';
import { Activity, CalendarDays, Target, Trophy, ArrowRight, Plus } from 'lucide-react';
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
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { Card, CardHeader } from '@/components/ui/Card';
import { PremiumScoreCards } from '@/components/subscription/PremiumScoreCards';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskAlert } from '@/components/alerts/RiskAlert';
import { WEEKDAYS, MONTHS } from '@/utils/dateUtils';

function greeting(hour: number) {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Shown before the first entry: what to do next, with links to real features (no sample data).
function GettingStarted() {
  const steps = [
    { icon: <Plus size={16} />, title: 'Log your first event', text: 'Pick a habit in Quick log above whenever it happens. It takes one tap.' },
    { icon: <Target size={16} />, title: 'Set a goal', text: 'A weekly limit, a streak target, or a percentage reduction.', href: '/goals', cta: 'Open goals' },
    { icon: <Trophy size={16} />, title: 'Start a challenge', text: 'Seven or thirty days away from one habit, or all of them.', href: '/challenges', cta: 'Browse challenges' },
  ];
  return (
    <Card padding="lg">
      <p className="eyebrow">Getting started</p>
      <h2 className="text-lg font-semibold text-ink mt-1">Your dashboard fills in as you log</h2>
      <p className="text-sm text-muted mt-1 max-w-xl">
        Streaks, charts, insights and scores are calculated only from what you record. Everything stays in this browser.
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl bg-surface-2 p-4 flex flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="w-7 h-7 rounded-lg bg-surface text-brand-text flex items-center justify-center" aria-hidden="true">{s.icon}</span>
              <span><span className="sr-only">Step {i + 1}: </span>{s.title}</span>
            </span>
            <span className="text-xs text-muted mt-2 leading-relaxed flex-1">{s.text}</span>
            {s.href && (
              <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline">
                {s.cta} <ArrowRight size={12} aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function DashboardContent() {
  // AppLayout shows a loading state until stored data has been read.
  const { analytics, streaks, detoxScore, isPremium, entries, challenges, goals, habits, riskAssessment } = useApp();
  const now = new Date();
  const hasData = entries.length > 0;
  const today = analytics.todayCount;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-4 lg:space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-sm text-muted">{WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}</p>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-ink">{greeting(now.getHours())}</h1>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-surface border border-line px-3 py-1.5 text-xs font-medium text-ink-2" role="status">
            <span className={`w-2 h-2 rounded-full ${today === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
            {today === 0 ? 'Nothing logged today' : `${today} ${today === 1 ? 'event' : 'events'} logged today`}
            {streaks.currentStreak > 0 && <span className="text-muted">· {streaks.currentStreak}-day streak</span>}
          </p>
        </header>

        {/* Risk is derived from logged events; with none yet, an alert would be misleading. */}
        {hasData && <RiskAlert assessment={riskAssessment} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-5">
            <DetoxScoreCard score={detoxScore} currentStreak={streaks.currentStreak} todayCount={today} />
          </div>
          <div className="lg:col-span-7">
            <QuickLog />
          </div>
        </div>

        {!isPremium && habits.length >= 3 && (
          <UpgradeBanner message="You've reached the 3-habit free limit. Upgrade to track unlimited habits." dismissKey="habit-limit" variant="prominent" />
        )}

        <StatsGrid />

        {!hasData && <GettingStarted />}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Supporting column: first on phones (most actionable), right-hand on desktop. */}
          <div className="order-1 lg:order-2 space-y-4 lg:space-y-5 min-w-0">
            {hasData && <StreakCard />}
            <ChallengesPanel />
            <GoalsPanel />
            <RecentActivity />
            {hasData && <PremiumScoreCards entries={entries} challenges={challenges} goals={goals} isPremium={isPremium} />}
          </div>

          <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 lg:space-y-5 min-w-0">
            {hasData && (
              <>
                <Card>
                  <ActivityBarChart data={analytics.dailyCounts} days={30} title="Last 30 days" />
                </Card>
                <HabitBreakdown />
                <Card padding="none">
                  <CardHeader
                    icon={<CalendarDays size={16} />}
                    title={`${now.getFullYear()} at a glance`}
                    subtitle="All habits combined · hover a day for details"
                  />
                  <div className="px-5 pb-5">
                    <HeatmapCalendar dailyCounts={analytics.dailyCounts} />
                  </div>
                </Card>
                <Card>
                  <MonthlyChart data={analytics.monthlyCounts} averagePerMonth={analytics.averagePerMonth} />
                </Card>
              </>
            )}
            <InsightsPanel />
            {hasData && (
              <Link href="/analytics" className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-4 text-sm text-ink-2 hover:text-ink hover:border-violet-400 transition-colors">
                <span className="flex items-center gap-2"><Activity size={16} aria-hidden="true" /> Hourly, weekday and yearly patterns are in Analytics</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
