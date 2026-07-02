'use client';

import { useState, useMemo } from 'react';
import { Edit3, Trash2, Search, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react';
import { LogEntry, Habit } from '@/types';
import { Button } from '@/components/ui/Button';
import { EntryModal } from './EntryModal';
import { formatRelativeDate } from '@/utils/dateUtils';

interface EntryListProps {
  entries: LogEntry[];
  habits: Habit[];
  onUpdate: (id: string, updates: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 20;

export function EntryList({ entries, habits, onUpdate, onDelete }: EntryListProps) {
  const [search, setSearch] = useState('');
  const [filterHabitId, setFilterHabitId] = useState('all');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<LogEntry | null>(null);

  const habitMap = useMemo(() => new Map(habits.map(h => [h.id, h])), [habits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (filterHabitId !== 'all' && e.habitId !== filterHabitId) return false;
      if (!q) return true;
      const habit = habitMap.get(e.habitId);
      return e.date.includes(q) || e.time.includes(q) || (e.notes ?? '').toLowerCase().includes(q) || (habit?.name ?? '').toLowerCase().includes(q);
    });
  }, [entries, search, filterHabitId, habitMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    pageEntries.forEach(e => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [pageEntries]);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (v: string) => { setFilterHabitId(v); setPage(0); };

  const usedHabits = useMemo(() => {
    const ids = new Set(entries.map(e => e.habitId));
    return habits.filter(h => ids.has(h.id));
  }, [entries, habits]);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search entries..." className="input pl-9" />
        </div>
        <select value={filterHabitId} onChange={e => handleFilter(e.target.value)} className="input w-auto text-sm">
          <option value="all">All Habits</option>
          {usedHabits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">{search || filterHabitId !== 'all' ? 'No matching entries' : 'No sessions logged yet'}</p>
          <p className="text-sm mt-1">Head to the dashboard to log your first event</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {grouped.map(([date, dayEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatRelativeDate(date)}</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400">{dayEntries.length} event{dayEntries.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  {dayEntries.map(entry => {
                    const habit = habitMap.get(entry.habitId);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-300 dark:hover:border-violet-600 transition-colors group">
                        <span className="text-lg leading-none shrink-0">{habit?.icon ?? '•'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white" style={{ color: habit?.color }}>{habit?.name ?? entry.habitId}</span>
                            <span className="text-xs text-slate-400">{entry.time}</span>
                            {entry.notes && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <StickyNote size={10} />
                                {entry.notes.slice(0, 30)}{entry.notes.length > 30 ? '…' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditing(entry)} className="p-1.5 rounded-lg btn-ghost text-slate-500"><Edit3 size={14} /></button>
                          <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0} icon={<ChevronLeft size={14} />} />
              <span className="text-sm text-slate-500">Page {page + 1} of {totalPages} · {filtered.length} entries</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} icon={<ChevronRight size={14} />} />
            </div>
          )}
        </>
      )}

      <EntryModal entry={editing} habits={habits} onClose={() => setEditing(null)} onSave={onUpdate} onDelete={onDelete} />
    </div>
  );
}
