'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, FileText, Brain, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { LogEntry, Habit } from '@/types';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { HabitComparisonChart } from '@/components/charts/HabitComparisonChart';
import { computeAnalytics } from '@/utils/analytics';
import { computeStreaks } from '@/utils/streaks';
import { computeDetoxScore } from '@/utils/detoxScore';
import { exportToCSV, exportToJSON, printReport } from '@/utils/export';
import { SHORT_MONTHS } from '@/utils/dateUtils';
import { clsx } from 'clsx';
import { usePrivacy } from '@/context/PrivacyContext';

type ReportType = 'monthly' | 'quarterly' | 'annual';
type ExportKind = 'csv' | 'json' | 'print';

export function ReportView({ entries, habits, isPremium = true }: { entries: LogEntry[]; habits: Habit[]; isPremium?: boolean }) {
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
      lbl = `${SHORT_MONTHS[selectedMonth]} ${selectedYear}`;
    } else if (reportType === 'quarterly') {
      const qStart = selectedQuarter * 3;
      start = new Date(selectedYear, qStart, 1);
      end = new Date(selectedYear, qStart + 3, 0, 23, 59, 59);
      lbl = `Q${selectedQuarter + 1} ${selectedYear}`;
    } else {
      start = new Date(selectedYear, 0, 1);
      end = new Date(selectedYear, 11, 31, 23, 59, 59);
      lbl = `${selectedYear}`;
    }
    return { reportEntries: entries.filter(e => e.timestamp >= start.getTime() && e.timestamp <= end.getTime()), label: lbl };
  }, [entries, reportType, selectedYear, selectedMonth, selectedQuarter]);

  const analytics = useMemo(() => computeAnalytics(reportEntries), [reportEntries]);
  const allAnalytics = useMemo(() => computeAnalytics(entries), [entries]);
  const streaks = useMemo(() => computeStreaks(entries), [entries]);
  const detoxScore = useMemo(() => computeDetoxScore(entries), [entries]);

  const habitBreakdown = useMemo(() => habits.map(h => ({
    ...h,
    count: reportEntries.filter(e => e.habitId === h.id).length,
    percentOfTotal: reportEntries.length > 0 ? Math.round((reportEntries.filter(e => e.habitId === h.id).length / reportEntries.length) * 100) : 0,
    streak: computeStreaks(entries.filter(e => e.habitId === h.id)),
  })).filter(h => h.count > 0).sort((a, b) => b.count - a.count), [habits, reportEntries, entries]);

  const habitAnalyticsForChart = useMemo(() => habits.map(h => ({
    ...computeAnalytics(reportEntries.filter(e => e.habitId === h.id)),
    // Display labels only (masked in Hidden Mode).
    habitId: h.id, habitName: habitName(h), habitIcon: habitIcon(h), habitColor: h.color,
    percentOfTotal: reportEntries.length > 0 ? Math.round((reportEntries.filter(e => e.habitId === h.id).length / reportEntries.length) * 100) : 0,
    streak: computeStreaks(entries.filter(e => e.habitId === h.id)),
  })), [habits, reportEntries, entries, habitName, habitIcon]);

  const years = useMemo(() => {
    const set = new Set(entries.map(e => new Date(e.timestamp).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

  const heading = `${discreet('ZenFuel Report', 'Report')}: ${label}`;

  const runExport = (kind: ExportKind, privateLabels = false) => {
    setPendingExport(null);
    if (kind === 'csv') exportToCSV(reportEntries, habits);
    else if (kind === 'json') exportToJSON(reportEntries, label);
    else printReport(reportEntries, analytics, habits, privateLabels
      ? { heading: `${hiddenTitle} — ${label}`, privateLabels: { habitName: (h, id) => habitNameForPrint(h, id), icon: '🔒', note: 'Note hidden' } }
      : { heading: `ZenFuel Report — ${label}` });
  };
  const requestExport = (kind: ExportKind) => (hiddenMode ? setPendingExport(kind) : runExport(kind));
  const habitIndex = new Map(habits.map((h, i) => [h.id, i + 1]));
  const habitNameForPrint = (h: Habit | undefined, id: string) => `Private habit ${habitIndex.get(h?.id ?? id) ?? ''}`.trim();

  const scoreColor = detoxScore.score >= 80 ? 'text-emerald-500' : detoxScore.score >= 60 ? 'text-blue-500' : detoxScore.score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {!isPremium && (
        <UpgradeBanner
          message="Annual reports and Print / PDF reports are Premium features."
          cta="Unlock full reports"
          dismissKey="reports-premium"
          variant="prominent"
        />
      )}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1">
            {(['monthly', 'quarterly', 'annual'] as ReportType[]).map(t => {
              const locked = t === 'annual' && !isPremium;
              return (
              <button key={t} onClick={() => !locked && setReportType(t)} aria-pressed={reportType === t} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1', reportType === t ? 'bg-violet-600 text-white' : locked ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600')}>
                {locked && <Lock size={10} />}{t}
              </button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} aria-label="Year" className="input w-auto text-xs py-1.5">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {reportType === 'monthly' && (
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} aria-label="Month" className="input w-auto text-xs py-1.5">
                {SHORT_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}
            {reportType === 'quarterly' && (
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))} aria-label="Quarter" className="input w-auto text-xs py-1.5">
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => <option key={i} value={i}>{q}</option>)}
              </select>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain size={20} className="text-violet-500" />
          {heading}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => requestExport('csv')}>CSV</Button>
          {isPremium ? (
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => requestExport('json')}>JSON</Button>
          ) : (
            <Link href="/upgrade" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 opacity-70 hover:opacity-100 transition-opacity">
              <Lock size={11} /> JSON
            </Link>
          )}
          {isPremium ? (
            <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => requestExport('print')}>Print / PDF</Button>
          ) : (
            <Link href="/upgrade" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 opacity-70 hover:opacity-100 transition-opacity">
              <Lock size={11} /> PDF — Premium
            </Link>
          )}
        </div>
      </div>

      {pendingExport && (
        <div role="alertdialog" aria-labelledby="export-title" className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 space-y-3 text-amber-900 dark:text-amber-200">
          <p id="export-title" className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={15} className="shrink-0" aria-hidden="true" /> Hidden Mode is on</p>
          <p className="text-xs leading-relaxed">
            Hidden Mode only changes what is shown on screen.{' '}
            {pendingExport === 'print'
              ? 'A printed report with real data shows your habit names and notes. You can print with private labels instead.'
              : 'This file will contain your real habit names and notes.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingExport(null)}>Cancel</Button>
            {pendingExport === 'print' && (
              <Button variant="secondary" size="sm" onClick={() => runExport('print', true)}>Print with private labels</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => runExport(pendingExport)}>
              {pendingExport === 'print' ? 'Print with real data' : 'Export real data'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={analytics.lifetimeCount} accent />
        <StatCard label={discreet('Detox Score', 'Daily score')} value={`${detoxScore.score}/100`} subValue={detoxScore.label} />
        <StatCard label="Daily Average" value={analytics.averagePerDay > 0 ? analytics.averagePerDay.toFixed(2) : '—'} />
        <StatCard label="Best Streak" value={`${streaks.longestStreak}d`} />
      </div>

      {habitBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <HabitComparisonChart data={habitAnalyticsForChart} period="lifetime" />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Habit Rankings</h3>
            <div className="space-y-2">
              {habitBreakdown.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                  <span className="text-lg" aria-hidden="true">{habitIcon(h)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{habitName(h)}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{h.count} ({h.percentOfTotal}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${h.percentOfTotal}%`, backgroundColor: h.color }} />
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
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><FileText size={15} />Period Summary</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Total events this period', analytics.lifetimeCount],
            ['Daily average', analytics.averagePerDay.toFixed(2)],
            ['Weekly average', analytics.averagePerWeek.toFixed(1)],
            ['Peak day', analytics.highestActivityDay ? `${analytics.highestActivityDay.count} events (${analytics.highestActivityDay.date})` : '—'],
            ['Most active weekday', analytics.mostActiveWeekday?.day ?? '—'],
            [discreet('Dopamine Detox Score', 'Daily score'), <span key="score" className={scoreColor}>{detoxScore.score}/100 — {detoxScore.label}</span>],
            ['Current streak', `${streaks.currentStreak} days`],
            ['Longest streak ever', `${streaks.longestStreak} days`],
            ['Lifetime total (all time)', <span key="lt" className="text-violet-600 dark:text-violet-400 font-bold">{allAnalytics.lifetimeCount}</span>],
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
