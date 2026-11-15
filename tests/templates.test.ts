// Good Habit Templates: the library, adding several at once, goals, and how new good habits are
// ordered next to private ones. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOOD_HABIT_TEMPLATES, TEMPLATE_IDS, templatesToAdd, sanitizeGoal, habitFromTemplate, isBuildHabit, getTemplate } from '../src/lib/habits/templates';
import { orderHabits, defaultHabitOrder } from '../src/lib/habits/order';
import { translate } from '../src/i18n/translate';

test('the seven approved templates, each with a name and description in both languages', () => {
  assert.deepEqual([...TEMPLATE_IDS], ['exercise', 'walking', 'water', 'reading', 'meditation', 'sleep', 'study']);
  assert.equal(GOOD_HABIT_TEMPLATES.length, 7);
  const en = ['Exercise / Gym', 'Walking', 'Drink Water', 'Reading', 'Meditation', 'Sleep on Time', 'Study / Learning'];
  TEMPLATE_IDS.forEach((id, i) => {
    assert.equal(translate('en', `template.${id}.name`), en[i]);
    assert.match(translate('hi', `template.${id}.name`), /[ऀ-ॿ]/);
    assert.ok(translate('en', `template.${id}.desc`).length > 10);
    assert.match(translate('hi', `template.${id}.desc`), /[ऀ-ॿ]/);
    assert.ok(getTemplate(id)!.goals[0] === 'none', `${id}: "just track it" first`);
  });
});

test('goals offered per template (no prescribed amounts)', () => {
  assert.deepEqual(getTemplate('water')!.goals, ['none', 'count']);
  assert.deepEqual(getTemplate('sleep')!.goals, ['none', 'bedtime']);
  for (const id of ['exercise', 'walking', 'reading', 'meditation', 'study'] as const) assert.deepEqual(getTemplate(id)!.goals, ['none', 'duration']);
  assert.deepEqual(habitFromTemplate('water').goal, { kind: 'none' }, 'a new template habit starts without a target');
});

test('several templates are added together, each once, never twice', () => {
  assert.deepEqual(templatesToAdd(['reading', 'water', 'walking'], []), ['walking', 'water', 'reading']);
  assert.deepEqual(templatesToAdd(['reading', 'reading'], []), ['reading']);
  assert.deepEqual(templatesToAdd(['reading', 'water'], ['water', undefined]), ['reading']);
  assert.deepEqual(templatesToAdd(['nope', 'sleep'], []), ['sleep']);
  assert.deepEqual(templatesToAdd([], []), []);
});

test('template habits are good habits, kept apart from the reduction metrics', () => {
  const h = habitFromTemplate('meditation');
  assert.equal(h.kind, 'build');
  assert.equal(h.category, 'wellness');
  assert.equal(isBuildHabit(h), true);
  assert.equal(isBuildHabit({ category: 'wellness' }), true);
  assert.equal(isBuildHabit({ category: 'digital' }), false);
  assert.equal(isBuildHabit({ kind: 'reduce', category: 'other' }), false);
});

test('goals are validated: complete and sensible, otherwise "just track it"', () => {
  assert.deepEqual(sanitizeGoal({ kind: 'duration', minutes: 30 }), { kind: 'duration', minutes: 30 });
  assert.deepEqual(sanitizeGoal({ kind: 'duration', minutes: 0 }), { kind: 'none' });
  assert.deepEqual(sanitizeGoal({ kind: 'count', count: 8, unit: 'glasses' }), { kind: 'count', count: 8, unit: 'glasses' });
  assert.deepEqual(sanitizeGoal({ kind: 'count', count: 3, unit: 'litres' as never }), { kind: 'count', count: 3, unit: 'times' });
  assert.deepEqual(sanitizeGoal({ kind: 'bedtime', bedtime: '22:30' }), { kind: 'bedtime', bedtime: '22:30' });
  assert.deepEqual(sanitizeGoal({ kind: 'bedtime', bedtime: '25:00' }), { kind: 'none' });
  assert.deepEqual(sanitizeGoal(null), { kind: 'none' });
});

// Ordering: built-ins, a saved custom order, and new good habits.
const h = (id: string, category = 'digital') => ({ id, category });
const builtIns = [h('social-media'), h('porn', 'adult'), h('masturbation', 'adult'), h('gaming'), h('short-videos'), h('junk-food', 'food'), h('smoking', 'substance'), h('alcohol', 'substance')];

test('fresh install: private habits at the bottom, new good habits above them', () => {
  const withGood = [...builtIns, h('w1', 'wellness'), h('w2', 'wellness')];
  const ids = defaultHabitOrder(withGood).map(x => x.id);
  assert.deepEqual(ids.slice(-2), ['porn', 'masturbation']);
  assert.ok(ids.indexOf('w1') < ids.indexOf('porn') && ids.indexOf('w2') < ids.indexOf('porn'));
});

test("a person's own order is kept; new good habits go just above the private habits at the end", () => {
  const saved = ['gaming', 'social-media', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'porn', 'masturbation'];
  const ids = orderHabits([...builtIns, h('w1', 'wellness')], saved).map(x => x.id);
  assert.deepEqual(ids, ['gaming', 'social-media', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'w1', 'porn', 'masturbation']);
});

test('if the person moved private habits up, their order is respected', () => {
  const saved = ['porn', 'gaming', 'social-media', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'masturbation'];
  const ids = orderHabits([...builtIns, h('w1', 'wellness')], saved).map(x => x.id);
  assert.equal(ids[0], 'porn', 'their choice stays');
  assert.deepEqual(ids.slice(-2), ['w1', 'masturbation']);
});
