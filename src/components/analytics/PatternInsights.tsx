'use client';

import { useMemo } from 'react';
import { LogEntry, Habit } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { getStartOfDay, formatHour } from '@/utils/dateUtils';
import { t } from '@/i18n/translate';
import { weekdayName } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { localizedHabitName } from '@/i18n/habitNames';
import type { Locale } from '@/i18n/locales';
import { Brain } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';

interface Pattern {
  icon: string;
  title: string;
  insight: string;
  suggestion: string;
  type: 'warning' | 'positive' | 'info';
}

function computePatterns(entries: LogEntry[], habits: Habit[], locale: Locale): Pattern[] {
  if (entries.length < 5) return [];
  const nameOf = (h: Habit) => localizedHabitName(h, locale);

  const habitMap = new Map(habits.map(h => [h.id, h]));
  const patterns: Pattern[] = [];
  const now = new Date();

  // ── 1. Most triggered habit ──────────────────────────────────────────────
  const habitCounts = new Map<string, number>();
  entries.forEach(e => habitCounts.set(e.habitId, (habitCounts.get(e.habitId) ?? 0) + 1));
  const sortedHabits = [...habitCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedHabits.length > 0) {
    const [topId, topCount] = sortedHabits[0];
    const habit = habitMap.get(topId);
    const pct = Math.round((topCount / entries.length) * 100);
    if (habit && pct > 25) {
      patterns.push({
        icon: habit.icon,
        title: t('patterns.topTitle'),
        insight: t('patterns.topInsight', { name: nameOf(habit), pct, count: topCount }),
        suggestion: t('patterns.topSuggestion', { name: nameOf(habit) }),
        type: 'warning',
      });
    }
  }

  // ── 2. Peak day of week ──────────────────────────────────────────────────
  const dowCounts = new Array(7).fill(0);
  entries.forEach(e => dowCounts[new Date(e.timestamp).getDay()]++);
  const maxDow = dowCounts.indexOf(Math.max(...dowCounts));
  const avgPerDay = entries.length / 7;
  const maxDowCount = dowCounts[maxDow];
  if (maxDowCount > avgPerDay * 1.5) {
    const ratio = Math.round((maxDowCount / avgPerDay) * 10) / 10;
    patterns.push({
      icon: '📅',
      title: t('patterns.dayTitle'),
      insight: t('patterns.dayInsight', { day: weekdayName(maxDow), ratio }),
      suggestion: t('patterns.daySuggestion', { day: weekdayName(maxDow) }),
      type: 'warning',
    });
  }

  // ── 3. Peak hour of day ──────────────────────────────────────────────────
  const hourCounts = new Array(24).fill(0);
  entries.forEach(e => hourCounts[new Date(e.timestamp).getHours()]++);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHour2 = (peakHour + 1) % 24;
  if (hourCounts[peakHour] > entries.length * 0.15) {
    patterns.push({
      icon: '🕐',
      title: t('patterns.hourTitle'),
      insight: t('patterns.hourInsight', { pct: Math.round((hourCounts[peakHour] / entries.length) * 100), from: formatHour(peakHour), to: formatHour(peakHour2) }),
      suggestion: t('patterns.hourSuggestion', { from: formatHour(peakHour) }),
      type: 'warning',
    });
  }

  // ── 4. Trigger chain (habit A → habit B within 2 hours) ──────────────────
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const chains = new Map<string, Map<string, number>>();
  sorted.forEach((entry, i) => {
    const next = sorted.slice(i + 1).filter(e =>
      e.timestamp - entry.timestamp <= 7_200_000 && e.habitId !== entry.habitId
    );
    next.forEach(nextEntry => {
      if (!chains.has(entry.habitId)) chains.set(entry.habitId, new Map());
      const following = chains.get(entry.habitId)!;
      following.set(nextEntry.habitId, (following.get(nextEntry.habitId) ?? 0) + 1);
    });
  });

  let bestChainCount = 0;
  let bestChainA = '', bestChainB = '';
  chains.forEach((following, habitId) => {
    following.forEach((count, nextId) => {
      if (count > bestChainCount) {
        bestChainCount = count; bestChainA = habitId; bestChainB = nextId;
      }
    });
  });
  if (bestChainCount >= 3) {
    const hA = habitMap.get(bestChainA);
    const hB = habitMap.get(bestChainB);
    if (hA && hB) {
      patterns.push({
        icon: '🔗',
        title: t('patterns.chainTitle'),
        insight: t('patterns.chainInsight', { a: nameOf(hA), b: nameOf(hB), count: bestChainCount }),
        suggestion: t('patterns.chainSuggestion', { a: nameOf(hA), b: nameOf(hB) }),
        type: 'info',
      });
    }
  }

  // ── 5. Recent improvement or regression ──────────────────────────────────
  const weekStart = getStartOfDay(now).getTime() - 6 * 86_400_000;
  const prevWeekStart = weekStart - 7 * 86_400_000;
  const thisWeek = entries.filter(e => e.timestamp >= weekStart).length;
  const lastWeek = entries.filter(e => e.timestamp >= prevWeekStart && e.timestamp < weekStart).length;
  if (lastWeek > 0 && thisWeek > 0) {
    const pct = Math.abs(Math.round(((thisWeek - lastWeek) / lastWeek) * 100));
    if (thisWeek < lastWeek && pct >= 15) {
      patterns.push({
        icon: '📉',
        title: t('patterns.improvingTitle'),
        insight: t('patterns.improvingInsight', { pct, before: lastWeek, now: thisWeek }),
        suggestion: t('patterns.improvingSuggestion'),
        type: 'positive',
      });
    } else if (thisWeek > lastWeek && pct >= 20) {
      patterns.push({
        icon: '📈',
        title: t('patterns.regressTitle'),
        insight: t('patterns.regressInsight', { pct, before: lastWeek, now: thisWeek }),
        suggestion: t('patterns.regressSuggestion'),
        type: 'warning',
      });
    }
  }

  // ── 6. Late-night pattern ────────────────────────────────────────────────
  const lateNightEntries = entries.filter(e => {
    const h = new Date(e.timestamp).getHours();
    return h >= 22 || h < 4;
  });
  const lateNightPct = Math.round((lateNightEntries.length / entries.length) * 100);
  if (lateNightPct >= 20) {
    patterns.push({
      icon: '🌙',
      title: t('patterns.lateTitle'),
      insight: t('patterns.lateInsight', { pct: lateNightPct }),
      suggestion: t('patterns.lateSuggestion'),
      type: 'warning',
    });
  }

  return patterns.slice(0, 5);
}

interface PatternInsightsProps {
  entries: LogEntry[];
  habits: Habit[];
}

const TONE = {
  warning: { label: 'patterns.watch' as const, cls: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' },
  positive: { label: 'patterns.goodSign' as const, cls: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' },
  info: { label: 'patterns.pattern' as const, cls: 'bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300' },
};

export function PatternInsights({ entries, habits }: PatternInsightsProps) {
  const { locale, t: tr } = useI18n();
  const patterns = useMemo(() => computePatterns(entries, habits, locale), [entries, habits, locale]);
  const { maskText } = usePrivacy();

  if (patterns.length === 0) {
    return null;
  }

  return (
    <Card padding="none">
      <CardHeader icon={<Brain size={16} />} title={tr('patterns.title')} subtitle={tr('patterns.sub')} />
      <ul className="px-5 pb-5 space-y-3">
        {patterns.map((p, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3.5">
            <span className="text-lg leading-6 shrink-0" aria-hidden="true">{maskText(p.icon)}</span>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink">{p.title}</span>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${TONE[p.type].cls}`}>{tr(TONE[p.type].label)}</span>
              </p>
              <p className="text-sm text-ink-2 leading-relaxed mt-1">{maskText(p.insight)}</p>
              <p className="text-xs text-muted leading-relaxed mt-1.5"><span className="font-medium text-ink-2">{tr('patterns.try')} </span>{maskText(p.suggestion)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
