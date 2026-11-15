'use client';

import { useState, useMemo, useEffect } from 'react';
import { Edit3, Trash2, Search, ChevronLeft, ChevronRight, StickyNote, CircleDot } from 'lucide-react';
import { clsx } from 'clsx';
import { LogEntry, Habit } from '@/types';
import { Button } from '@/components/ui/Button';
import { EntryModal } from './EntryModal';
import { formatRelativeDate } from '@/utils/dateUtils';
import { usePrivacy } from '@/context/PrivacyContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { HabitGlyph } from '@/components/dashboard/HabitGlyph';
import { brandColor, tint } from '@/utils/palette';
import { useT } from '@/i18n/I18nProvider';

interface EntryListProps {
  entries: LogEntry[];
  habits: Habit[];
  onUpdate: (id: string, updates: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 20;

export function EntryList({ entries, habits, onUpdate, onDelete }: EntryListProps) {
  const { habitName, note, masked } = usePrivacy();
  const t = useT();
  const [search, setSearch] = useState('');
  const [filterHabitId, setFilterHabitId] = useState('all');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  // First tap arms the delete button; a second tap within 4 seconds deletes.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) { onDelete(id); setConfirmDeleteId(null); }
    else setConfirmDeleteId(id);
  };

  const habitMap = useMemo(() => new Map(habits.map(h => [h.id, h])), [habits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (filterHabitId !== 'all' && e.habitId !== filterHabitId) return false;
      if (!q) return true;
      const habit = habitMap.get(e.habitId);
      if (e.date.includes(q) || e.time.includes(q)) return true;
      // While masked, search only matches what is on screen, so results cannot reveal hidden text.
      if (masked) return habitName(habit, e.habitId).toLowerCase().includes(q);
      return (e.notes ?? '').toLowerCase().includes(q) || (habit?.name ?? '').toLowerCase().includes(q) || habitName(habit, e.habitId).toLowerCase().includes(q);
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, search, filterHabitId, habitMap, masked, habitName]);

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
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input type="search" value={search} onChange={e => handleSearch(e.target.value)} placeholder={masked ? t('history.searchMasked') : t('history.search')} aria-label={t('history.searchLabel')} className="input pl-10 min-h-[48px] rounded-2xl" />
      </div>
      {/* Filter chips: one tap per habit. */}
      <div role="group" aria-label={t('history.filterByHabit')} className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => handleFilter('all')} aria-pressed={filterHabitId === 'all'} className={clsx('shrink-0 min-h-[38px]', filterHabitId === 'all' ? 'chip-on' : 'chip-off')}>{t('history.allHabits')}</button>
        {usedHabits.map((h, i) => (
          <button key={h.id} type="button" onClick={() => handleFilter(h.id)} aria-pressed={filterHabitId === h.id} className={clsx('shrink-0 min-h-[38px]', filterHabitId === h.id ? 'chip-on' : 'chip-off')}>
            {!masked && <span className="w-2 h-2 rounded-full" style={{ background: brandColor(h.color, i) }} aria-hidden="true" />}
            {habitName(h)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          tone="pink"
          icon={<Search size={24} />}
          title={search || filterHabitId !== 'all' ? t('history.noMatch') : t('history.empty')}
          description={search || filterHabitId !== 'all' ? t('history.noMatchBody') : t('history.emptyBody')}
        />
      ) : (
        <>
          <div className="space-y-5">
            {grouped.map(([date, dayEntries]) => (
              <section key={date} aria-label={formatRelativeDate(date)}>
                <div className="flex items-center justify-between gap-2 mb-2 px-1">
                  <h3 className="font-display text-sm font-semibold text-ink">{formatRelativeDate(date)}</h3>
                  <span className="pill-neutral">{t('quicklog.activities', { count: dayEntries.length })}</span>
                </div>
                <div className="card relative py-1.5">
                  <span className="absolute left-[33px] sm:left-[37px] top-5 bottom-5 w-px bg-line" aria-hidden="true" />
                  {dayEntries.map(entry => {
                    const habit = habitMap.get(entry.habitId);
                    return (
                      <div key={entry.id} className="relative flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-surface-2/60 focus-within:bg-surface-2/60 transition-colors group">
                        <span className={clsx('relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-4 ring-surface', !masked && 'tint')} style={masked ? undefined : tint(brandColor(habit?.color))} aria-hidden="true">{habit ? <HabitGlyph habit={habit} size={17} /> : <CircleDot size={17} />}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                            <span className="text-[15px] font-medium text-ink truncate">{habitName(habit, entry.habitId)}</span>
                            <span className="text-xs font-medium tabular-nums text-muted">{entry.time}</span>
                            {entry.notes && (
                              <span className="flex items-center gap-1 text-xs text-muted min-w-0 max-w-full">
                                <StickyNote size={10} className="shrink-0" aria-hidden="true" />
                                <span className="truncate">{masked ? note(entry.notes) : entry.notes.slice(0, 30) + (entry.notes.length > 30 ? '…' : '')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 shrink-0 transition-opacity ${confirmDeleteId === entry.id ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'}`}>
                          <button onClick={() => setEditing(entry)} aria-label={t('history.editEntry')} className="p-2 rounded-lg btn-ghost text-muted"><Edit3 size={15} aria-hidden="true" /></button>
                          {confirmDeleteId === entry.id ? (
                            <button onClick={() => handleDeleteClick(entry.id)} aria-label={t('history.confirmDelete')} className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-bad-soft text-bad text-xs font-semibold">
                              <Trash2 size={13} aria-hidden="true" /> {t('history.deleteQ')}
                            </button>
                          ) : (
                            <button onClick={() => handleDeleteClick(entry.id)} aria-label={t('history.deleteEntry')} className="p-2 rounded-lg hover:bg-bad-soft text-muted hover:text-bad transition-colors"><Trash2 size={15} aria-hidden="true" /></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0} icon={<ChevronLeft size={14} />} aria-label={t('history.prev')} />
              <span className="text-sm text-muted">{t('history.page', { page: page + 1, pages: totalPages, count: filtered.length })}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} icon={<ChevronRight size={14} />} aria-label={t('history.next')} />
            </div>
          )}
        </>
      )}

      <EntryModal entry={editing} habits={habits} onClose={() => setEditing(null)} onSave={onUpdate} onDelete={onDelete} />
    </div>
  );
}
