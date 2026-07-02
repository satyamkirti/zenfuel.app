import { LogEntry, AppAnalytics, Habit } from '@/types';

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

export function exportToCSV(entries: LogEntry[], habits: Habit[]): void {
  const habitMap = new Map(habits.map(h => [h.id, h.name]));
  const headers = ['Date', 'Time', 'Habit', 'Notes', 'ID'];
  const rows = entries.map(e => [
    e.date,
    e.time,
    habitMap.get(e.habitId) ?? e.habitId,
    (e.notes ?? '').replace(/"/g, '""'),
    e.id,
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  downloadBlob(csv, `dopamine-detox-export-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

export function exportToJSON(entries: LogEntry[]): void {
  downloadBlob(JSON.stringify(entries, null, 2), `dopamine-detox-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}

export function printReport(entries: LogEntry[], analytics: AppAnalytics, habits: Habit[]): void {
  const win = window.open('', '_blank');
  if (!win) return;

  const habitMap = new Map(habits.map(h => [h.id, h]));

  // Count per habit
  const habitCounts = habits.map(h => ({
    ...h,
    count: entries.filter(e => e.habitId === h.id).length,
  })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

  const habitRows = habitCounts.map(h =>
    `<tr><td>${h.icon} ${h.name}</td><td>${h.count}</td><td>${analytics.lifetimeCount > 0 ? Math.round((h.count / analytics.lifetimeCount) * 100) : 0}%</td></tr>`
  ).join('');

  const entryRows = entries.slice(0, 200).map(e => {
    const h = habitMap.get(e.habitId);
    return `<tr><td>${e.date}</td><td>${e.time}</td><td>${h ? `${h.icon} ${h.name}` : e.habitId}</td><td>${e.notes ?? ''}</td></tr>`;
  }).join('');

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Dopamine Detox Report — ${new Date().toLocaleDateString()}</title>
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
  <h1>🧠 Dopamine Detox Report</h1>
  <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; <span class="badge">Private &amp; Local</span></p>
  <h2>Summary Statistics</h2>
  <div class="stats">
    <div class="stat"><div class="stat-value">${analytics.lifetimeCount}</div><div class="stat-label">Total Events</div></div>
    <div class="stat"><div class="stat-value">${analytics.monthCount}</div><div class="stat-label">This Month</div></div>
    <div class="stat"><div class="stat-value">${analytics.weekCount}</div><div class="stat-label">This Week</div></div>
    <div class="stat"><div class="stat-value">${analytics.averagePerDay.toFixed(2)}</div><div class="stat-label">Daily Average</div></div>
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
  <div class="footer">Dopamine Detox Tracker — Private &amp; Local — Data never leaves your device</div>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
