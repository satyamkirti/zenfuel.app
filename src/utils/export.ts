import { LogEntry, AppAnalytics, Habit } from '@/types';
import { createBackup, REPORT_EXPORT_FORMAT } from './backup';
import { formatDate } from './dateUtils';
import { t, getActiveLocale } from '@/i18n/translate';
import { formatDateTime, formatNumber } from '@/i18n/format';

// Notes, habit names and icons can come from imported files, so everything placed in
// the print document is escaped.
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Spreadsheet apps run a cell as a formula when it starts with = + - @ (also after leading
// spaces or control characters, and the full-width forms), or starts with a tab or carriage
// return. Such cells get a leading apostrophe so they open as plain text. Plain numbers such
// as "-5" are left unchanged.
const FORMULA_START = /^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/;
const CONTROL_START = /^[\t\r]/;
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export function csvCell(value: unknown): string {
  let s = String(value ?? '');
  if ((FORMULA_START.test(s) || CONTROL_START.test(s)) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Excel needs a byte-order mark to read UTF-8 (Hindi, emoji, ₹) correctly. It sits before the
// first cell, so it does not affect the formula protection above.
export const CSV_BOM = '\uFEFF';

export function exportToCSV(entries: LogEntry[], habits: Habit[]): void {
  const habitMap = new Map(habits.map(h => [h.id, h.name]));
  const headers = ['Date', 'Time', 'Habit', 'Notes', 'ID'];
  const rows = entries.map(e => [
    e.date,
    e.time,
    habitMap.get(e.habitId) ?? e.habitId,
    e.notes ?? '',
    e.id,
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  downloadBlob(CSV_BOM + csv, `zenfuel-entries-${formatDate(new Date())}.csv`, 'text/csv;charset=utf-8');
}

// Entries for one report period. Tagged so it can never be mistaken for a full backup.
export function exportToJSON(entries: LogEntry[], periodLabel?: string): void {
  const payload = { format: REPORT_EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), period: periodLabel ?? null, entries };
  downloadBlob(JSON.stringify(payload, null, 2), `zenfuel-report-${formatDate(new Date())}.json`, 'application/json');
}

export function exportFullBackup(): void {
  downloadBlob(JSON.stringify(createBackup(), null, 2), `zenfuel-backup-${formatDate(new Date())}.json`, 'application/json');
}

export interface PrintOptions {
  /** Report heading, e.g. "ZenFuel Report — Mar 2026" (neutral in Hidden Mode). */
  heading: string;
  /** Hidden Mode: print placeholders instead of habit names, icons and notes. */
  privateLabels?: { habitName: (h: Habit | undefined, id: string) => string; icon: string; note: string };
  /** Habit names as shown in the app (built-in names in the interface language). */
  habitName?: (h: Habit | undefined, id: string) => string;
}

export function printReport(entries: LogEntry[], analytics: AppAnalytics, habits: Habit[], options: PrintOptions): void {
  const win = window.open('', '_blank');
  if (!win) return;

  const habitMap = new Map(habits.map(h => [h.id, h]));
  const priv = options.privateLabels;
  const label = (h: Habit | undefined, id: string) => priv
    ? `${escapeHtml(priv.icon)} ${escapeHtml(priv.habitName(h, id))}`
    : h ? `${escapeHtml(h.icon)} ${escapeHtml(options.habitName ? options.habitName(h, id) : h.name)}` : escapeHtml(id);

  // Count per habit
  const habitCounts = habits.map(h => ({
    ...h,
    count: entries.filter(e => e.habitId === h.id).length,
  })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

  const habitRows = habitCounts.map(h =>
    `<tr><td>${label(h, h.id)}</td><td>${h.count}</td><td>${analytics.lifetimeCount > 0 ? Math.round((h.count / analytics.lifetimeCount) * 100) : 0}%</td></tr>`
  ).join('');

  const entryRows = entries.slice(0, 200).map(e => {
    const notes = priv && e.notes ? priv.note : e.notes;
    return `<tr><td>${escapeHtml(e.date)}</td><td>${escapeHtml(e.time)}</td><td>${label(habitMap.get(e.habitId), e.habitId)}</td><td>${escapeHtml(notes)}</td></tr>`;
  }).join('');

  win.document.write(`<!DOCTYPE html>
<html lang="${getActiveLocale()}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <title>${escapeHtml(options.heading)}</title>
  <style>
    body { font-family: -apple-system, 'Segoe UI', 'Noto Sans Devanagari', 'Nirmala UI', sans-serif; max-width: 900px; margin: 40px auto; color: #10254a; }
    h1 { color: #1265d8; border-bottom: 3px solid #1265d8; padding-bottom: 8px; }
    h2 { color: #1265d8; margin-top: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .stat { background: #f3f8ff; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #1265d8; }
    .stat-label { font-size: 0.8rem; color: #60728c; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #e3efff; padding: 10px; text-align: left; color: #1265d8; }
    td { border-bottom: 1px solid #d7e6f8; padding: 8px 10px; }
    .footer { margin-top: 40px; color: #8a9db8; font-size: 0.8rem; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: #e3efff; color: #1265d8; }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.heading)}</h1>
  <p>${escapeHtml(t('print.generated', { date: formatDateTime(Date.now()) }))} &nbsp;|&nbsp; <span class="badge">${escapeHtml(t('print.onDevice'))}</span></p>
  <h2>${escapeHtml(t('print.summary'))}</h2>
  <div class="stats">
    <div class="stat"><div class="stat-value">${formatNumber(analytics.lifetimeCount)}</div><div class="stat-label">${escapeHtml(t('print.inPeriod'))}</div></div>
    <div class="stat"><div class="stat-value">${formatNumber(Number(analytics.averagePerDay.toFixed(2)))}</div><div class="stat-label">${escapeHtml(t('reports.dailyAvg'))}</div></div>
    <div class="stat"><div class="stat-value">${formatNumber(Number(analytics.averagePerWeek.toFixed(1)))}</div><div class="stat-label">${escapeHtml(t('reports.weeklyAvg'))}</div></div>
    <div class="stat"><div class="stat-value">${formatNumber(analytics.highestActivityDay?.count ?? 0)}</div><div class="stat-label">${escapeHtml(t('reports.peakDay'))}</div></div>
  </div>
  <h2>${escapeHtml(t('breakdown.title'))}</h2>
  <table>
    <thead><tr><th>${escapeHtml(t('entry.habit'))}</th><th>${escapeHtml(t('print.count'))}</th><th>${escapeHtml(t('print.share'))}</th></tr></thead>
    <tbody>${habitRows}</tbody>
  </table>
  <h2>${escapeHtml(t('print.log'))}</h2>
  <table>
    <thead><tr><th>${escapeHtml(t('entry.date'))}</th><th>${escapeHtml(t('entry.time'))}</th><th>${escapeHtml(t('entry.habit'))}</th><th>${escapeHtml(t('entry.notes'))}</th></tr></thead>
    <tbody>${entryRows}</tbody>
  </table>
  <div class="footer">${escapeHtml(priv ? t('print.footerPrivate') : t('print.footer'))}</div>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
