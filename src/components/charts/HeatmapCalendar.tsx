'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DailyCount } from '@/types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { monthName, weekdayName } from '@/i18n/format';
import { t } from '@/i18n/translate';
import { activities } from './chartTheme';

interface HeatmapCalendarProps {
  dailyCounts: DailyCount[];
  year?: number;
}

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio < 0.2) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.7) return 3;
  return 4;
}

// Sequential ramp: empty days in the neutral tile colour, then light teal → deep teal.
const LEVEL_CLASSES = [
  'bg-surface-2 ring-1 ring-inset ring-line/60',
  'bg-zen-100 dark:bg-zen-900',
  'bg-zen-300 dark:bg-zen-700',
  'bg-zen-500 dark:bg-zen-500',
  'bg-zen-800 dark:bg-zen-300',
];

export function HeatmapCalendar({ dailyCounts, year }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const displayYear = year ?? new Date().getFullYear();
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens open on the most recent weeks rather than January.
  useEffect(() => {
    const el = scroller.current;
    if (el && displayYear === new Date().getFullYear()) el.scrollLeft = el.scrollWidth;
  }, [displayYear]);

  const { cells, monthPositions, maxCount } = useMemo(() => {
    const countMap = new Map(dailyCounts.map(d => [d.date, d.count]));
    const max = Math.max(1, ...dailyCounts.map(d => d.count));

    const jan1 = new Date(displayYear, 0, 1);
    const startOffset = jan1.getDay();
    const start = new Date(jan1);
    start.setDate(1 - startOffset);

    const dec31 = new Date(displayYear, 11, 31);
    const endOffset = 6 - dec31.getDay();
    const end = new Date(dec31);
    end.setDate(dec31.getDate() + endOffset);

    const allCells: Array<{ date: string; count: number; inYear: boolean; col: number; row: number }> = [];
    const monthPos: Array<{ month: string; col: number }> = [];

    let col = 0;
    let lastMonth = -1;
    const cur = new Date(start);

    while (cur <= end) {
      const row = cur.getDay();
      // Each Sunday after the first starts a new week column. (The old `col > 0` test never
      // fired, so every day was drawn in the first column.)
      if (row === 0 && allCells.length > 0) col++;
      const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const inYear = cur.getFullYear() === displayYear;
      const count = countMap.get(dateStr) ?? 0;

      if (inYear && cur.getMonth() !== lastMonth && row === 0) {
        monthPos.push({ month: monthName(cur.getMonth(), 'short'), col });
        lastMonth = cur.getMonth();
      }

      allCells.push({ date: dateStr, count, inYear, col, row });
      cur.setDate(cur.getDate() + 1);
    }

    return { cells: allCells, monthPositions: monthPos, maxCount: max };
  }, [dailyCounts, displayYear]);

  const totalCols = cells.length > 0 ? Math.max(...cells.map(c => c.col)) + 1 : 53;

  return (
    <div ref={scroller} className="relative overflow-x-auto select-none pb-1" role="img" aria-label={t('charts.heatmapAria', { year: String(displayYear), total: activities(dailyCounts.filter(d => d.date.startsWith(String(displayYear))).reduce((s, d) => s + d.count, 0)), days: dailyCounts.filter(d => d.date.startsWith(String(displayYear)) && d.count > 0).length })}>
      <div className="min-w-max">
        <div className="flex mb-1 text-xs text-muted" style={{ paddingLeft: 28 }}>
          {Array.from({ length: totalCols }, (_, i) => {
            const mp = monthPositions.find(m => m.col === i);
            return (
              <div key={i} style={{ width: 14, marginRight: 2, flexShrink: 0 }}>
                {mp && <span className="text-[10px] font-medium">{mp.month}</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 text-[10px] text-muted">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 14, lineHeight: '14px' }}>
                {i % 2 === 1 ? weekdayName(i, 'short') : ''}
              </div>
            ))}
          </div>

          {Array.from({ length: totalCols }, (_, col) => (
            <div key={col} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, row) => {
                const cell = cells.find(c => c.col === col && c.row === row);
                if (!cell || !cell.inYear) {
                  return <div key={row} style={{ width: 14, height: 14 }} />;
                }
                const level = getLevel(cell.count, maxCount);
                return (
                  <div
                    key={row}
                    className={`rounded-[4px] transition-opacity hover:opacity-80 ${LEVEL_CLASSES[level]}`}
                    style={{ width: 14, height: 14 }}
                    onMouseEnter={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        text: `${formatDisplayDate(cell.date)}: ${activities(cell.count)}`,
                        // The tooltip is position: fixed, so viewport coordinates (no scroll offset).
                        x: r.left + r.width / 2,
                        y: r.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted">
          <span>{t('charts.less')}</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={`rounded-[4px] ${cls}`} style={{ width: 12, height: 12 }} />
          ))}
          <span>{t('charts.more')}</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 text-xs font-medium bg-surface text-ink border border-line rounded-lg shadow-pop pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
