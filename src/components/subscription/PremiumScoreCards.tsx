'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { LogEntry } from '@/types';
import { Challenge, Goal } from '@/types';
import { Card } from '@/components/ui/Card';
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
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
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
    { label: 'Focus Score', icon: <Brain size={14} />, data: focusScore, desc: 'Resistance to work-hour & trigger-time sessions' },
    { label: 'Discipline Score', icon: <Target size={14} />, data: disciplineScore, desc: 'Streaks, completed challenges & goals' },
    { label: 'Productivity Score', icon: <Zap size={14} />, data: productivityScore, desc: 'Composite of all three scores' },
  ];

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {scores.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
            <div className="relative">
              <ScoreRing score={s.data.score} color={s.data.color} size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black" style={{ color: s.data.color }}>{s.data.score}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.label}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: s.data.color }}>{s.data.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${relapseRisk.level === 'high' ? 'border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10' : relapseRisk.level === 'medium' ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10' : 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10'}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: relapseRisk.color + '20' }}>
          <AlertTriangle size={20} style={{ color: relapseRisk.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Relapse Risk</p>
            <span className="text-sm font-black" style={{ color: relapseRisk.color }}>{relapseRisk.level.toUpperCase()}</span>
          </div>
          <div className="h-2 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: `${relapseRisk.score}%`, backgroundColor: relapseRisk.color, transition: 'width 1s ease' }} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{relapseRisk.recommendation}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Zap size={16} className="text-amber-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Premium Scores</h3>
        {!isPremium && (
          <Link href="/upgrade" className="ml-auto text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline">
            Unlock →
          </Link>
        )}
      </div>
      <div className="p-4">
        {isPremium ? content : (
          <LockOverlay feature="Focus · Discipline · Productivity Scores" description="Get AI-powered scores that show exactly where you stand and what to improve.">
            {content}
          </LockOverlay>
        )}
      </div>
    </Card>
  );
}
