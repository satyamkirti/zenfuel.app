'use client';

import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';
import { clsx } from 'clsx';
import { DetoxScore as DetoxScoreType } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';

interface DetoxScoreProps {
  score: DetoxScoreType;
  currentStreak: number;
  todayCount: number;
}

const SIZE = 128;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const TIERS = [
  { label: 'Low', min: 0, max: 39, color: 'bg-red-500' },
  { label: 'Moderate', min: 40, max: 59, color: 'bg-amber-500' },
  { label: 'Good', min: 60, max: 79, color: 'bg-sky-500' },
  { label: 'Excellent', min: 80, max: 100, color: 'bg-emerald-500' },
];

export function DetoxScoreCard({ score, currentStreak, todayCount }: DetoxScoreProps) {
  const { discreet } = usePrivacy();
  const offset = CIRC * (1 - score.score / 100);
  const TrendIcon = score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Minus;
  const trend = score.trend === 'up' ? 'Improving' : score.trend === 'down' ? 'Slipping' : 'Stable';
  const trendClass = score.trend === 'up'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    : score.trend === 'down'
      ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
      : 'bg-surface-2 text-ink-2';

  return (
    <section aria-labelledby="score-title" className="h-full bg-surface border border-line rounded-2xl shadow-card p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 id="score-title" className="eyebrow">{discreet('Dopamine detox score', 'Daily score')}</h2>
        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', trendClass)}>
          <TrendIcon size={13} aria-hidden="true" />
          {trend}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-5 py-4">
        <div className="relative shrink-0" role="img" aria-label={`Score ${score.score} out of 100, ${score.label}`}>
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-surface-2" />
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={score.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-ink">{score.score}</span>
            <span className="text-xs font-medium text-muted">{score.label}</span>
          </div>
        </div>

        <dl className="flex-1 min-w-0 grid gap-3">
          <div>
            <dt className="text-xs text-muted flex items-center gap-1"><Flame size={12} aria-hidden="true" /> Current streak</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums text-ink">
              {currentStreak}<span className="text-sm font-normal text-muted ml-1">{currentStreak === 1 ? 'day' : 'days'}</span>
            </dd>
          </div>
          <div className="h-px bg-line" />
          <div>
            <dt className="text-xs text-muted">Events today</dt>
            <dd className={clsx('text-2xl font-semibold tracking-tight tabular-nums', todayCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink')}>
              {todayCount}
              {todayCount === 0 && <span className="text-sm font-normal text-muted ml-1">clean so far</span>}
            </dd>
          </div>
        </dl>
      </div>

      <div className="pt-1">
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {TIERS.map(t => {
            const active = score.score >= t.min && score.score <= t.max;
            return (
              <div key={t.label}>
                <div className={clsx('h-1.5 rounded-full', active ? t.color : 'bg-surface-2')} />
                <p className={clsx('mt-1.5 text-[11px]', active ? 'font-semibold text-ink' : 'text-muted')}>{t.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
