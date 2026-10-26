'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Save, EyeOff } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';

const ICONS = ['📱','🔞','✋','🎮','📹','🍔','🚬','🍺','🎰','💊','☕','🎬','🛒','💻','📺','🎧','🍕','🍫','💪','⭐','🔥','❌','🚫','🎯'];
const COLORS = ['#3b82f6','#ef4444','#087FF5','#10b981','#f59e0b','#f97316','#94a3b8','#84cc16','#ec4899','#06b6d4','#a855f7','#14b8a6'];
const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'digital', label: 'Digital' },
  { value: 'adult', label: 'Adult' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'substance', label: 'Substance' },
  { value: 'other', label: 'Other' },
];

interface HabitModalProps {
  habit?: Habit | null;
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => void;
}

export function HabitModal({ habit, onClose, onSave }: HabitModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#087FF5');
  const [category, setCategory] = useState<HabitCategory>('other');
  const { masked, reveal } = usePrivacy();

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setCategory(habit.category);
    } else {
      setName(''); setIcon('⭐'); setColor('#087FF5'); setCategory('other');
    }
  }, [habit]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, category });
    onClose();
  };

  // Editing an existing habit needs its real name and icon on screen; never show (or save) placeholders.
  if (habit && masked) {
    return (
      <Modal open={true} onClose={onClose} title="Edit Habit" size="sm">
        <div className="p-6 space-y-4 text-center">
          <EyeOff size={28} className="mx-auto text-muted" aria-hidden="true" />
          <p className="text-sm text-ink-2">Habit details are hidden while Hidden Mode is on.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={reveal}>Show to edit</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={habit ? 'Edit Habit' : 'Add Custom Habit'} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="habit-name" className="block text-xs font-medium text-muted mb-1">Habit Name</label>
          <input id="habit-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Online Shopping" className="input" maxLength={30} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} aria-label={`Icon ${ic}`} aria-pressed={icon === ic} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-500' : 'bg-surface-2 hover:bg-line'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="habit-category" className="block text-xs font-medium text-muted mb-1">Category</label>
          <select id="habit-category" value={category} onChange={e => setCategory(e.target.value as HabitCategory)} className="input">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-xl">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-medium" style={{ color }}>{name || 'Preview'}</p>
            <p className="text-xs text-muted">{CATEGORIES.find(c => c.value === category)?.label}</p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" icon={<Save size={14} />} onClick={handleSave} disabled={!name.trim()}>
          {habit ? 'Save Changes' : 'Add Habit'}
        </Button>
      </div>
    </Modal>
  );
}
