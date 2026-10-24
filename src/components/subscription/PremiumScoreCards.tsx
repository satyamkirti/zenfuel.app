'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LogEntry } from '@/types';
import { Challenge, Goal } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { LockOverlay } from './LockOverlay';
import { computeFocusScore, computeDisciplineScore, computeProductivityScore, computeRelapseRisk } from '@/utils/premiumScores';
import { computeDetoxScore } from '@/utils/detoxScore';
import { Brain, Target, Zap, AlertTriangle } from 'lucide-react';

interface ScoreRingProps {
  score: number;
  color: string;
  size?: number;
}

function ScoreRing({ score, color, size = 80 }: ScoreRingProps) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-line" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

interface PremiumScoreCardsProps {
  entries: LogEntry[];
  challenges: Challenge[];
  goals: Goal[];
  isPremium: boolean;
}

export function PremiumScoreCards({ entries, challenges, goals, isPremium }: PremiumScoreCardsProps) {
  const focusScore = useMemo(() => computeFocusScore(entries), [entries]);
  const disciplineScore = useMemo(() => computeDisciplineScore(
    entries,
    challenges.filter(c => c.isCompleted).length,
    goals.filter(g => g.isActive).length
  ), [entries, challenges, goals]);
  const detoxScore = useMemo(() => computeDetoxScore(entries), [entries]);
  const productivityScore = useMemo(() => computeProductivityScore(focusScore.score, disciplineScore.score, detoxScore.score), [focusScore, disciplineScore, detoxScore]);
  const relapseRisk = useMemo(() => computeRelapseRisk(entries), [entries]);

  const scores = [
    { label: 'Focus', icon: <Brain size={14} />, data: focusScore, desc: 'Resistance to work-hour & trigger-time sessions' },
    { label: 'Discipline', icon: <Target size={14} />, data: disciplineScore, desc: 'Streaks, completed challenges & goals' },
    { label: 'Productivity', icon: <Zap size={14} />, data: productivityScore, desc: 'Composite of all three scores' },
  ];

  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {scores.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1.5 py-3 px-1 bg-surface-2 rounded-xl" title={s.desc}>
            <div className="relative" role="img" aria-label={`${s.label} ${s.data.score} out of 100, ${s.data.label}`}>
              <ScoreRing score={s.data.score} color={s.data.color} size={60} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-semibold tabular-nums text-ink">{s.data.score}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-ink">{s.label}</p>
              <p className="text-[11px] text-muted">{s.data.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-line">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: relapseRisk.color + '1f' }}>
          <AlertTriangle size={18} style={{ color: relapseRisk.color }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-ink">Relapse risk</p>
            <span className="text-xs font-semibold capitalize text-ink-2">{relapseRisk.level}</span>
          </div>
          <div className="track h-1.5 mb-2">
            <div className="h-full rounded-full" style={{ width: `${relapseRisk.score}%`, backgroundColor: relapseRisk.color, transition: 'width 0.8s ease' }} />
          </div>
          <p className="text-xs text-muted leading-relaxed">{relapseRisk.recommendation}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card padding="none">
      <CardHeader
        icon={<Zap size={16} />}
        title="Progress scores"
        subtitle="Calculated from your logs, challenges and goals"
        action={!isPremium ? <Link href="/upgrade" className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">Unlock →</Link> : undefined}
      />
      <div className="px-5 pb-5">
        {isPremium ? content : (
          <LockOverlay feature="Focus · Discipline · Productivity Scores" description="Get scores that show exactly where you stand and what to improve.">
            {content}
          </LockOverlay>
        )}
      </div>
    </Card>
  );
}
