'use client';

import { Gauge } from 'lucide-react';
import { clsx } from 'clsx';
import { DetoxScore as DetoxScoreType } from '@/types';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { IconTile } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { getStartOfWeek } from '@/utils/dateUtils';
import { useT } from '@/i18n/I18nProvider';
import { scoreLabel } from '@/i18n/labels';

interface DetoxScoreProps {
  score: DetoxScoreType;
  currentStreak: number;
  todayCount: number;
}

const SIZE = 132;
const STROKE = 13;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const WEEK = 7 * 86_400_000;

const TIERS = [
  { label: 'score.tier.low', min: 0, max: 39, color: 'bg-red-500' },
  { label: 'score.tier.moderate', min: 40, max: 59, color: 'bg-amber-500' },
  { label: 'score.tier.good', min: 60, max: 79, color: 'bg-blue-500' },
  { label: 'score.tier.excellent', min: 80, max: 100, color: 'bg-emerald-500' },
] as const;

function ScoreHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="relative flex items-center gap-3 min-w-0">
      <IconTile tone="teal" size="lg" solid className="shadow-glow"><Gauge size={20} /></IconTile>
      <div className="min-w-0">
        <h2 id="score-title" className="font-display text-[17px] font-semibold tracking-tight text-ink leading-snug">{title}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
    </div>
  );
}

function Tiers({ score }: { score: number | null }) {
  const t = useT();
  return (
    <div className="relative grid grid-cols-4 gap-1.5" aria-hidden="true">
      {TIERS.map(tier => {
        const active = score !== null && score >= tier.min && score <= tier.max;
        return (
          <div key={tier.label}>
            <div className={clsx('h-2 rounded-full transition-colors duration-500', active ? tier.color : 'bg-surface-3 dark:bg-white/[0.07]')} />
            <p className={clsx('mt-1.5 text-[11px]', active ? 'font-semibold text-ink' : 'text-muted')}>{t(tier.label)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DetoxScoreCard({ score, currentStreak, todayCount }: DetoxScoreProps) {
  const { reductionEntries: entries } = useApp();
  const { discreet } = usePrivacy();
  const t = useT();
  const title = discreet(t('score.title'), t('score.titleDiscreet'));
  const label = scoreLabel(t, score.label);
  const plural = (n: number) => t('quicklog.activities', { count: n });
  const hasData = score.label !== 'Not enough data yet';

  // Before the first check-in there is nothing to score: a short note instead of an empty gauge.
  if (!hasData) {
    return (
      <section aria-labelledby="score-title" className="relative h-full overflow-hidden panel surface-mint p-5 sm:p-6 flex flex-col">
        <ScoreHeader title={title} sub={t('score.emptySub')} />
        <div className="relative flex-1 flex items-center gap-5 py-5">
          <div className="relative shrink-0 w-[104px] h-[104px] rounded-full border-[10px] border-dashed border-teal-200/80 dark:border-white/10 flex items-center justify-center" aria-hidden="true">
            <span className="font-display text-3xl font-bold text-muted/70">–</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-ink leading-snug">{t('score.noScore')}</p>
            <p className="mt-1 text-sm text-muted leading-relaxed">{t('score.noScoreBody')}</p>
          </div>
        </div>
        <Tiers score={null} />
      </section>
    );
  }

  // The score is about today; the weekly line is a separate, plain count. These are the same week
  // boundaries the score's own trend uses (this week since Sunday against the whole of last week).
  const weekStart = getStartOfWeek().getTime();
  const thisWeek = entries.filter(e => e.timestamp >= weekStart).length;
  const lastWeek = entries.filter(e => e.timestamp >= weekStart - WEEK && e.timestamp < weekStart).length;
  const offset = CIRC * (1 - score.score / 100);

  return (
    <section aria-labelledby="score-title" className="relative h-full overflow-hidden panel surface-mint p-5 sm:p-6 flex flex-col">
      <ScoreHeader title={title} sub={t('score.todaySub')} />

      <div className="relative flex-1 flex flex-col min-[360px]:flex-row items-center gap-5 py-4">
        <div className="relative shrink-0" role="img" aria-label={t('score.aria', { score: score.score, label })}>
          <svg width={SIZE} height={SIZE} className="relative -rotate-90" aria-hidden="true">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-surface-3 dark:text-surface-2" />
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={score.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              className="ring-draw"
              style={{ ['--ring-from' as string]: CIRC, transition: 'stroke-dashoffset 0.8s var(--ease-out)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[40px] leading-none font-extrabold tracking-tight tabular-nums text-ink"><CountUp value={score.score} /></span>
            <span className="mt-1 text-xs font-semibold text-muted">{t('score.of100')}</span>
          </div>
        </div>

        <div className="w-full flex-1 min-w-0 text-center min-[360px]:text-left">
          <p className="inline-flex items-center gap-2 font-display text-xl font-bold text-ink"><span className="w-2.5 h-2.5 rounded-full" style={{ background: score.color }} aria-hidden="true" />{label}</p>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            {todayCount === 0
              ? t('score.nothingToday')
              : currentStreak > 0
                ? t('score.fromTodayStreak', { count: todayCount, streak: currentStreak })
                : t('score.fromToday', { count: todayCount })}
          </p>
        </div>
      </div>

      <Tiers score={score.score} />

      <p className="relative mt-4 pt-3.5 border-t border-line text-sm text-ink-2">
        <span className="font-medium text-ink">{t('score.thisWeek')}</span> {plural(thisWeek)}
        <span className="text-muted"> · {t('score.lastWeek', { value: plural(lastWeek) })}</span>
      </p>
    </section>
  );
}
