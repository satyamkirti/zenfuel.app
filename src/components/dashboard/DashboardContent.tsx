'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { DetoxScoreCard } from '@/components/dashboard/DetoxScore';
import { GoalsPanel } from '@/components/dashboard/GoalsPanel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DashboardHero, HeroActions, StatTiles, HeroScreenTime } from '@/components/dashboard/DashboardHero';
import { ScreenTimeSummaryCard } from '@/components/screen-time/ScreenTimeSummaryCard';
import { useAppLabel } from '@/components/screen-time/parts';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { RiskAlert } from '@/components/alerts/RiskAlert';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/Card';
import { HabitCards, WeeklyProgress } from '@/components/dashboard/HomeSections';
import { habitTodayStats, lastNDays } from '@/utils/habitStats';
import { summarizeToday } from '@/lib/home/todaySummary';
import { useScreenTime } from '@/hooks/useScreenTime';
import { buildUsageInsights } from '@/lib/usage/records';
import { formatDuration } from '@/lib/usage/status';
import { computeChallengeProgress } from '@/utils/challenges';
import { filterEntriesByPeriod } from '@/utils/dateUtils';
import { comparePeriods, biggestHabitChange } from '@/utils/progress';
import { useI18n } from '@/i18n/I18nProvider';
import { isBuildHabit } from '@/lib/habits/templates';

type ScreenTime = ReturnType<typeof useScreenTime>;

// Pattern observations used when there is no clear week-on-week change. Streaks are already in
// the progress card; month-on-month figures are skipped because this month is still partial.
const HABIT_INSIGHT_ORDER = ['peak-hour', 'risk-day', 'top-habit'];
// Screen-time observations, most useful first.
const USAGE_INSIGHT_ORDER = ['over-', 'yesterday-vs-avg', 'top-share'];

const rank = (id: string, order: string[]) => {
  const i = order.findIndex(p => id === p || (p.endsWith('-') && id.startsWith(p)));
  return i === -1 ? Infinity : i;
};

/**
 * One observation, only when the user's own data supports it: measured screen time first, then a
 * week-on-week change in check-ins, then a pattern such as the usual time of day.
 */
function HomeInsight({ st }: { st: ScreenTime }) {
  const { insights, reductionEntries: entries, habits } = useApp();
  const { t } = useI18n();
  const { maskText, habitName } = usePrivacy();
  const label = useAppLabel();

  let text: string | null = null;
  if (st.phase === 'ready' && st.settings.trackingEnabled && st.summary.measuring) {
    const usage = buildUsageInsights(st.summary, label, formatDuration)
      .filter(i => rank(i.id, USAGE_INSIGHT_ORDER) !== Infinity)
      .sort((a, b) => rank(a.id, USAGE_INSIGHT_ORDER) - rank(b.id, USAGE_INSIGHT_ORDER));
    if (usage[0]) text = usage[0].text;
  }
  if (!text) {
    // A fair comparison: the last 7 days against the 7 days before.
    const change = biggestHabitChange(comparePeriods(entries, 7));
    if (change) {
      const name = habitName(habits.find(h => h.id === change.habitId), change.habitId);
      const vars = { name, times: t('common.times', { count: change.now }), days: 7, before: change.before };
      text = change.diff < 0 ? t('insight.down', vars) : t('insight.up', vars);
    }
  }
  if (!text) {
    const habit = insights
      .filter(i => rank(i.id, HABIT_INSIGHT_ORDER) !== Infinity)
      .sort((a, b) => rank(a.id, HABIT_INSIGHT_ORDER) - rank(b.id, HABIT_INSIGHT_ORDER));
    if (habit[0]) text = maskText(habit[0].message);
  }
  if (!text) return null;

  return (
    <section aria-labelledby="insight-title" className="relative overflow-hidden card p-5">
      <span className="pointer-events-none absolute -right-14 -top-14 w-44 h-44 rounded-full glow-purple" aria-hidden="true" />
      <div className="relative flex gap-3.5">
        <IconTile tone="purple" size="lg"><Sparkles size={19} /></IconTile>
        <div className="min-w-0">
          <h2 id="insight-title" className="text-xs font-semibold text-info">{t('insight.title')}</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{text}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * "Try this today": one concrete step. With a challenge running, it is getting through today;
 * otherwise a short challenge for the habit logged most in the last 30 days.
 */
function NextStep() {
  const { challenges, reductionEntries: entries, habits, startChallenge } = useApp();
  const { challengeName, challengeDescription, habitName } = usePrivacy();
  const { t } = useI18n();

  const active = challenges.find(c => c.isActive);
  if (active) {
    const p = computeChallengeProgress(active, entries);
    const habit = habits.find(h => h.id === active.habitId);
    const what = active.habitId === 'all' ? t('next.anything') : habit ? habitName(habit) : t('next.thisHabit');
    const finished = p.daysLeft === 0 && !p.isViolated;
    return (
      <section aria-labelledby="next-title" className="card p-5">
        <div className="flex items-center gap-3">
          <IconTile tone="orange" size="lg"><Trophy size={19} /></IconTile>
          <div className="flex-1 min-w-0">
            <h2 id="next-title" className="text-xs font-semibold text-accent-text">{t('next.yourChallenge')}</h2>
            <p className="font-display text-[15px] min-[380px]:text-base font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{challengeName(active)}</p>
          </div>
          {!p.isViolated && <span className="shrink-0 num text-lg font-bold text-ink">{Math.min(100, p.percentage)}%</span>}
        </div>
        <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">
          {p.isViolated
            ? t('next.broken')
            : finished
              ? t('next.finished')
              : t('next.dayOf', { day: p.daysDone + 1, total: active.durationDays, what })}
        </p>
        <div className="track h-2 mt-4" aria-hidden="true">
          <div className={p.isViolated ? 'bar-bad' : 'bar-accent'} style={{ width: `${Math.min(100, p.percentage)}%` }} />
        </div>
        <Link href="/challenges" className="mt-3 inline-flex items-center gap-0.5 min-h-[40px] text-sm font-semibold text-brand-text hover:underline">
          {t('next.view')} <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  // Suggest a challenge for the habit logged most recently often (last 30 days).
  const counts = new Map<string, number>();
  for (const e of filterEntriesByPeriod(entries, '30d')) counts.set(e.habitId, (counts.get(e.habitId) ?? 0) + 1);
  const available = challenges.filter(c => !c.isCompleted);
  const byHabit = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => available.find(c => c.habitId === id)).find(Boolean);
  const suggestion = byHabit ?? available.find(c => c.id === 'no-social-7') ?? available[0];
  if (!suggestion) return null;

  return (
    <section aria-labelledby="next-title" className="card p-5">
      <div className="flex items-center gap-3">
        <IconTile tone="orange" size="lg"><Trophy size={19} /></IconTile>
        <div className="flex-1 min-w-0">
          <h2 id="next-title" className="text-xs font-semibold text-accent-text">{t('next.tryToday')}</h2>
          <p className="font-display text-[15px] min-[380px]:text-base font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{challengeName(suggestion)}</p>
        </div>
        <span className="shrink-0 self-start mt-0.5 pill-accent">{t('common.days', { count: suggestion.durationDays })}</span>
      </div>
      <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">
        {withPeriod(challengeDescription(suggestion), t('common.period'))} {t('next.startsToday')}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="lg" onClick={() => startChallenge(suggestion.id)}>{t('next.start')}</Button>
        <Link href="/challenges" className="inline-flex items-center min-h-[44px] px-3 text-sm font-semibold text-brand-text hover:underline">{t('next.others')}</Link>
      </div>
    </section>
  );
}

/** A sentence that ends in the language's full stop (descriptions are stored without one). */
function withPeriod(text: string, period: string): string {
  const trimmed = text.trim();
  return /[.।!?]$/.test(trimmed) ? trimmed : trimmed + period;
}

export function DashboardContent() {
  // AppLayout shows a loading state until stored data has been read.
  const { streaks, detoxScore, isPremium, entries, reductionEntries, habits, riskAssessment, analytics, challenges } = useApp();
  const { t, locale } = useI18n();
  const st = useScreenTime();
  const hasData = entries.length > 0;
  const today = analytics.todayCount;

  // Real per-habit and per-day figures from the user's own check-ins.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const habitStats = useMemo(() => habitTodayStats(habits.filter(h => !h.isHidden), entries), [habits, entries, locale]);
  // "Clear" counts only make sense for habits being reduced (not good habits or personal ones).
  const homeHabits = habitStats.filter(s => s.habit.category !== 'adult' && !isBuildHabit(s.habit));
  // One summary for the hero and the tiles: an empty state until the first check-in.
  const todaySummary = summarizeToday(homeHabits, entries.length, today);
  const clearToday = todaySummary.kind === 'tracking' ? todaySummary.clear : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const week = useMemo(() => lastNDays(reductionEntries, 7), [reductionEntries, locale]);
  // Today's measured screen time for the hero gauge, only while Android is measuring.
  const screen: HeroScreenTime | null = useMemo(() => {
    if (st.phase !== 'ready' || !st.settings.trackingEnabled || !st.summary.measuring || st.summary.totalTodayMs === null) return null;
    const limited = st.summary.apps.filter(a => a.setting.limitMinutes);
    return {
      totalMs: st.summary.totalTodayMs,
      limitedUsedMs: limited.reduce((t, a) => t + (a.usedMs ?? 0), 0),
      limitSumMs: limited.reduce((t, a) => t + (a.setting.limitMinutes ?? 0) * 60_000, 0),
      allLimited: st.summary.apps.length > 0 && limited.length === st.summary.apps.length,
    };
  }, [st.phase, st.settings.trackingEnabled, st.summary]);
  const activeChallenge = challenges.find(c => c.isActive);
  const challengeProgress = activeChallenge ? computeChallengeProgress(activeChallenge, reductionEntries) : null;

  const previousWeek = useMemo(() => {
    const c = comparePeriods(reductionEntries, 7);
    return c.hasHistory ? c.previous.length : null;
  }, [reductionEntries]);

  return (
    <AppLayout title={t('nav.home')}>
      <div className="space-y-6 lg:space-y-7 rise">
        {/* The Home order: the scenic hero card, the two actions below it, then Choose Your Activities. */}
        <div className="space-y-3.5">
          <DashboardHero />
          <HeroActions />
        </div>

        {/* Choose Your Activities, with the score beside it on wide screens. One tree for new and
            returning users, so the card stays mounted (and keeps its confirmation and Undo) when the
            first tracked activity turns a new user into a returning one. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          <div className="lg:col-span-7"><QuickLog /></div>
          <div className="lg:col-span-5">
            <DetoxScoreCard score={detoxScore} currentStreak={streaks.currentStreak} todayCount={today} />
          </div>
        </div>

        {hasData && <StatTiles
          currentStreak={streaks.currentStreak}
          longestStreak={streaks.longestStreak}
          hasData={hasData}
          clearToday={clearToday}
          habitTotal={homeHabits.length}
          todayCount={today}
          showClear={screen !== null}
          challenge={activeChallenge && challengeProgress ? { done: Math.min(challengeProgress.daysDone, activeChallenge.durationDays), total: activeChallenge.durationDays } : null}
        />}

        {/* Risk is derived from logged events; with none yet, an alert would be misleading. */}
        {hasData && <RiskAlert assessment={riskAssessment} />}

        {hasData && <HabitCards stats={habitStats} />}

        {!isPremium && habits.length >= 3 && (
          <UpgradeBanner message={t('home.habitLimit')} dismissKey="habit-limit" variant="prominent" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {hasData && <div className="lg:col-span-7"><WeeklyProgress days={week} previousTotal={previousWeek} /></div>}
          <div className={hasData ? 'lg:col-span-5 space-y-4 min-w-0' : 'lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start'}>
            <ScreenTimeSummaryCard st={st} />
            <HomeInsight st={st} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start lg:[&>*:only-child]:col-span-2">
          <NextStep />
          <GoalsPanel />
        </div>

        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
            <RecentActivity limit={3} />
            <Link
              href="/analytics"
              className="card flex items-center justify-between gap-3 px-5 py-4 min-h-[64px] text-[15px] font-semibold text-ink hover:border-line-strong transition-colors"
            >
              <span>
                {t('home.viewProgress')}
                <span className="block text-sm font-normal text-muted">{t('home.viewProgressSub')}</span>
              </span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
