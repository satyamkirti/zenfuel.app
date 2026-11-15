'use client';

import { brandColor } from '@/utils/palette';
import { useMemo, useState } from 'react';
import { HabitTile } from '@/components/dashboard/HabitGlyph';
import { Download, Printer, FileText, Brain, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { LogEntry, Habit } from '@/types';
import { Card, MetricCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { HabitComparisonChart } from '@/components/charts/HabitComparisonChart';
import { computeAnalytics } from '@/utils/analytics';
import { computeStreaks } from '@/utils/streaks';
import { computeDetoxScore } from '@/utils/detoxScore';
import { exportToCSV, exportToJSON, printReport } from '@/utils/export';
import { useI18n } from '@/i18n/I18nProvider';
import { formatDateStyle, formatNumber, monthName } from '@/i18n/format';
import { scoreLabel } from '@/i18n/labels';
import { clsx } from 'clsx';
import { usePrivacy } from '@/context/PrivacyContext';

type ReportType = 'monthly' | 'quarterly' | 'annual';
type ExportKind = 'csv' | 'json' | 'print';

export function ReportView({ entries, reductionEntries, habits, isPremium = true }: { entries: LogEntry[]; reductionEntries?: LogEntry[]; habits: Habit[]; isPremium?: boolean }) {
  const { t, locale } = useI18n();
  // Score and streaks are about the habits being reduced (good habits left out).
  const scored = reductionEntries ?? entries;
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  // In Hidden Mode, exports ask first: files always contain the real data.
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);
  const { hiddenMode, hiddenTitle, habitName, habitIcon, discreet } = usePrivacy();

  const { reportEntries, label } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, lbl: string;
    if (reportType === 'monthly') {
      start = new Date(selectedYear, selectedMonth, 1);
      end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      lbl = formatDateStyle(new Date(selectedYear, selectedMonth, 1), 'monthYear');
    } else if (reportType === 'quarterly') {
      const qStart = selectedQuarter * 3;
      start = new Date(selectedYear, qStart, 1);
      end = new Date(selectedYear, qStart + 3, 0, 23, 59, 59);
      lbl = t('reports.quarterLabel', { n: selectedQuarter + 1, year: String(selectedYear) });
    } else {
      start = new Date(selectedYear, 0, 1);
      end = new Date(selectedYear, 11, 31, 23, 59, 59);
      lbl = `${selectedYear}`;
    }
    return { reportEntries: entries.filter(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime()), label: lbl };
  }, [entries, reportType, selectedYear, selectedMonth, selectedQuarter, t]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const analytics = useMemo(() => computeAnalytics(reportEntries), [reportEntries, locale]);
  const allAnalytics = useMemo(() => computeAnalytics(entries), [entries]);
  const streaks = useMemo(() => computeStreaks(scored), [scored]);
  const detoxScore = useMemo(() => computeDetoxScore(scored), [scored]);

  const habitBreakdown = useMemo(() => habits.map(h => ({
    ...h,
    count: reportEntries.filter(e => e.habitId === h.id).length,
    percentOfTotal: reportEntries.length > 0 ? Math.round((reportEntries.filter(e => e.habitId === h.id).length / reportEntries.length) * 100) : 0,
    streak: computeStreaks(entries.filter(e => e.habitId === h.id)),
  })).filter(h => h.count > 0).sort((a, b) => b.count - a.count), [habits, reportEntries, entries]);

  const habitAnalyticsForChart = useMemo(() => habits.map(h => ({
    ...computeAnalytics(reportEntries.filter(e => e.habitId === h.id)),
    // Display labels only (masked in Hidden Mode).
    habitId: h.id, habitName: habitName(h), habitIcon: habitIcon(h), habitColor: brandColor(h.color),
    percentOfTotal: reportEntries.length > 0 ? Math.round((reportEntries.filter(e => e.habitId === h.id).length / reportEntries.length) * 100) : 0,
    streak: computeStreaks(entries.filter(e => e.habitId === h.id)),
  })), [habits, reportEntries, entries, habitName, habitIcon]);

  const years = useMemo(() => {
    const set = new Set(entries.map(e => new Date(e.timestamp).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

  const heading = discreet(t('reports.heading', { label }), t('reports.headingDiscreet', { label }));

  const runExport = (kind: ExportKind, privateLabels = false) => {
    setPendingExport(null);
    if (kind === 'csv') exportToCSV(reportEntries, habits);
    else if (kind === 'json') exportToJSON(reportEntries, label);
    else printReport(reportEntries, analytics, habits, privateLabels
      ? { heading: `${hiddenTitle} — ${label}`, privateLabels: { habitName: (h, id) => habitNameForPrint(h, id), icon: '🔒', note: t('privacy.noteHidden') } }
      : { heading: t('reports.heading', { label }), habitName: (h, id) => (h ? habitName(h) : id) });
  };
  const requestExport = (kind: ExportKind) => (hiddenMode ? setPendingExport(kind) : runExport(kind));
  const habitIndex = new Map(habits.map((h, i) => [h.id, i + 1]));
  const habitNameForPrint = (h: Habit | undefined, id: string) => t('privacy.privateHabitN', { n: String(habitIndex.get(h?.id ?? id) ?? '') }).trim();

  const scoreColor = detoxScore.score >= 80 ? 'text-emerald-500' : detoxScore.score >= 60 ? 'text-brand-text' : detoxScore.score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {!isPremium && (
        <UpgradeBanner
          message={t('reports.premium')}
          cta={t('reports.unlock')}
          dismissKey="reports-premium"
          variant="prominent"
        />
      )}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-surface-2 self-start" role="group" aria-label={t('reports.type')}>
            {(['monthly', 'quarterly', 'annual'] as ReportType[]).map(type => {
              const locked = type === 'annual' && !isPremium;
              return (
              <button key={type} onClick={() => !locked && setReportType(type)} aria-pressed={reportType === type} className={clsx('min-h-[32px] px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1', reportType === type ? 'bg-surface text-ink shadow-sm' : locked ? 'text-muted cursor-not-allowed opacity-60' : 'text-muted hover:text-ink')}>
                {locked && <Lock size={10} />}{t(`reports.${type}`)}
              </button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} aria-label={t('reports.year')} className="input w-auto text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {reportType === 'monthly' && (
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} aria-label={t('reports.month')} className="input w-auto text-sm">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{monthName(i, 'short')}</option>)}
              </select>
            )}
            {reportType === 'quarterly' && (
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))} aria-label={t('reports.quarter')} className="input w-auto text-sm">
                {[1, 2, 3, 4].map((n, i) => <option key={i} value={i}>{t('reports.quarterN', { n })}</option>)}
              </select>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink flex items-center gap-2">
          <Brain size={18} className="text-brand-text" aria-hidden="true" />
          {heading}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => requestExport('csv')}>CSV</Button>
          {isPremium ? (
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => requestExport('json')}>JSON</Button>
          ) : (
            <Link href="/upgrade" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-line-strong rounded-lg text-muted opacity-70 hover:opacity-100 transition-opacity">
              <Lock size={11} /> JSON
            </Link>
          )}
          {isPremium ? (
            <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => requestExport('print')}>{t('reports.print')}</Button>
          ) : (
            <Link href="/upgrade" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-2 rounded-lg text-muted opacity-70 hover:opacity-100 transition-opacity">
              <Lock size={11} /> {t('reports.pdfPremium')}
            </Link>
          )}
        </div>
      </div>

      {pendingExport && (
        <div role="alertdialog" aria-labelledby="export-title" className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 space-y-3 text-amber-900 dark:text-amber-200">
          <p id="export-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" aria-hidden="true" /> {t('reports.hiddenOn')}</p>
          <p className="text-xs leading-relaxed">
            {t('reports.hiddenScreenOnly')}{' '}
            {pendingExport === 'print' ? t('reports.hiddenPrint') : t('reports.hiddenFile')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingExport(null)}>{t('common.cancel')}</Button>
            {pendingExport === 'print' && (
              <Button variant="secondary" size="sm" onClick={() => runExport('print', true)}>{t('reports.printPrivate')}</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => runExport(pendingExport)}>
              {pendingExport === 'print' ? t('reports.printReal') : t('reports.exportReal')}
            </Button>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard tone="blue" label={t('reports.tracked')} value={analytics.lifetimeCount} />
        <MetricCard tone="emerald" label={discreet(t('reports.detox'), t('reports.dailyScore'))} value={`${detoxScore.score}/100`} sub={scoreLabel(t, detoxScore.label)} />
        <MetricCard tone="teal" label={t('reports.dailyAvg')} value={analytics.averagePerDay > 0 ? formatNumber(Number(analytics.averagePerDay.toFixed(2))) : '—'} />
        <MetricCard tone="orange" label={t('reports.bestStreak')} value={t('streaks.daysShort', { count: streaks.longestStreak })} />
      </dl>

      {habitBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <HabitComparisonChart data={habitAnalyticsForChart} period="lifetime" />
          </Card>
          <Card>
            <h3 className="font-display text-[15px] font-semibold text-ink mb-4">{t('reports.rankings')}</h3>
            <div className="space-y-2">
              {habitBreakdown.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-4">#{i + 1}</span>
                  <HabitTile id={h.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-ink-2 truncate">{habitName(h)}</span>
                      <span className="text-xs font-bold text-ink-2">{h.count} ({h.percentOfTotal}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full grow-x" style={{ width: `${h.percentOfTotal}%`, backgroundColor: brandColor(h.color) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {analytics.monthlyCounts.length >= 2 && (
        <Card><MonthlyChart data={analytics.monthlyCounts} averagePerMonth={analytics.averagePerMonth} /></Card>
      )}

      <Card>
        <h3 className="font-display text-[15px] font-semibold text-ink mb-4 flex items-center gap-2"><FileText size={16} className="text-brand-text" />{t('reports.summary')}</h3>
        <div className="space-y-2 text-sm">
          {[
            [t('reports.periodTracked'), formatNumber(analytics.lifetimeCount)],
            [t('reports.dailyAvg'), formatNumber(Number(analytics.averagePerDay.toFixed(2)))],
            [t('reports.weeklyAvg'), formatNumber(Number(analytics.averagePerWeek.toFixed(1)))],
            [t('reports.peakDay'), analytics.highestActivityDay ? t('reports.peakDayValue', { activities: t('quicklog.activities', { count: analytics.highestActivityDay.count }), date: formatDateStyle(analytics.highestActivityDay.date, 'medium') }) : '—'],
            [t('reports.mostActiveWeekday'), analytics.mostActiveWeekday?.day ?? '—'],
            [discreet(t('reports.detoxFull'), t('reports.dailyScore')), <span key="score" className={scoreColor}>{t('reports.scoreValue', { score: detoxScore.score, label: scoreLabel(t, detoxScore.label) })}</span>],
            [t('reports.currentStreak'), t('common.days', { count: streaks.currentStreak })],
            [t('reports.longestStreak'), t('common.days', { count: streaks.longestStreak })],
            [t('reports.lifetime'), <span key="lt" className="text-brand-text font-bold">{formatNumber(allAnalytics.lifetimeCount)}</span>],
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-line last:border-0">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-ink">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
