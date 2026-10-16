import { LogEntry, AppAnalytics, Habit } from '@/types';
import { createBackup, REPORT_EXPORT_FORMAT } from './backup';
import { formatDate } from './dateUtils';

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
}

export function printReport(entries: LogEntry[], analytics: AppAnalytics, habits: Habit[], options: PrintOptions): void {
  const win = window.open('', '_blank');
  if (!win) return;

  const habitMap = new Map(habits.map(h => [h.id, h]));
  const priv = options.privateLabels;
  const label = (h: Habit | undefined, id: string) => priv
    ? `${escapeHtml(priv.icon)} ${escapeHtml(priv.habitName(h, id))}`
    : h ? `${escapeHtml(h.icon)} ${escapeHtml(h.name)}` : escapeHtml(id);

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
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <title>${escapeHtml(options.heading)}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; color: #1a1a2e; }
    h1 { color: #6d28d9; border-bottom: 3px solid #6d28d9; padding-bottom: 8px; }
    h2 { color: #4c1d95; margin-top: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .stat { background: #f5f3ff; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #6d28d9; }
    .stat-label { font-size: 0.8rem; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #ede9fe; padding: 10px; text-align: left; color: #4c1d95; }
    td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; }
    .footer { margin-top: 40px; color: #9ca3af; font-size: 0.8rem; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: #ede9fe; color: #6d28d9; }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.heading)}</h1>
  <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; <span class="badge">Generated on this device</span></p>
  <h2>Summary Statistics</h2>
  <div class="stats">
    <div class="stat"><div class="stat-value">${analytics.lifetimeCount}</div><div class="stat-label">Events in period</div></div>
    <div class="stat"><div class="stat-value">${analytics.averagePerDay.toFixed(2)}</div><div class="stat-label">Daily Average</div></div>
    <div class="stat"><div class="stat-value">${analytics.averagePerWeek.toFixed(1)}</div><div class="stat-label">Weekly Average</div></div>
    <div class="stat"><div class="stat-value">${analytics.highestActivityDay?.count ?? 0}</div><div class="stat-label">Peak Day</div></div>
  </div>
  <h2>Habit Breakdown</h2>
  <table>
    <thead><tr><th>Habit</th><th>Count</th><th>% of Total</th></tr></thead>
    <tbody>${habitRows}</tbody>
  </table>
  <h2>Session Log (Last 200)</h2>
  <table>
    <thead><tr><th>Date</th><th>Time</th><th>Habit</th><th>Notes</th></tr></thead>
    <tbody>${entryRows}</tbody>
  </table>
  <div class="footer">${priv ? 'Generated in your browser from locally stored data' : 'ZenFuel — generated in your browser from locally stored data'}</div>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
