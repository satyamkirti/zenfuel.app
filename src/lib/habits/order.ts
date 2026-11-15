// Habit display order. Pure functions (no React, no path aliases) so they are covered by `npm test`.
//
// Default (no saved order): public habits first, private ones (the Personal category, such as
// Porn and Masturbation) last, each group in its existing order. Once the person reorders, their
// saved order is used as-is; private habits can then sit anywhere they put them.

/** The fields ordering needs (a Habit has more). */
export interface OrderableHabit {
  id: string;
  category: string;
}

/** Private habits: kept at the bottom by default so they are not the first thing on screen. */
export function isPrivateHabit(h: OrderableHabit): boolean {
  return h.category === 'adult';
}

/** Public habits first, private last, keeping the existing order inside each group. */
export function defaultHabitOrder<T extends OrderableHabit>(habits: T[]): T[] {
  return [...habits.filter(h => !isPrivateHabit(h)), ...habits.filter(isPrivateHabit)];
}

/**
 * Habits in the saved order. Saved ids that no longer exist are ignored. Habits not in the saved
 * order (added since it was saved) are placed without disturbing it: a new private habit goes to
 * the very end; a new public habit goes just before the private habits at the end of the list
 * (or at the end, if the list does not end with private habits).
 */
export function orderHabits<T extends OrderableHabit>(habits: T[], saved: readonly string[] | null | undefined): T[] {
  if (!saved || saved.length === 0) return defaultHabitOrder(habits);
  const byId = new Map(habits.map(h => [h.id, h]));
  const ordered: T[] = [];
  const seen = new Set<string>();
  for (const id of saved) {
    const h = byId.get(id);
    if (h && !seen.has(id)) { ordered.push(h); seen.add(id); }
  }
  const added = habits.filter(h => !seen.has(h.id));
  if (added.length === 0) return ordered;
  // Start of the run of private habits at the end of the saved order.
  let tail = ordered.length;
  while (tail > 0 && isPrivateHabit(ordered[tail - 1])) tail--;
  const addedPublic = added.filter(h => !isPrivateHabit(h));
  const addedPrivate = added.filter(isPrivateHabit);
  return [...ordered.slice(0, tail), ...addedPublic, ...ordered.slice(tail), ...addedPrivate];
}

/** A copy of `ids` with the item at `from` moved to `to` (indexes are clamped). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, to));
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

/** Validates a stored order: a list of unique non-empty strings, or null. */
export function parseHabitOrder(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0);
  return ids.length ? [...new Set(ids)] : null;
}
