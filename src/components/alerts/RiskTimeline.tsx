'use client';

import { useMemo } from 'react';
import { LogEntry } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { getRiskLevelForDay, RISK_PALETTE, RiskLevel } from '@/lib/risk-calculator';
import { formatDate, getStartOfDay } from '@/utils/dateUtils';
import { ShieldAlert, CalendarDays, BarChart3, CircleCheck } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { weekdayName } from '@/i18n/format';
import { formatDisplayDate } from '@/utils/dateUtils';
import { activities } from '@/components/charts/chartTheme';

const LEVEL_LABEL = {
  low: 'timeline.level.low', moderate: 'timeline.level.moderate', high: 'timeline.level.high', critical: 'timeline.level.critical',
} as const satisfies Record<RiskLevel, string>;

interface RiskTimelineProps {
  entries: LogEntry[];
  days?: number;
}

export function RiskTimeline({ entries, days = 14 }: RiskTimelineProps) {
  const { t, locale } = useI18n();
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
        dayLabel: weekdayName(d.getDay(), 'short'),
        dayNum: d.getDate(),
        level,
        count,
        isToday: formatDate(d) === formatDate(new Date()),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, days, locale]);

  const hasAnyRisk = timeline.some(d => d.level !== 'low');

  // Detect weekend pattern
  const weekendHighDays = timeline.filter(d => (d.date.getDay() === 0 || d.date.getDay() === 6) && d.level !== 'low');
  const weekdayHighDays = timeline.filter(d => d.date.getDay() > 0 && d.date.getDay() < 6 && d.level !== 'low');
  const weekendPattern = weekendHighDays.length > weekdayHighDays.length;

  return (
    <Card padding="none">
      <CardHeader icon={<ShieldAlert size={16} />} title={t('timeline.title')} subtitle={t('timeline.sub', { days })} />

      <div className="px-5 pb-5">
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {timeline.map((day, i) => {
            const palette = RISK_PALETTE[day.level];
            return (
              <div key={i} className="flex flex-col items-center gap-1 group" title={t('timeline.cellTitle', { date: formatDisplayDate(day.dateStr), count: activities(day.count), level: t(LEVEL_LABEL[day.level]) })}>
                {/* Color block */}
                <div
                  className={`w-full max-w-[44px] aspect-square rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums cursor-default ${
                    day.level === 'low'
                      ? 'bg-surface-2 text-muted'
                      : `${palette.bg} ${palette.border} border ${palette.text}`
                  } ${day.isToday ? 'ring-2 ring-zen-500 ring-offset-2 ring-offset-surface' : ''}`}
                >
                  {day.count > 0 ? day.count : '·'}
                </div>
                {/* Day label */}
                <span className="text-[9px] text-muted leading-none">{day.dayLabel}</span>
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
              <span className="text-[10px] text-muted">{t(LEVEL_LABEL[level])}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-surface-2" />
            <span className="text-[10px] text-muted">{t('timeline.noActivity')}</span>
          </div>
        </div>

        {/* Insight chip */}
        {hasAnyRisk && (
          <div className="mt-4 space-y-2">
            {weekendPattern && (
              <div className="flex items-center gap-2 px-3 py-2 bg-warn-soft rounded-xl text-xs text-warn">
                <CalendarDays size={14} className="shrink-0" aria-hidden="true" />
                {t('timeline.weekend')}
              </div>
            )}
            {(() => {
              const riskDays = timeline.filter(d => d.level !== 'low');
              const maxDay = riskDays.length > 0
                ? riskDays.reduce((a, b) => b.count > a.count ? b : a, riskDays[0])
                : null;
              return maxDay ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-xl text-xs text-ink-2">
                  <BarChart3 size={14} className="shrink-0 text-muted" aria-hidden="true" />
                  {t('timeline.highest')} <strong className="ml-0.5">{t('timeline.highestValue', { count: activities(maxDay.count), date: formatDisplayDate(maxDay.dateStr) })}</strong>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {!hasAnyRisk && entries.length > 0 && (
          <p className="mt-4 text-sm text-good font-medium flex items-center gap-2">
            <CircleCheck size={15} aria-hidden="true" /> {t('timeline.clean', { days })}
          </p>
        )}

        {entries.length === 0 && (
          <p className="mt-4 text-sm text-muted">{t('timeline.empty')}</p>
        )}
      </div>
    </Card>
  );
}
