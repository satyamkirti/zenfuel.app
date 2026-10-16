'use client';

import { useState } from 'react';
import { Plus, Clock, ChevronDown, Check, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Button } from '@/components/ui/Button';
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
    if (!selectedHabitId) return;
    if (useCustomTime) {
      const dt = new Date(`${customDate}T${customTime}:00`);
      logEntry(selectedHabitId, notes || undefined, { date: customDate, time: customTime, timestamp: dt.getTime() });
    } else {
      logEntry(selectedHabitId, notes || undefined);
    }
    setNotes('');
    setUseCustomTime(false);
    setShowOptions(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-violet-500/20 h-full flex flex-col">
      <p className="text-violet-200 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Zap size={12} /> Quick Log
      </p>

      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {habits.slice(0, 6).map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHabitId(h.id)}
            aria-pressed={selectedHabitId === h.id}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedHabitId === h.id
                ? 'bg-white text-violet-700 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span aria-hidden="true">{habitIcon(h)}</span>
            <span className="truncate text-xs">{habitName(h)}</span>
          </button>
        ))}
      </div>

      {habits.length > 6 && (
        <select
          value={selectedHabitId}
          onChange={e => setSelectedHabitId(e.target.value)}
          aria-label="Habit"
          className="mb-4 w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          {habits.map(h => <option key={h.id} value={h.id} className="text-slate-900">{habitIcon(h)} {habitName(h)}</option>)}
        </select>
      )}

      <button onClick={handleLog} aria-label={`Log ${selectedName(selectedHabit)}`} className="relative group mx-auto mb-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-150 transition-transform duration-300" />
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
          success ? 'bg-emerald-500 scale-110' : 'bg-white hover:bg-white/95 active:scale-95'
        }`}>
          {success
            ? <Check size={36} className="text-white" strokeWidth={3} />
            : <span className="text-3xl" aria-hidden="true">{selectedHabit ? habitIcon(selectedHabit) : '+'}</span>
          }
        </div>
      </button>

      <p className="text-center text-white text-sm font-semibold mb-1" aria-live="polite">
        {success ? `${selectedName(selectedHabit)} logged!` : `Log ${selectedName(selectedHabit)}`}
      </p>

      <button
        onClick={() => setShowOptions(v => !v)}
        aria-expanded={showOptions}
        className="flex items-center justify-center gap-1.5 text-violet-100 hover:text-white text-xs transition-colors mt-auto py-1"
      >
        <ChevronDown size={12} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        {showOptions ? 'Hide options' : 'Notes / custom time'}
      </button>

      {showOptions && (
        <div className="w-full space-y-2 mt-3 animate-fade-in">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional note..."
            aria-label="Note"
            rows={2}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-violet-300 text-xs focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
          />
          <label className="flex items-center gap-2 text-violet-200 text-xs cursor-pointer">
            <input type="checkbox" checked={useCustomTime} onChange={e => setUseCustomTime(e.target.checked)} className="accent-white" />
            <Clock size={11} /> Custom date & time
          </label>
          {useCustomTime && (
            <div className="flex gap-2">
              <input type="date" aria-label="Date" value={customDate} onChange={e => setCustomDate(e.target.value)} max={formatDate(new Date())} className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/40" />
              <input type="time" aria-label="Time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/40" />
            </div>
          )}
          <Button onClick={handleLog} variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus size={14} /> Log Entry
          </Button>
        </div>
      )}
    </div>
  );
}
