'use client';

import { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import { LogEntry, Habit } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface EntryModalProps {
  entry: LogEntry | null;
  habits: Habit[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<LogEntry>) => void;
  onDelete: (id: string) => void;
}

export function EntryModal({ entry, habits, onClose, onSave, onDelete }: EntryModalProps) {
  const [habitId, setHabitId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (entry) {
      setHabitId(entry.habitId);
      setDate(entry.date);
      setTime(entry.time);
      setNotes(entry.notes ?? '');
      setConfirmDelete(false);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    const dt = new Date(`${date}T${time}:00`);
    onSave(entry.id, { habitId, date, time, timestamp: dt.getTime(), notes: notes || undefined });
    onClose();
  };

  return (
    <Modal open={!!entry} onClose={onClose} title="Edit Entry" size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Habit</label>
          <select value={habitId} onChange={e => setHabitId(e.target.value)} className="input">
            {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={formatDate(new Date())} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." className="input resize-none" />
        </div>
        <p className="text-xs text-slate-400">Logged: {new Date(entry.createdAt).toLocaleString()}</p>
      </div>
      <div className="px-6 pb-6 flex items-center justify-between gap-3">
        <Button variant={confirmDelete ? 'danger' : 'outline'} size="sm" icon={<Trash2 size={14} />} onClick={() => { if (confirmDelete) { onDelete(entry.id); onClose(); } else setConfirmDelete(true); }}>
          {confirmDelete ? 'Confirm Delete' : 'Delete'}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" icon={<Save size={14} />} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
