'use client';

// Good Habit Templates as selectable cards: used in onboarding and in Add Habit. Each card has
// the template's icon in its colour, its localised name and a short description; selected cards
// show a check. Templates the person already has are shown as added and cannot be picked again.

import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { GOOD_HABIT_TEMPLATES, TemplateId } from '@/lib/habits/templates';
import { TEMPLATE_ICONS } from '@/components/dashboard/HabitGlyph';
import { tint } from '@/utils/palette';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';
import type { Habit } from '@/types';

/** New habits (without id) for the chosen templates, named in the interface language. */
export function habitsFromTemplates(ids: readonly TemplateId[], t: (key: MessageKey) => string): Omit<Habit, 'id' | 'isDefault' | 'createdAt'>[] {
  return ids.map(id => {
    const tpl = GOOD_HABIT_TEMPLATES.find(x => x.id === id)!;
    return {
      name: t(`template.${id}.name` as MessageKey),
      icon: '✨',
      color: tpl.color,
      category: 'wellness' as const,
      kind: 'build' as const,
      templateId: id,
      goal: { kind: 'none' as const },
    };
  });
}

export function TemplatePicker({
  selected, onToggle, added = [], idPrefix = 'tpl',
}: {
  selected: readonly string[];
  onToggle: (id: TemplateId) => void;
  /** Template ids the person already has. */
  added?: readonly string[];
  idPrefix?: string;
}) {
  const t = useT();
  return (
    <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5" aria-label={t('template.libraryTitle')}>
      {GOOD_HABIT_TEMPLATES.map(tpl => {
        const Icon = TEMPLATE_ICONS[tpl.id];
        const has = added.includes(tpl.id);
        const on = !has && selected.includes(tpl.id);
        const nameId = `${idPrefix}-${tpl.id}-name`;
        return (
          <li key={tpl.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              aria-labelledby={nameId}
              aria-describedby={`${idPrefix}-${tpl.id}-desc`}
              disabled={has}
              onClick={() => onToggle(tpl.id)}
              style={tint(tpl.color)}
              className={clsx(
                'cat-card relative w-full h-full min-h-[84px] flex items-start gap-3 p-3 pr-9 rounded-[18px] border text-left transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25',
                has && 'opacity-60 cursor-default',
              )}
            >
              <span className="tint w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" aria-hidden="true">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span id={nameId} className="block text-[15px] font-semibold text-ink leading-snug">{t(`template.${tpl.id}.name` as MessageKey)}</span>
                <span id={`${idPrefix}-${tpl.id}-desc`} className="block mt-0.5 text-[13px] text-muted leading-snug">
                  {has ? t('template.alreadyAdded') : t(`template.${tpl.id}.desc` as MessageKey)}
                </span>
              </span>
              {on
                ? <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-track text-white flex items-center justify-center pop-in shadow-md" aria-hidden="true"><Check size={11} strokeWidth={3.25} /></span>
                : !has && <span className="absolute top-3 right-3 w-4 h-4 rounded-full border-[1.5px] border-line-strong bg-surface/80 dark:border-white/30 dark:bg-transparent" aria-hidden="true" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
