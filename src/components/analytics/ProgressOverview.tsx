'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Sparkles, CircleCheck, PieChart, BarChart3, TrendingDown, Plus } from 'lucide-react';
import { Segmented } from '@/components/ui/Segmented';
import { ChartPreviewArt } from '@/components/ui/Illustrations';
import { Habit, LogEntry } from '@/types';
import { IconTile } from '@/components/ui/Card';
import { HabitGlyph } from '@/components/dashboard/HabitGlyph';
import { brandColor, BRAND_PALETTE } from '@/utils/palette';
import { formatDate, getStartOfDay } from '@/utils/dateUtils';
import { usePrivacy } from '@/context/PrivacyContext';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { computeAnalytics } from '@/utils/analytics';
import { comparePeriods, biggestHabitChange } from '@/utils/progress';
import { useI18n } from '@/i18n/I18nProvider';

const PERIODS = [
  { value: '7d', days: 7, label: 'periods.7d' },
  { value: '30d', days: 30, label: 'periods.30d' },
  { value: '90d', days: 90, label: 'periods.90d' },
] as const;
type Period = (typeof PERIODS)[number]['value'];


/**
 * The default Analytics view: one period switch, one chart, three numbers and one plain-English
 * observation. Every figure is a count of the user's own check-ins; comparisons are only made
 * when there are check-ins from before the period, so a new user never sees a fake "change".
 */
export function ProgressOverview({ entries, habits }: { entries: LogEntry[]; habits: Habit[] }) {
  const [period, setPeriod] = useState<Period>('7d');
  const { habitName } = usePrivacy();
  const { t, locale } = useI18n();
  const days = PERIODS.find(p => p.value === period)!.days;

  const data = useMemo(() => {
    const c = comparePeriods(entries, days);
    return { ...c, daily: computeAnalytics(c.current).dailyCounts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, days, locale]);

  const insight = useMemo(() => {
    const name = (id: string) => habitName(habits.find(h => h.id === id), id);
    const change = biggestHabitChange(data);
    if (change) {
      const vars = { name: name(change.habitId), times: t('common.times', { count: change.now }), days, before: change.before };
      return { text: change.diff < 0 ? t('insight.down', vars) : t('insight.up', vars) };
    }
    if (data.current.length >= 3) {
      const counts = new Map<string, number>();
      for (const e of data.current) counts.set(e.habitId, (counts.get(e.habitId) ?? 0) + 1);
      const [topId, topN] = [...counts.entries()].sort((x, y) => y[1] - x[1])[0];
      if (topN / data.current.length >= 0.4) return { text: t('progress.mostlyOne', { days, name: name(topId), top: topN, total: data.current.length }) };
    }
    return null;
  }, [data, days, habits, habitName, t]);

  // Clear-day rate per habit: of the days in this period since the first check-in ever, how many
  // had no check-in for that habit. Personal habits are left out so their names never show here.
  const rates = useMemo(() => {
    const first = entries.reduce((m, e) => Math.min(m, e.timestamp), Infinity);
    if (first === Infinity) return [];
    const today = getStartOfDay(new Date()).getTime();
    const start = Math.max(today - (days - 1) * 86_400_000, getStartOfDay(new Date(first)).getTime());
    const tracked = Math.round((today - start) / 86_400_000) + 1;
    const used = new Map<string, Set<string>>();
    for (const e of data.current) {
      if (!used.has(e.habitId)) used.set(e.habitId, new Set());
      used.get(e.habitId)!.add(formatDate(new Date(e.timestamp)));
    }
    return habits
      .filter(h => h.category !== 'adult' && !h.isHidden)
      .map((h, i) => ({ habit: h, color: brandColor(h.color, i), clear: tracked - (used.get(h.id)?.size ?? 0), tracked }))
      .sort((a, b) => a.clear / a.tracked - b.clear / b.tracked);
  }, [entries, data, days, habits]);

  // How this period's check-ins split between habits.
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of data.current) counts.set(e.habitId, (counts.get(e.habitId) ?? 0) + 1);
    // Each habit keeps its own colour (as on its icon); a colour already used goes to the next free one.
    const used = new Set<string>();
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n], i) => {
        const habit = habits.find(h => h.id === id);
        let color = brandColor(habit?.color, i);
        if (used.has(color)) color = BRAND_PALETTE.find(c => !used.has(c)) ?? BRAND_PALETTE[i % BRAND_PALETTE.length];
        used.add(color);
        return { id, n, habit, color };
      });
  }, [data, habits]);

  if (entries.length === 0) {
    // No check-ins yet: say what will appear and how to get there. The picture is decorative and
    // carries no values.
    const coming = [
      { icon: BarChart3, tone: 'indigo' as const, title: t('progress.comingChart'), text: t('progress.comingChartText') },
      { icon: TrendingDown, tone: 'green' as const, title: t('progress.comingChange'), text: t('progress.comingChangeText') },
      { icon: CircleCheck, tone: 'teal' as const, title: t('progress.comingClear'), text: t('progress.comingClearText') },
    ];
    return (
      <section aria-labelledby="analytics-empty-title" className="card overflow-hidden">
        <div className="relative px-5 pt-6 pb-2 flex flex-col items-center text-center">
          <ChartPreviewArt className="w-full max-w-[300px] h-auto" />
          <p className="pill-brand mt-2">{t('progress.emptyCta')}</p>
          <h2 id="analytics-empty-title" className="mt-3 font-display text-xl font-bold tracking-tight text-ink">{t('progress.emptyTitle')}</h2>
          <p className="mt-1.5 text-[15px] text-muted leading-relaxed max-w-sm">{t('progress.emptyBody')}</p>
          <div className="mt-5 flex flex-col min-[400px]:flex-row items-stretch gap-2 w-full max-w-sm">
            <Link href="/#quick-log" className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[48px] px-5 rounded-2xl btn-primary text-[15px]"><Plus size={17} aria-hidden="true" />{t('progress.trackActivity')}</Link>
            <Link href="/screen-time" className="flex-1 inline-flex items-center justify-center min-h-[48px] px-5 rounded-2xl border border-line-strong text-[15px] font-semibold text-ink hover:bg-surface-2 transition-colors">{t('nav.screenTime')}</Link>
          </div>
        </div>
        <ul className="mt-5 border-t border-line divide-y divide-line">
          {coming.map(({ icon: Icon, tone, title, text }) => (
            <li key={title} className="flex items-center gap-3.5 px-5 py-3.5">
              <IconTile tone={tone}><Icon size={17} /></IconTile>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{title}</span>
                <span className="block text-[13px] text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const total = data.current.length;
  const diff = total - data.previous.length;
  const average = total / days;

  return (
    <div className="space-y-5">
      <Segmented label={t('periods.label')} className="w-full max-w-sm" value={period} onChange={setPeriod} options={PERIODS.map(p => ({ value: p.value, label: t(p.label) }))} />

      <section key={period} aria-labelledby="trend-title" className="card p-5 fade-in">
        <h2 id="trend-title" className="font-display text-base font-semibold text-ink mb-3">{t('progress.perDayTitle')}</h2>
        <ActivityBarChart data={data.daily} days={days} title="" />
      </section>

      <dl className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-4 min-w-0">
          <dt className="text-sm text-muted">{t('progress.tracked')}</dt>
          <dd className="num mt-1.5 text-2xl sm:text-[28px] leading-none font-bold text-ink">{total}</dd>
        </div>
        <div className="card p-4 min-w-0">
          <dt className="text-sm text-muted">{t('progress.perDay')}</dt>
          <dd className="num mt-1.5 text-2xl sm:text-[28px] leading-none font-bold text-ink">{average === 0 ? '0' : average < 10 ? average.toFixed(1) : Math.round(average)}</dd>
        </div>
        <div className="card p-4 min-w-0">
          <dt className="text-sm text-muted">{t('progress.change')}</dt>
          {/* A count going up or down is stated plainly: neither direction is coloured as good or bad. */}
          <dd className="num mt-1.5 text-2xl sm:text-[28px] leading-none font-bold text-ink">
            {!data.hasHistory ? '—' : diff === 0 ? t('progress.same') : diff < 0 ? `−${Math.abs(diff)}` : `+${diff}`}
          </dd>
          <dd className="mt-1.5 text-xs text-muted leading-snug">
            {!data.hasHistory ? t('progress.noHistory') : diff === 0 ? t('progress.sameAs', { days }) : diff < 0 ? t('progress.fewer', { days }) : t('progress.more', { days })}
          </dd>
        </div>
      </dl>

      {insight && (
        <section aria-labelledby="progress-insight" className="relative overflow-hidden card p-5 flex gap-3.5">
          <span className="pointer-events-none absolute -right-14 -top-14 w-44 h-44 rounded-full glow-purple" aria-hidden="true" />
          <IconTile tone="purple" size="lg" className="relative"><Sparkles size={19} /></IconTile>
          <div className="relative min-w-0">
            <h2 id="progress-insight" className="text-xs font-semibold text-info">{t('insight.title')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{insight.text}</p>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {rates.length > 0 && (
          <section aria-labelledby="rates-title" className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <IconTile tone="emerald"><CircleCheck size={18} /></IconTile>
              <div>
                <h2 id="rates-title" className="font-display text-base font-semibold text-ink">{t('progress.clearRate')}</h2>
                <p className="text-sm text-muted">{t('progress.clearRateSub')}</p>
              </div>
            </div>
            <ul className="space-y-3.5">
              {rates.map(r => {
                const pct = Math.round((r.clear / r.tracked) * 100);
                return (
                  <li key={r.habit.id} className="flex items-center gap-3">
                    <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22`, color: r.color }}><HabitGlyph habit={r.habit} size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-ink">{habitName(r.habit)}</span>
                        <span className="shrink-0 tabular-nums text-muted"><span className="font-semibold text-ink">{pct}%</span> · {t('progress.clearDays', { clear: r.clear, tracked: r.tracked })}</span>
                      </div>
                      <div className="track h-1.5 mt-1.5" aria-hidden="true"><div className="bar-good" style={{ width: `${pct}%` }} /></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {distribution.length > 0 && (
          <section aria-labelledby="dist-title" className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <IconTile tone="purple"><PieChart size={18} /></IconTile>
              <div>
                <h2 id="dist-title" className="font-display text-base font-semibold text-ink">{t('progress.distTitle')}</h2>
                <p className="text-sm text-muted">{t('progress.distSub', { count: total, days })}</p>
              </div>
            </div>
            <div key={days} className="flex h-3 rounded-full overflow-hidden gap-[2px] grow-x" aria-hidden="true">
              {distribution.map(d => <span key={d.id} style={{ width: `${(d.n / total) * 100}%`, background: d.color }} />)}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {distribution.map(d => (
                <li key={d.id} className="flex items-center gap-2 min-w-0 text-sm">
                  <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                  <span className="truncate text-ink-2">{habitName(d.habit, d.id)}</span>
                  <span className="ml-auto shrink-0 tabular-nums font-semibold text-ink">{Math.round((d.n / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
