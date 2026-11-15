'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Smartphone, Flame, CircleCheck, ArrowRight, Trophy, CalendarCheck, Plus } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';
import { MountainScene } from '@/components/scene/MountainScene';
import { TONE, Tone } from '@/components/ui/Card';
import { greetingKey, skyPhase } from '@/lib/home/dayPart';
import { formatDateStyle } from '@/i18n/format';
import { useLocalDayPart } from '@/hooks/useLocalDayPart';
import { useT } from '@/i18n/I18nProvider';

/** The animated landscape as a card background (also used on the beta page). */
export function HeroArtwork({ className = '' }: { className?: string }) {
  return <MountainScene className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} />;
}

/** Measured screen time for the gauge, only when Android is actually measuring today. */
export interface HeroScreenTime {
  totalMs: number;
  /** Time used in apps that have a daily limit, and the sum of those limits. */
  limitedUsedMs: number;
  limitSumMs: number;
  /** True when every tracked app has a limit, so "of X limit" covers the whole total. */
  allLimited: boolean;
}

// The Home hero: a standalone scenic card with the date, the greeting and the subtitle over the
// animated mountain-and-sun landscape, and nothing else, so the artwork stays unobstructed. The
// actions live below it (HeroActions). Light mode is a daytime scene with navy text; dark mode is
// the same scene in rich blues with white text. The sky follows the device's local time: the sun
// through the morning and afternoon, a crescent moon in the evening and at night.
export function DashboardHero() {
  const now = useLocalDayPart();
  const t = useT();
  const phase = skyPhase(now.getHours());
  return (
    <section
      aria-labelledby="hero-title"
      data-sky={phase}
      className="relative overflow-hidden rounded-[28px] bg-sky-200 dark:bg-navy-950 shadow-card ring-1 ring-[#10254a]/[0.06] dark:ring-white/10 min-h-[196px] min-[400px]:min-h-[210px] sm:min-h-[250px] lg:min-h-[280px]"
    >
      {/* Phones: the full landscape. Wider cards: the scene's wide framing (sun and ridges), so the
          sun is never cropped. Only one is displayed, so only one animates. */}
      <MountainScene themed phase={phase} className="md:hidden pointer-events-none absolute inset-0 w-full h-full" />
      <MountainScene themed banner phase={phase} className="hidden md:block pointer-events-none absolute inset-0 w-full h-full" />
      {/* Light: a faint white wash keeps the navy text crisp on the sky. Dark: a soft shade instead. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/30 to-transparent dark:from-[#061d4a]/70 dark:via-[#061d4a]/25" aria-hidden="true" />

      <div className="relative px-5 pt-4 pb-6 sm:px-8 sm:pt-7">
        <p className="text-[13px] sm:text-sm font-semibold text-[#10254a]/85 dark:text-sky-100 dark:[text-shadow:0_1px_8px_rgb(0_0_0/0.5)]">{formatDateStyle(now, 'full')}</p>
        <h1 id="hero-title" className="mt-0.5 font-display text-[27px] min-[400px]:text-[29px] sm:text-[34px] font-bold tracking-tight leading-[1.1] text-[#0b2150] dark:text-white dark:[text-shadow:0_2px_14px_rgb(0_0_0/0.45)]">{t(greetingKey(now.getHours()))}</h1>
        <p className="mt-1 text-[15px] text-[#10254a]/90 dark:text-white/85 dark:[text-shadow:0_1px_8px_rgb(0_0_0/0.5)]">{t('hero.subtitle')}</p>
      </div>
    </section>
  );
}

/** The small runner and flag on a hill path, drawn inside the Track a Habit button. */
function RunnerFlagArt() {
  return (
    <svg viewBox="0 0 72 40" className="h-9 w-auto shrink-0" fill="none" aria-hidden="true">
      {/* Hill and path: a soft white rise with a curving trail toward the flag. */}
      <path d="M0 40 C 14 31 28 30 40 33 C 52 36 60 30 72 26 L72 40 Z" fill="#fff" fillOpacity="0.16" />
      <path d="M2 38 C 16 31 30 31 42 34 C 54 37 62 31 72 27" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      {/* Flag. */}
      <path d="M57 29 V7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M57 7.5 L68 11 L57 14.5 Z" fill="#fff" />
      {/* Runner. */}
      <circle cx="33" cy="7" r="3.4" fill="#fff" />
      <g stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 11.5 L28.5 21" />
        <path d="M31.5 13 L36.5 16 L39.5 12.5" />
        <path d="M31 13.5 L25.5 15.5 L22.5 13" />
        <path d="M28.5 21 L34 24.5 L33 30.5" />
        <path d="M28.5 21 L23 25.5 L18 25" />
      </g>
    </svg>
  );
}

/**
 * The two Home actions, directly below the hero card: Track a Habit (jumps to Choose Your
 * Activities) and Track Your Screen Time (the Screen Time page). Same placement in both themes.
 */
export function HeroActions() {
  const t = useT();
  return (
    <nav aria-label={t('hero.actions')} className="flex flex-col items-stretch gap-3 max-w-xl mx-auto w-full">
      <a
        href="#quick-log"
        className="track-habit-btn relative overflow-hidden flex items-center gap-3 min-h-[58px] rounded-full pl-6 pr-4 text-white shadow-[0_12px_26px_-12px_rgb(13_148_136/0.7)] ring-1 ring-inset ring-white/20 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      >
        <Plus size={24} strokeWidth={2.75} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 min-w-0 font-display text-[19px] min-[380px]:text-[20px] font-bold tracking-tight truncate">{t('hero.trackHabit')}</span>
        <RunnerFlagArt />
      </a>
      <Link
        href="/screen-time"
        className="flex items-center justify-center gap-2.5 min-h-[48px] mx-1 rounded-full bg-white px-4 text-[15px] min-[380px]:text-base font-bold text-[#0b2a5a] ring-1 ring-[#1265d8]/25 shadow-sm hover:bg-sky-50 active:scale-[0.98] transition-[transform,background-color] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 dark:ring-white/40"
      >
        <Smartphone size={20} className="shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">{t('hero.trackScreenTime')}</span>
        <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
      </Link>
    </nav>
  );
}

interface StatTilesProps {
  currentStreak: number;
  longestStreak: number;
  hasData: boolean;
  clearToday: number;
  habitTotal: number;
  todayCount: number;
  showClear: boolean;
  challenge: { done: number; total: number } | null;
}

/**
 * Three figures under the hero: streak, today, and the running challenge. Each opens its page.
 * Colourful summary cards: streak orange, today blue, challenge purple, all with white type.
 */
export function StatTiles({ currentStreak, longestStreak, hasData, clearToday, habitTotal, todayCount, showClear, challenge }: StatTilesProps) {
  // A gentle glow when the current streak is the best one so far (and worth noticing).
  const t = useT();
  const best = hasData && currentStreak >= 2 && currentStreak >= longestStreak;
  const tile = (tone: Tone) => clsx('relative overflow-hidden rounded-card bg-gradient-to-br text-white shadow-lift ring-1 ring-inset ring-white/15 flex flex-col items-center text-center gap-1 px-2 py-3.5 transition-[transform,box-shadow] hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:ring-brand', TONE[tone].card);
  const glow = <span className="pointer-events-none absolute -right-6 -top-8 w-20 h-20 rounded-full bg-white/[0.14]" aria-hidden="true" />;
  const badge = 'relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 ring-1 ring-inset ring-white/25 text-white';
  const num = 'relative num text-[22px] font-extrabold leading-tight text-white';
  const cap = 'relative text-[11.5px] font-semibold text-white/90 leading-tight';
  const part = 'text-white/70 text-base';
  return (
    <nav aria-label={t('tiles.label')} className="grid grid-cols-3 gap-2.5 sm:gap-3">
      <Link href="/analytics" className={tile('orange')}>
        {glow}
        <span className={clsx(badge, best && 'achieve-glow')} aria-hidden="true"><Flame size={19} /></span>
        <span className={num}><CountUp value={currentStreak} /></span>
        <span className={cap}>{best ? t('tiles.bestStreak') : t('tiles.dayStreak')}</span>
      </Link>
      <Link href="/habits" className={tile('blue')}>
        {glow}
        <span className={badge} aria-hidden="true">
          {showClear ? <CircleCheck size={19} /> : <CalendarCheck size={19} />}
        </span>
        <span className={num}>
          {showClear ? <><CountUp value={clearToday} /><span className={part}>/{habitTotal}</span></> : <CountUp value={todayCount} />}
        </span>
        <span className={cap}>{showClear ? t('tiles.habitsClear') : t('tiles.trackedToday')}</span>
      </Link>
      <Link href="/challenges" className={tile('purple')}>
        {glow}
        <span className={badge} aria-hidden="true"><Trophy size={19} /></span>
        <span className={num}>
          {challenge ? <><CountUp value={challenge.done} /><span className={part}>/{challenge.total}</span></> : <span className="text-white/80">0</span>}
        </span>
        <span className={cap}>{challenge ? t('tiles.challengeDays') : t('tiles.startChallenge')}</span>
      </Link>
    </nav>
  );
}
