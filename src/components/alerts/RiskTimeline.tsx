'use client';

import { useMemo } from 'react';
import { LogEntry } from '@/types';
import { Card } from '@/components/ui/Card';
import { getRiskLevelForDay, RISK_PALETTE, RiskLevel } from '@/lib/risk-calculator';
import { formatDate, getStartOfDay } from '@/utils/dateUtils';
import { ShieldAlert } from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Clean', moderate: 'Moderate', high: 'High', critical: 'Critical',
};

interface RiskTimelineProps {
  entries: LogEntry[];
  days?: number;
}

export function RiskTimeline({ entries, days = 14 }: RiskTimelineProps) {
  const timeline = useMemo(() => {
    const today = getStartOfDay(new Date());
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      const level = getRiskLevelForDay(entries, d);
      const count = entries.filter(e => {
        const s = getStartOfDay(d).getTime();
        return e.timestamp >= s && e.timestamp < s + 86400000;
      }).length;
      return {
        date: d,
        dateStr: formatDate(d),
        dayLabel: DAY_LABELS[d.getDay()],
        dayNum: d.getDate(),
        level,
        count,
        isToday: formatDate(d) === formatDate(new Date()),
      };
    });
  }, [entries, days]);

  const hasAnyRisk = timeline.some(d => d.level !== 'low');

  // Detect weekend pattern
  const weekendHighDays = timeline.filter(d => (d.date.getDay() === 0 || d.date.getDay() === 6) && d.level !== 'low');
  const weekdayHighDays = timeline.filter(d => d.date.getDay() > 0 && d.date.getDay() < 6 && d.level !== 'low');
  const weekendPattern = weekendHighDays.length > weekdayHighDays.length;

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <ShieldAlert size={16} className="text-orange-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Risk Timeline</h3>
        <span className="ml-auto text-xs text-slate-400">Last {days} days</span>
      </div>

      <div className="p-5">
        {/* Day grid */}
        <div className="flex gap-1.5 flex-wrap">
          {timeline.map((day, i) => {
            const palette = RISK_PALETTE[day.level];
            return (
              <div key={i} className="flex flex-col items-center gap-1 group" title={`${day.dateStr}: ${day.count} events — ${LEVEL_LABEL[day.level]} risk`}>
                {/* Color block */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 cursor-default ${
                    day.level === 'low'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                      : `${palette.bg} ${palette.border} border ${palette.text}`
                  } ${day.isToday ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-slate-800' : ''}`}
                >
                  {day.count > 0 ? day.count : '·'}
                </div>
                {/* Day label */}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">{day.dayLabel}</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-600 leading-none">{day.dayNum}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {(['low', 'moderate', 'high', 'critical'] as RiskLevel[]).map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${RISK_PALETTE[level].accent}`} />
              <span className="text-[10px] text-slate-400 capitalize">{LEVEL_LABEL[level]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-700" />
            <span className="text-[10px] text-slate-400">No activity</span>
          </div>
        </div>

        {/* Insight chip */}
        {hasAnyRisk && (
          <div className="mt-4 space-y-2">
            {weekendPattern && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl text-xs text-orange-700 dark:text-orange-300">
                <span>📅</span>
                Weekend risk spike detected — plan distractions for Sat & Sun.
              </div>
            )}
            {(() => {
              const riskDays = timeline.filter(d => d.level !== 'low');
              const maxDay = riskDays.length > 0
                ? riskDays.reduce((a, b) => b.count > a.count ? b : a, riskDays[0])
                : null;
              return maxDay ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <span>📊</span>
                  Highest single day: <strong className="ml-0.5">{maxDay.count} events</strong> on {maxDay.dateStr}
                </div>
              ) : null;
            })()}
          </div>
        )}

        {!hasAnyRisk && entries.length > 0 && (
          <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
            ✅ Clean streak — no high-risk days in the last {days} days.
          </p>
        )}

        {entries.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">Log habits to see your risk timeline.</p>
        )}
      </div>
    </Card>
  );
}
