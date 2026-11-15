'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Save, EyeOff, Plus, PenLine, ChevronRight } from 'lucide-react';
import { BRAND_PALETTE, brandColor } from '@/utils/palette';
import { usePrivacy } from '@/context/PrivacyContext';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';
import { COUNT_UNITS, CountUnit, GoalKind, HabitGoal, TemplateId, getTemplate, sanitizeGoal } from '@/lib/habits/templates';
import { TemplatePicker } from './TemplatePicker';

const ICONS = ['📱','🔞','✋','🎮','📹','🍔','🚬','🍺','🎰','💊','☕','🎬','🛒','💻','📺','🎧','🍕','🍫','💪','⭐','🔥','❌','🚫','🎯','🏃','💧','📚','🧘','😴','🎓'];
const COLORS: string[] = [...BRAND_PALETTE];
const CATEGORIES: HabitCategory[] = ['wellness', 'digital', 'adult', 'food', 'substance', 'other'];
const ALL_GOALS: GoalKind[] = ['none', 'duration', 'count', 'bedtime'];

interface HabitModalProps {
  habit?: Habit | null;
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => void;
}

/** A good habit's optional daily goal: always the person's own numbers, never a recommendation. */
function GoalEditor({ kinds, goal, onChange }: { kinds: GoalKind[]; goal: HabitGoal; onChange: (g: HabitGoal) => void }) {
  const t = useT();
  return (
    <fieldset className="rounded-2xl border border-line p-3.5 space-y-3">
      <legend className="px-1 text-xs font-medium text-muted">{t('goal.label')}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('goal.label')}>
        {kinds.map(k => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={goal.kind === k}
            onClick={() => onChange(k === 'count' ? { kind: k, count: goal.count ?? 1, unit: goal.unit ?? 'glasses' } : k === 'duration' ? { kind: k, minutes: goal.minutes ?? 15 } : k === 'bedtime' ? { kind: k, bedtime: goal.bedtime ?? '23:00' } : { kind: 'none' })}
            className={`min-h-[40px] px-3 rounded-xl border text-sm font-medium transition-colors ${goal.kind === k ? 'border-brand bg-brand-soft text-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong'}`}
          >
            {t(`goal.kind.${k}` as MessageKey)}
          </button>
        ))}
      </div>
      {goal.kind === 'duration' && (
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">{t('goal.minutesLabel')}</span>
          <input type="number" inputMode="numeric" min={1} max={1440} value={goal.minutes ?? ''} onChange={e => onChange({ kind: 'duration', minutes: Number(e.target.value) })} className="input" />
        </label>
      )}
      {goal.kind === 'count' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">{t('goal.countLabel')}</span>
            <input type="number" inputMode="numeric" min={1} max={100} value={goal.count ?? ''} onChange={e => onChange({ ...goal, kind: 'count', count: Number(e.target.value) })} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted mb-1">{t('goal.unitLabel')}</span>
            <select value={goal.unit ?? 'times'} onChange={e => onChange({ ...goal, kind: 'count', unit: e.target.value as CountUnit })} className="input">
              {COUNT_UNITS.map(u => <option key={u} value={u}>{t(`goal.unitName.${u}` as MessageKey)}</option>)}
            </select>
          </label>
        </div>
      )}
      {goal.kind === 'bedtime' && (
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1">{t('goal.bedtimeLabel')}</span>
          <input type="time" value={goal.bedtime ?? ''} onChange={e => onChange({ kind: 'bedtime', bedtime: e.target.value })} className="input" />
        </label>
      )}
      <p className="text-xs text-muted leading-relaxed">{t('goal.help')}</p>
    </fieldset>
  );
}

export function HabitModal({ habit, onClose, onSave }: HabitModalProps) {
  const t = useT();
  const { masked, reveal, habitName } = usePrivacy();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState<string>(BRAND_PALETTE[0]);
  const [category, setCategory] = useState<HabitCategory>('other');
  const [goal, setGoal] = useState<HabitGoal>({ kind: 'none' });
  // The name as shown (built-in and template habits are shown in the interface language).
  const shownName = habit && !masked ? habitName(habit) : '';

  useEffect(() => {
    if (habit) {
      setName(shownName || habit.name);
      setIcon(habit.icon);
      setColor(brandColor(habit.color));
      setCategory(habit.category);
      setGoal(habit.goal ?? { kind: 'none' });
    } else {
      setName(''); setIcon('⭐'); setColor(BRAND_PALETTE[0]); setCategory('other'); setGoal({ kind: 'none' });
    }
    // Only when a different habit is opened (not when the language changes while editing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit]);

  const good = category === 'wellness';
  const template = getTemplate(habit?.templateId);
  const goalKinds = template ? template.goals : ALL_GOALS;

  const handleSave = () => {
    if (!name.trim()) return;
    // An unchanged built-in or template name keeps its stored value, so it still follows the language.
    const savedName = habit && name.trim() === shownName ? habit.name : name.trim();
    const kind = good ? 'build' as const : habit?.kind === 'build' ? 'reduce' as const : habit?.kind;
    onSave({
      name: savedName, icon, color, category,
      ...(kind ? { kind } : {}),
      goal: good ? sanitizeGoal(goal) : undefined,
    });
    onClose();
  };

  // Editing an existing habit needs its real name and icon on screen; never show (or save) placeholders.
  if (habit && masked) {
    return (
      <Modal open={true} onClose={onClose} title={t('habitModal.editTitle')} size="sm">
        <div className="p-6 space-y-4 text-center">
          <EyeOff size={28} className="mx-auto text-muted" aria-hidden="true" />
          <p className="text-sm text-ink-2">{t('habitModal.hidden')}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
            <Button size="sm" onClick={reveal}>{t('habitModal.showToEdit')}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={habit ? t('habitModal.editTitle') : t('habitModal.customTitle')} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="habit-name" className="block text-xs font-medium text-muted mb-1">{t('habitModal.name')}</label>
          <input id="habit-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('habitModal.namePlaceholder')} className="input" maxLength={30} />
        </div>

        <div>
          <label htmlFor="habit-category" className="block text-xs font-medium text-muted mb-1">{t('habitModal.category')}</label>
          <select id="habit-category" value={category} onChange={e => setCategory(e.target.value as HabitCategory)} className="input">
            {CATEGORIES.map(c => <option key={c} value={c}>{t(`category.${c}` as MessageKey)}</option>)}
          </select>
          {good && <p className="mt-1.5 text-xs text-muted leading-relaxed">{t('habitModal.kindHint')}</p>}
        </div>

        {good && <GoalEditor kinds={goalKinds} goal={goal} onChange={setGoal} />}

        <div>
          <p className="block text-xs font-medium text-muted mb-1">{t('habitModal.icon')}</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)} aria-label={t('habitModal.iconOption', { icon: ic })} aria-pressed={icon === ic} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-[transform,box-shadow,background-color,border-color,color,opacity] ${icon === ic ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface-2 hover:bg-line'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-xs font-medium text-muted mb-1">{t('habitModal.colour')}</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c, i) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={t('habitModal.colourOption', { n: i + 1 })} aria-pressed={color === c} className={`w-7 h-7 rounded-full transition-[transform,box-shadow,background-color,border-color,color,opacity] ${color === c ? 'ring-2 ring-offset-2 ring-brand ring-offset-surface scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-xl">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
          <div>
            <p className="text-sm font-medium" style={{ color }}>{name || t('habitModal.preview')}</p>
            <p className="text-xs text-muted">{t(`category.${category}` as MessageKey)}</p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
        <Button size="sm" icon={<Save size={14} />} onClick={handleSave} disabled={!name.trim()}>
          {habit ? t('common.saveChanges') : t('habits.add')}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Add a habit: Good Habit Templates (choose any number and add them together) or a custom habit.
 * Templates already added are shown as added.
 */
export function AddHabitModal({
  existingTemplateIds, onClose, onAddTemplates, onCustom,
}: {
  existingTemplateIds: string[];
  onClose: () => void;
  /** Returns false when the habits could not be saved. */
  onAddTemplates: (ids: TemplateId[]) => boolean;
  onCustom: () => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState<TemplateId[]>([]);
  const [error, setError] = useState('');
  const toggle = (id: TemplateId) => { setError(''); setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])); };
  const add = () => {
    if (selected.length === 0) return;
    if (onAddTemplates(selected)) onClose();
    else setError(t('habitModal.saveFailed'));
  };
  return (
    <Modal open={true} onClose={onClose} title={t('habitModal.addTitle')} size="md">
      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="font-display text-[15px] font-semibold text-ink">{t('template.libraryTitle')}</h4>
          <p className="mt-0.5 text-sm text-muted leading-relaxed">{t('template.libraryBody')}</p>
        </div>
        <TemplatePicker selected={selected} onToggle={toggle} added={existingTemplateIds} idPrefix="add" />
        {error && <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2.5 text-sm text-bad">{error}</p>}
        <button
          type="button"
          onClick={add}
          disabled={selected.length === 0}
          className="w-full min-h-[48px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold transition-[transform,opacity] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 btn-track disabled:bg-none disabled:bg-surface-3 disabled:text-muted disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Plus size={17} aria-hidden="true" />
          {selected.length ? t('template.addSelected', { count: selected.length }) : t('template.selectHint')}
        </button>
        <div className="pt-1 border-t border-line">
          <button type="button" onClick={onCustom} className="mt-3 w-full flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface-2/60 text-left hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-soft text-brand-text flex items-center justify-center" aria-hidden="true"><PenLine size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold text-ink">{t('template.createCustom')}</span>
              <span className="block text-xs text-muted">{t('habitModal.customSub')}</span>
            </span>
            <ChevronRight size={18} className="text-muted" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
