'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';

const ICONS = ['📱','🔞','✋','🎮','📹','🍔','🚬','🍺','🎰','💊','☕','🎬','🛒','💻','📺','🎧','🍕','🍫','💪','⭐','🔥','❌','🚫','🎯'];
const COLORS = ['#3b82f6','#ef4444','#8b5cf6','#10b981','#f59e0b','#f97316','#94a3b8','#84cc16','#ec4899','#06b6d4','#a855f7','#14b8a6'];
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
  const [color, setColor] = useState('#8b5cf6');
  const [category, setCategory] = useState<HabitCategory>('other');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setCategory(habit.category);
    } else {
      setName(''); setIcon('⭐'); setColor('#8b5cf6'); setCategory('other');
    }
  }, [habit]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, category });
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} title={habit ? 'Edit Habit' : 'Add Custom Habit'} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Habit Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Online Shopping" className="input" maxLength={30} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-violet-100 dark:bg-violet-500/20 ring-2 ring-violet-500' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as HabitCategory)} className="input">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-medium" style={{ color }}>{name || 'Preview'}</p>
            <p className="text-xs text-slate-400">{CATEGORIES.find(c => c.value === category)?.label}</p>
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
