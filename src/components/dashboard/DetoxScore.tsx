'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DetoxScore as DetoxScoreType } from '@/types';

interface DetoxScoreProps {
  score: DetoxScoreType;
  currentStreak: number;
  todayCount: number;
}

const SIZE = 140;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function DetoxScoreCard({ score, currentStreak, todayCount }: DetoxScoreProps) {
  const offset = CIRC * (1 - score.score / 100);

  const TrendIcon = score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Minus;
  const trendColor = score.trend === 'up' ? 'text-emerald-500' : score.trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dopamine Detox Score</p>
          <p className="text-sm text-slate-300 mt-0.5">{score.label}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={14} />
          {score.trend === 'up' ? 'Improving' : score.trend === 'down' ? 'Slipping' : 'Stable'}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#334155" strokeWidth={STROKE} />
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={score.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color: score.color }}>{score.score}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-2xl font-bold text-white">{currentStreak}<span className="text-sm text-slate-400 font-normal ml-1">days</span></p>
            <p className="text-xs text-slate-400">Current Streak</p>
          </div>
          <div className="h-px bg-slate-700" />
          <div>
            <p className="text-2xl font-bold" style={{ color: todayCount === 0 ? '#10b981' : '#ef4444' }}>
              {todayCount}
            </p>
            <p className="text-xs text-slate-400">Events Today</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Excellent', range: '80–100', active: score.score >= 80, color: 'bg-emerald-500' },
          { label: 'Good', range: '60–79', active: score.score >= 60 && score.score < 80, color: 'bg-blue-500' },
          { label: 'Moderate', range: '40–59', active: score.score >= 40 && score.score < 60, color: 'bg-amber-500' },
          { label: 'Low', range: '0–39', active: score.score < 40, color: 'bg-red-500' },
        ].map(tier => (
          <div key={tier.label} className={`text-center p-1.5 rounded-lg border transition-all ${tier.active ? 'border-white/20 bg-white/10' : 'border-slate-700/50 opacity-40'}`}>
            <div className={`w-2 h-2 rounded-full ${tier.color} mx-auto mb-1`} />
            <p className="text-[9px] font-medium text-slate-300">{tier.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
