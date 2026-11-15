'use client';

import { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import { LogEntry, Habit } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/dateUtils';
import { usePrivacy } from '@/context/PrivacyContext';
import { useT } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n/format';

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
  const { habitName, habitIcon, masked, reveal } = usePrivacy();
  const t = useT();

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
    <Modal open={!!entry} onClose={onClose} title={t('entry.title')} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="entry-habit" className="block text-xs font-medium text-muted mb-1">{t('entry.habit')}</label>
          <select id="entry-habit" value={habitId} onChange={e => setHabitId(e.target.value)} className="input">
            {habits.map(h => <option key={h.id} value={h.id}>{habitIcon(h)} {habitName(h)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="entry-date" className="block text-xs font-medium text-muted mb-1">{t('entry.date')}</label>
            <input id="entry-date" type="date" value={date} onChange={e => setDate(e.target.value)} max={formatDate(new Date())} className="input" />
          </div>
          <div>
            <label htmlFor="entry-time" className="block text-xs font-medium text-muted mb-1">{t('entry.time')}</label>
            <input id="entry-time" type="time" value={time} onChange={e => setTime(e.target.value)} className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="entry-notes" className="block text-xs font-medium text-muted mb-1">{t('entry.notes')}</label>
          {masked && notes ? (
            // The real note stays in state and is saved unchanged; it is only not displayed.
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-2 text-sm text-muted">
              <span>{t('entry.noteHidden')}</span>
              <button type="button" onClick={reveal} className="text-xs font-medium text-brand-text hover:underline">{t('entry.showToEdit')}</button>
            </div>
          ) : (
            <textarea id="entry-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('entry.notesPlaceholder')} className="input resize-none" />
          )}
        </div>
        <p className="text-xs text-muted">{t('entry.tracked', { date: formatDateTime(entry.createdAt) })}</p>
      </div>
      <div className="px-6 pb-6 flex items-center justify-between gap-3">
        <Button variant={confirmDelete ? 'danger' : 'outline'} size="sm" icon={<Trash2 size={14} />} onClick={() => { if (confirmDelete) { onDelete(entry.id); onClose(); } else setConfirmDelete(true); }}>
          {confirmDelete ? t('entry.confirmDelete') : t('common.delete')}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" icon={<Save size={14} />} onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
}
