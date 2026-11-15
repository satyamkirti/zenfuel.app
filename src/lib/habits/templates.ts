// Good Habit Templates: positive habits people can add during setup or from Add Habit. Pure
// (no React, no path aliases) so it is covered by `npm test`.
//
// A template is only a starting point. Adding one creates an ordinary habit (its own id, name,
// colour and optional goal) that can be renamed, edited, reordered or deleted like any other.
// Goals are always the person's own numbers; nothing here recommends a health target.

export const TEMPLATE_IDS = ['exercise', 'walking', 'water', 'reading', 'meditation', 'sleep', 'study'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** How a habit's optional goal is measured. */
export type GoalKind = 'none' | 'duration' | 'count' | 'bedtime';

export interface HabitGoal {
  kind: GoalKind;
  /** Daily minutes (duration goals). */
  minutes?: number;
  /** Daily count (count goals), such as glasses of water. */
  count?: number;
  /** What the count is of. */
  unit?: CountUnit;
  /** Target bedtime "HH:MM" (bedtime goals). */
  bedtime?: string;
}

export const COUNT_UNITS = ['glasses', 'bottles', 'times'] as const;
export type CountUnit = (typeof COUNT_UNITS)[number];

export interface GoodHabitTemplate {
  id: TemplateId;
  /** A palette colour (see utils/palette). */
  color: string;
  /** Goal kinds this template offers, the first being the default (always including "none"). */
  goals: GoalKind[];
}

export const GOOD_HABIT_TEMPLATES: readonly GoodHabitTemplate[] = [
  { id: 'exercise', color: '#ff982f', goals: ['none', 'duration'] },
  { id: 'walking', color: '#22c77a', goals: ['none', 'duration'] },
  { id: 'water', color: '#2cc8e8', goals: ['none', 'count'] },
  { id: 'reading', color: '#8b5cf6', goals: ['none', 'duration'] },
  { id: 'meditation', color: '#11bfa9', goals: ['none', 'duration'] },
  { id: 'sleep', color: '#1877f2', goals: ['none', 'bedtime'] },
  { id: 'study', color: '#ffc83d', goals: ['none', 'duration'] },
];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value);
}

export function getTemplate(id: string | undefined): GoodHabitTemplate | undefined {
  return GOOD_HABIT_TEMPLATES.find(t => t.id === id);
}

/** A goal kept only if it is complete and sensible; anything else becomes "no goal". */
export function sanitizeGoal(goal: Partial<HabitGoal> | undefined | null): HabitGoal {
  if (!goal || typeof goal !== 'object') return { kind: 'none' };
  if (goal.kind === 'duration') {
    const minutes = Math.round(Number(goal.minutes));
    return Number.isFinite(minutes) && minutes >= 1 && minutes <= 1440 ? { kind: 'duration', minutes } : { kind: 'none' };
  }
  if (goal.kind === 'count') {
    const count = Math.round(Number(goal.count));
    const unit = (COUNT_UNITS as readonly string[]).includes(goal.unit as string) ? goal.unit as CountUnit : 'times';
    return Number.isFinite(count) && count >= 1 && count <= 100 ? { kind: 'count', count, unit } : { kind: 'none' };
  }
  if (goal.kind === 'bedtime') {
    return typeof goal.bedtime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(goal.bedtime) ? { kind: 'bedtime', bedtime: goal.bedtime } : { kind: 'none' };
  }
  return { kind: 'none' };
}

/** The fields a new habit gets from a template (the caller adds the localised name). */
export function habitFromTemplate(id: TemplateId): { icon: string; color: string; category: 'wellness'; kind: 'build'; templateId: TemplateId; goal: HabitGoal } {
  const tpl = getTemplate(id)!;
  return { icon: '✨', color: tpl.color, category: 'wellness', kind: 'build', templateId: id, goal: { kind: 'none' } };
}

/**
 * The templates to add from a selection: known ids only, each once, in the library's order, and
 * none that the person already has (matched by template id).
 */
export function templatesToAdd(selected: readonly string[], existingTemplateIds: readonly (string | undefined)[]): TemplateId[] {
  const have = new Set(existingTemplateIds.filter(Boolean));
  const want = new Set(selected);
  return TEMPLATE_IDS.filter(id => want.has(id) && !have.has(id));
}

/** Habits being built (good habits) rather than reduced. Older records have no `kind`. */
export function isBuildHabit(h: { kind?: string; category?: string }): boolean {
  return h.kind === 'build' || h.category === 'wellness';
}
