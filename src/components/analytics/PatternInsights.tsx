'use client';

import { useMemo } from 'react';
import { LogEntry, Habit } from '@/types';
import { Card } from '@/components/ui/Card';
import { WEEKDAYS, getStartOfDay, formatHour } from '@/utils/dateUtils';
import { Brain } from 'lucide-react';

interface Pattern {
  icon: string;
  title: string;
  insight: string;
  suggestion: string;
  type: 'warning' | 'positive' | 'info';
}

function computePatterns(entries: LogEntry[], habits: Habit[]): Pattern[] {
  if (entries.length < 5) return [];

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
        title: 'Top trigger',
        insight: `${habit.name} accounts for ${pct}% of all your logged events (${topCount} total).`,
        suggestion: `Set a specific goal to reduce ${habit.name} by 30% this week.`,
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
      title: 'High-risk day',
      insight: `${WEEKDAYS[maxDow]} is your highest-risk day — ${ratio}× more triggers than average.`,
      suggestion: `Schedule a distraction activity for ${WEEKDAYS[maxDow]}s. A walk, call, or gym session.`,
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
      title: 'Peak trigger time',
      insight: `You log ${Math.round((hourCounts[peakHour] / entries.length) * 100)}% of all triggers around ${formatHour(peakHour)}–${formatHour(peakHour2)}.`,
      suggestion: `Plan something engaging for ${formatHour(peakHour)}. This window is your highest vulnerability.`,
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
        title: 'Trigger chain',
        insight: `After ${hA.name}, you almost always log ${hB.name} within 2 hours (happened ${bestChainCount} times).`,
        suggestion: `When you log ${hA.name}, immediately do a 5-minute physical reset before the ${hB.name} urge kicks in.`,
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
        title: 'Improving trend',
        insight: `You reduced trigger events by ${pct}% this week vs last week (${lastWeek} → ${thisWeek}).`,
        suggestion: 'Keep this momentum. Consistency over the next 7 days compounds the progress.',
        type: 'positive',
      });
    } else if (thisWeek > lastWeek && pct >= 20) {
      patterns.push({
        icon: '📈',
        title: 'Regression detected',
        insight: `Your trigger count is up ${pct}% this week vs last (${lastWeek} → ${thisWeek}).`,
        suggestion: 'Identify what changed this week — stress, routine, or sleep? Address that root cause.',
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
      title: 'Late-night pattern',
      insight: `${lateNightPct}% of your triggers happen between 10pm and 4am.`,
      suggestion: 'Put your phone in another room at 9:30pm. Late-night triggers dig the deepest grooves.',
      type: 'warning',
    });
  }

  return patterns.slice(0, 5);
}

interface PatternInsightsProps {
  entries: LogEntry[];
  habits: Habit[];
}

const TYPE_STYLES = {
  warning: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-300',
  positive: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300',
};

const SUGGESTION_STYLES = {
  warning: 'text-orange-600 dark:text-orange-400',
  positive: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function PatternInsights({ entries, habits }: PatternInsightsProps) {
  const patterns = useMemo(() => computePatterns(entries, habits), [entries, habits]);

  if (patterns.length === 0) {
    return null;
  }

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Brain size={16} className="text-violet-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Trigger Patterns</h3>
        <span className="ml-auto text-xs text-slate-400">Auto-detected from your logs</span>
      </div>
      <div className="p-4 space-y-3">
        {patterns.map((p, i) => (
          <div key={i} className={`p-4 rounded-xl border ${TYPE_STYLES[p.type]}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5 shrink-0">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">{p.title}</p>
                <p className="text-sm font-medium leading-snug mb-2">{p.insight}</p>
                <p className={`text-xs leading-snug ${SUGGESTION_STYLES[p.type]}`}>
                  💡 {p.suggestion}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
