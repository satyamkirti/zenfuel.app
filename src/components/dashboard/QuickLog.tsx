'use client';

import { useState } from 'react';
import { Plus, Clock, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { formatDate, formatTime } from '@/utils/dateUtils';

export function QuickLog() {
  const { logEntry, habits } = useApp();
  const { habitName, habitIcon } = usePrivacy();
  const [selectedHabitId, setSelectedHabitId] = useState(habits[0]?.id ?? 'social-media');
  const selectedName = (h: { id: string; name: string; icon: string } | undefined) => (h ? habitName(h) : 'Event');
  const [showOptions, setShowOptions] = useState(false);
  const [notes, setNotes] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState(formatDate(new Date()));
  const [customTime, setCustomTime] = useState(formatTime(new Date()));
  const [success, setSuccess] = useState(false);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) ?? habits[0];

  const handleLog = () => {
    if (!selectedHabit) return;
    if (useCustomTime) {
      const dt = new Date(`${customDate}T${customTime}:00`);
      logEntry(selectedHabit.id, notes || undefined, { date: customDate, time: customTime, timestamp: dt.getTime() });
    } else {
      logEntry(selectedHabit.id, notes || undefined);
    }
    setNotes('');
    setUseCustomTime(false);
    setShowOptions(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <section aria-labelledby="quicklog-title" data-fab-hide className="h-full bg-surface border border-line rounded-2xl shadow-card p-5 flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="quicklog-title" className="eyebrow">Quick log</h2>
        <p className="text-xs text-muted">Choose a habit, then log it</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4" role="group" aria-label="Habit">
        {habits.slice(0, 6).map(h => {
          const selected = selectedHabit?.id === h.id;
          return (
            <button
              key={h.id}
              onClick={() => setSelectedHabitId(h.id)}
              aria-pressed={selected}
              className={clsx(
                'flex items-center gap-2 min-h-[44px] px-3 rounded-xl text-sm font-medium text-left transition-colors border',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30',
                selected
                  ? 'bg-violet-600/10 border-violet-500/60 text-brand-text'
                  : 'bg-surface-2 border-transparent text-ink-2 hover:text-ink hover:border-line-strong'
              )}
            >
              <span className="text-base leading-none" aria-hidden="true">{habitIcon(h)}</span>
              <span className="truncate">{habitName(h)}</span>
            </button>
          );
        })}
      </div>

      {habits.length > 6 && (
        <select
          value={habits.slice(6).some(h => h.id === selectedHabit?.id) ? selectedHabit?.id : ''}
          onChange={e => { if (e.target.value) setSelectedHabitId(e.target.value); }}
          aria-label="More habits"
          className="input mt-2 text-ink-2"
        >
          <option value="">{habits.length - 6} more habit{habits.length - 6 === 1 ? '' : 's'}…</option>
          {habits.slice(6).map(h => <option key={h.id} value={h.id}>{habitIcon(h)} {habitName(h)}</option>)}
        </select>
      )}

      <div className="mt-auto pt-4 space-y-3">
        <button
          onClick={handleLog}
          disabled={!selectedHabit}
          className={clsx(
            'w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl text-sm font-semibold text-white transition-colors',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:opacity-50',
            success ? 'bg-emerald-600' : 'bg-brand hover:bg-brand-strong'
          )}
        >
          {success
            ? <><Check size={18} strokeWidth={3} aria-hidden="true" /> {selectedName(selectedHabit)} logged</>
            : <><Plus size={18} strokeWidth={2.5} aria-hidden="true" /> Log {selectedName(selectedHabit)}</>}
        </button>
        <p className="sr-only" aria-live="polite">{success ? `${selectedName(selectedHabit)} logged` : ''}</p>

        <button
          onClick={() => setShowOptions(v => !v)}
          aria-expanded={showOptions}
          className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors py-1"
        >
          <ChevronDown size={14} className={clsx('transition-transform', showOptions && 'rotate-180')} aria-hidden="true" />
          {showOptions ? 'Hide note and time' : 'Add a note or change the time'}
        </button>

        {showOptions && (
          <div className="space-y-2.5 animate-fade-in">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional note"
              aria-label="Note"
              rows={2}
              className="input resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer min-h-[32px]">
              <input type="checkbox" checked={useCustomTime} onChange={e => setUseCustomTime(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              <Clock size={14} aria-hidden="true" /> Log for a different date or time
            </label>
            {useCustomTime && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" aria-label="Date" value={customDate} onChange={e => setCustomDate(e.target.value)} max={formatDate(new Date())} className="input" />
                <input type="time" aria-label="Time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="input" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
