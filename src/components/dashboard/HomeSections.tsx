'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Plus, Smartphone, Trophy, BarChart3, Flame, ChevronRight, CircleCheck } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';
import { IconTile, Tone } from '@/components/ui/Card';
import { HabitGlyph } from './HabitGlyph';
import { DayCell, HabitToday } from '@/utils/habitStats';
import { brandColor, tint } from '@/utils/palette';
import { useT } from '@/i18n/I18nProvider';
import { isBuildHabit } from '@/lib/habits/templates';
import { goalSummary } from '@/i18n/labels';

/** Four shortcuts to the things people do most. */
export function QuickActions() {
  const t = useT();
  const items: { href: string; label: string; icon: typeof Plus; tone: Tone }[] = [
    { href: '#quick-log', label: t('quickActions.track'), icon: Plus, tone: 'teal' },
    { href: '/screen-time', label: t('nav.screenTime'), icon: Smartphone, tone: 'blue' },
    { href: '/challenges', label: t('nav.challenges'), icon: Trophy, tone: 'orange' },
    { href: '/analytics', label: t('quickActions.progress'), icon: BarChart3, tone: 'indigo' },
  ];
  return (
    <nav aria-label={t('quickActions.label')} className="grid grid-cols-4 gap-2 sm:gap-3">
      {items.map(({ href, label, icon: Icon, tone }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-[20px] bg-surface border border-line shadow-card px-1 py-3 sm:py-4 text-center transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-lift hover:border-line-strong active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <IconTile tone={tone} size="lg" solid><Icon size={20} strokeWidth={2} /></IconTile>
          <span className="text-[12px] sm:text-[13px] font-semibold text-ink-2 group-hover:text-ink leading-tight">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** A compact 7-day bar strip; days without a check-in show as a small clear dot. */
function WeekStrip({ counts, color, positive }: { counts: number[]; color: string; positive?: boolean }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="flex items-end gap-[3px] h-7" aria-hidden="true">
      {counts.map((n, i) => (
        <span key={i} className="flex-1 flex items-end justify-center h-full">
          {n === 0
            ? <span className={clsx('w-1.5 h-1.5 rounded-full', positive ? 'bg-line-strong' : 'bg-good/70')} />
            : <span className="w-full rounded-[3px] grow-y" style={{ height: `${Math.max(22, (n / max) * 100)}%`, background: color, opacity: i === counts.length - 1 ? 1 : 0.75, animationDelay: `${i * 35}ms` }} />}
        </span>
      ))}
    </div>
  );
}

/**
 * "Today's habits": one card per habit with today's state, its clean streak and the last 7 days.
 * Personal habits are left out here so their names never appear on the home screen.
 */
export function HabitCards({ stats }: { stats: HabitToday[] }) {
  const { habitName } = usePrivacy();
  const t = useT();
  const shown = stats.filter(s => s.habit.category !== 'adult' && !s.habit.isHidden);
  if (shown.length === 0) return null;
  // Clear counts only the habits being reduced; good habits show whether they were done.
  const reducing = shown.filter(s => !isBuildHabit(s.habit));
  const clear = reducing.filter(s => s.today === 0).length;

  return (
    <section aria-labelledby="habits-today-title">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 id="habits-today-title" className="section-heading">{t('habitsToday.title')}</h2>
          {reducing.length > 0 && <p className="text-sm text-muted mt-0.5">{clear === reducing.length ? t('habitsToday.allClear') : t('habitsToday.someClear', { clear, total: reducing.length })}</p>}
        </div>
        <Link href="/habits" className="shrink-0 inline-flex items-center gap-0.5 min-h-[40px] px-2 -mr-2 rounded-xl text-sm font-semibold text-brand-text hover:bg-brand-soft">
          {t('habitsToday.manage')} <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <ul className="-mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shown.map(({ habit, today, streak, hasHistory, week }, i) => {
          const color = brandColor(habit.color, i);
          const clean = today === 0;
          const good = isBuildHabit(habit);
          return (
            <li key={habit.id} className="snap-start shrink-0 w-[152px] sm:w-auto">
              <div className="h-full card p-3.5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="tint w-10 h-10 rounded-xl flex items-center justify-center" style={tint(color)}>
                    <HabitGlyph habit={habit} size={20} />
                  </span>
                  {good
                    ? today > 0
                      ? <span className="pill-good"><CircleCheck size={12} aria-hidden="true" />{habit.goal?.kind === 'count' && habit.goal.count ? `${today}/${habit.goal.count}` : t('habitsToday.doneToday')}</span>
                      : <span className="pill-neutral">{t('habitsToday.notYet')}</span>
                    : clean
                      ? <span className="pill-good pop-in" style={{ animationDelay: `${200 + i * 50}ms` }}><CircleCheck size={12} aria-hidden="true" />{t('habitsToday.clear')}</span>
                      : <span className="pill-warn">{t('habitsToday.countToday', { count: today })}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink truncate">{habitName(habit)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    {good
                      ? <span className="truncate">{goalSummary(t, habit.goal) ?? t('goal.goodHabitBadge')}</span>
                      : hasHistory
                        ? streak > 0
                          ? <><Flame size={13} className="text-amber-500" aria-hidden="true" /><span className="tabular-nums">{t('habitsToday.streak', { count: streak })}</span></>
                          : <span>{t('habitsToday.restarts')}</span>
                        : t('habitsToday.noActivity')}
                  </p>
                </div>
                <WeekStrip counts={week} color={color} positive={good} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** This week at a glance: check-ins per day for the last 7 days and how many days were clear. */
export function WeeklyProgress({ days, previousTotal }: { days: DayCell[]; previousTotal: number | null }) {
  const t = useT();
  const total = days.reduce((s, d) => s + d.count, 0);
  const tracked = days.filter(d => d.tracked);
  const clearDays = tracked.filter(d => d.count === 0).length;
  const max = Math.max(1, ...days.map(d => d.count));
  const diff = previousTotal === null ? null : total - previousTotal;

  return (
    <section aria-labelledby="week-title" className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="week-title" className="font-display text-base font-semibold tracking-tight text-ink">{t('week.title')}</h2>
          <p className="text-sm text-muted mt-0.5">{t('week.sub')}</p>
        </div>
        <Link href="/analytics" className="shrink-0 inline-flex items-center gap-0.5 min-h-[36px] px-2 -mr-2 rounded-xl text-sm font-semibold text-brand-text hover:bg-brand-soft">
          {t('week.details')} <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 h-32 items-end" role="img" aria-label={days.map(d => `${d.label}: ${d.count}`).join(', ')}>
        {days.map(d => (
          <div key={d.key} className="flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-[11px] font-semibold tabular-nums text-muted">{d.count > 0 ? d.count : ''}</span>
            <div className="w-full max-w-[34px] flex-1 flex items-end rounded-[10px] bg-surface-2 dark:bg-white/[0.04] overflow-hidden">
              <div
                className={clsx('w-full rounded-[10px] transition-[height] duration-700 grow-y', d.isToday ? 'bg-gradient-to-t from-cyan-500 to-cyan-300' : 'bg-gradient-to-t from-blue-600 to-blue-400')}
                style={{ height: d.count > 0 ? `${Math.max(10, (d.count / max) * 100)}%` : '0%', animationDelay: `${days.indexOf(d) * 45}ms` }}
              />
            </div>
            <span className={clsx('text-[11px] font-semibold', d.isToday ? 'text-ink' : 'text-muted')}>{d.isToday ? t('week.today') : d.label}</span>
          </div>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2">
        <div className="tile px-3 py-2.5">
          <dt className="text-[11px] font-medium text-muted">{t('week.tracked')}</dt>
          <dd className="num text-lg font-bold text-ink">{total}</dd>
        </div>
        <div className="tile px-3 py-2.5">
          <dt className="text-[11px] font-medium text-muted">{t('week.clearDays')}</dt>
          <dd className="num text-lg font-bold text-ink">{tracked.length ? `${clearDays}/${tracked.length}` : '—'}</dd>
        </div>
        <div className="tile px-3 py-2.5">
          <dt className="text-[11px] font-medium text-muted">{t('week.vsBefore')}</dt>
          <dd className="num text-lg font-bold text-ink">{diff === null ? '—' : diff === 0 ? t('week.same') : diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`}</dd>
        </div>
      </dl>
    </section>
  );
}
