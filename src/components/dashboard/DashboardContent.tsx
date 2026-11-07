'use client';

import Link from 'next/link';
import { Activity, CalendarDays, Target, Trophy, ArrowRight, Plus, Sparkles } from 'lucide-react';
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

function GettingStarted() {
  const steps = [
    { icon: <Plus size={16} />, title: 'Log your first event', text: 'Pick a habit in Quick log above whenever it happens. It takes one tap.' },
    { icon: <Target size={16} />, title: 'Set a goal', text: 'A weekly limit, a streak target, or a percentage reduction.', href: '/goals', cta: 'Open goals' },
    { icon: <Trophy size={16} />, title: 'Start a challenge', text: 'Seven or thirty days away from one habit, or all of them.', href: '/challenges', cta: 'Browse challenges' },
  ];
  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-teal-400/10 blur-2xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center gap-2 text-brand-text">
          <Sparkles size={15} aria-hidden="true" />
          <p className="eyebrow !text-brand-text">Your next steps</p>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink mt-2">A clearer picture starts with one small step.</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
          Your streaks, charts, insights and scores are calculated only from what you record. Your habit data stays on this device.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-surface-2/75 p-4 flex flex-col">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span className="w-8 h-8 rounded-xl bg-surface text-brand-text border border-line flex items-center justify-center" aria-hidden="true">{s.icon}</span>
                <span><span className="sr-only">Step {i + 1}: </span>{s.title}</span>
              </span>
              <span className="text-xs text-muted mt-3 leading-relaxed flex-1">{s.text}</span>
              {s.href && (
                <Link href={s.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-text hover:underline">
                  {s.cta} <ArrowRight size={12} aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function DashboardContent() {
  const { analytics, streaks, detoxScore, isPremium, entries, challenges, goals, habits, riskAssessment } = useApp();
  const now = new Date();
  const hasData = entries.length > 0;
  const today = analytics.todayCount;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-5 lg:space-y-6">
        <header className="relative isolate overflow-hidden rounded-[26px] border border-blue-100 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-[#10243B] dark:via-[#102035] dark:to-[#10343A] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/10" aria-hidden="true" />
          <div className="pointer-events-none absolute right-24 -bottom-24 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-400/10" aria-hidden="true" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-text">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
                Personal progress
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted mt-3">{WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}</p>
              <h1 className="mt-1 text-[28px] sm:text-[34px] leading-tight font-bold tracking-[-0.04em] text-ink">{greeting(now.getHours())}</h1>
              <p className="text-sm text-ink-2/80 dark:text-ink-2 mt-1.5 max-w-lg">Build more awareness, stay consistent, and make progress one day at a time.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-sm backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${today === 0 ? 'bg-teal-500' : 'bg-amber-500'}`} aria-hidden="true" />
                {today === 0 ? 'Nothing logged today' : `${today} ${today === 1 ? 'event' : 'events'} today`}
              </span>
              {streaks.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-sm backdrop-blur">
                  <span aria-hidden="true">🔥</span> {streaks.currentStreak}-day streak
                </span>
              )}
            </div>
          </div>
        </header>

        {hasData && <RiskAlert assessment={riskAssessment} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-5 min-w-0">
            <DetoxScoreCard score={detoxScore} currentStreak={streaks.currentStreak} todayCount={today} />
          </div>
          <div className="lg:col-span-7 min-w-0">
            <QuickLog />
          </div>
        </div>

        {!isPremium && habits.length >= 3 && (
          <UpgradeBanner message="You've reached the 3-habit free limit. Upgrade to track unlimited habits." dismissKey="habit-limit" variant="prominent" />
        )}

        <StatsGrid />

        {!hasData && <GettingStarted />}

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 lg:space-y-5 min-w-0">
            {hasData && <StreakCard />}
            <ChallengesPanel />
            <GoalsPanel />
            <RecentActivity />
            {hasData && <PremiumScoreCards entries={entries} challenges={challenges} goals={goals} isPremium={isPremium} />}
          </div>

          <div className="order-2 lg:order-1 lg:col-span-8 space-y-4 lg:space-y-5 min-w-0">
            {hasData && (
              <>
                <Card padding="lg">
                  <ActivityBarChart data={analytics.dailyCounts} days={30} title="Your activity · last 30 days" />
                </Card>
                <HabitBreakdown />
                <Card padding="none" className="overflow-hidden">
                  <CardHeader
                    icon={<CalendarDays size={16} />}
                    title={`${now.getFullYear()} at a glance`}
                    subtitle="All habits combined · hover a day for details"
                  />
                  <div className="px-4 sm:px-5 pb-5 overflow-x-auto">
                    <HeatmapCalendar dailyCounts={analytics.dailyCounts} />
                  </div>
                </Card>
                <Card padding="lg">
                  <MonthlyChart data={analytics.monthlyCounts} averagePerMonth={analytics.averagePerMonth} />
                </Card>
              </>
            )}
            <InsightsPanel />
            {hasData && (
              <Link href="/analytics" className="group flex items-center justify-between gap-3 rounded-[20px] border border-blue-100 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/80 to-teal-50/70 dark:from-blue-950/20 dark:to-teal-950/20 px-5 py-4 text-sm text-ink-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-white dark:bg-surface border border-line text-brand-text flex items-center justify-center shrink-0"><Activity size={17} aria-hidden="true" /></span>
                  <span><span className="block font-semibold text-ink">Explore your patterns</span><span className="block text-xs text-muted mt-0.5">Hourly, weekday and yearly views are in Analytics.</span></span>
                </span>
                <ArrowRight size={17} className="shrink-0 text-brand-text transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
