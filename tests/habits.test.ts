// Habit ordering (default privacy order, saved custom order, new habits, moves) and batch
// check-ins (one entry per habit, same moment and note, no duplicates). Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultHabitOrder, orderHabits, moveItem, parseHabitOrder, isPrivateHabit } from '../src/lib/habits/order';
import { buildBatchEntries } from '../src/lib/habits/batch';

// The built-in habits in the order they are stored on a fresh install.
const BUILT_IN = [
  { id: 'social-media', category: 'digital' },
  { id: 'porn', category: 'adult' },
  { id: 'masturbation', category: 'adult' },
  { id: 'gaming', category: 'digital' },
  { id: 'short-videos', category: 'digital' },
  { id: 'junk-food', category: 'food' },
  { id: 'smoking', category: 'substance' },
  { id: 'alcohol', category: 'substance' },
];
const ids = (list: { id: string }[]) => list.map(h => h.id);

test('default order: public habits first, Porn and Masturbation at the bottom', () => {
  assert.deepEqual(ids(defaultHabitOrder(BUILT_IN)), [
    'social-media', 'gaming', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'porn', 'masturbation',
  ]);
});

test('no saved order (or an empty one) uses the default order', () => {
  assert.deepEqual(ids(orderHabits(BUILT_IN, null)), ids(defaultHabitOrder(BUILT_IN)));
  assert.deepEqual(ids(orderHabits(BUILT_IN, [])), ids(defaultHabitOrder(BUILT_IN)));
});

test('a saved order is used as-is, including a private habit moved up', () => {
  const saved = ['short-videos', 'porn', 'social-media', 'gaming', 'junk-food', 'smoking', 'alcohol', 'masturbation'];
  assert.deepEqual(ids(orderHabits(BUILT_IN, saved)), saved);
});

test('a new public habit goes before the private habits at the end; the saved order is kept', () => {
  const saved = ['gaming', 'social-media', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'porn', 'masturbation'];
  const withNew = [...BUILT_IN, { id: 'reading-news', category: 'digital' }];
  assert.deepEqual(ids(orderHabits(withNew, saved)), [
    'gaming', 'social-media', 'short-videos', 'junk-food', 'smoking', 'alcohol', 'reading-news', 'porn', 'masturbation',
  ]);
});

test('a new private habit goes to the very end', () => {
  const saved = ids(defaultHabitOrder(BUILT_IN));
  const withNew = [...BUILT_IN, { id: 'private-new', category: 'adult' }];
  assert.deepEqual(ids(orderHabits(withNew, saved)).slice(-3), ['porn', 'masturbation', 'private-new']);
});

test('a new public habit goes to the end when the list does not end with private habits', () => {
  const saved = ['porn', 'masturbation', 'social-media', 'gaming', 'short-videos', 'junk-food', 'smoking', 'alcohol'];
  const withNew = [...BUILT_IN, { id: 'new-one', category: 'other' }];
  assert.deepEqual(ids(orderHabits(withNew, saved)), [...saved, 'new-one']);
});

test('deleted habits in the saved order are ignored, and duplicates are dropped', () => {
  const saved = ['gone', 'gaming', 'gaming', 'social-media'];
  const out = ids(orderHabits(BUILT_IN, saved));
  assert.deepEqual(out.slice(0, 2), ['gaming', 'social-media']);
  assert.equal(out.length, BUILT_IN.length);
  assert.equal(new Set(out).size, BUILT_IN.length);
});

test('ordering never loses or invents habits', () => {
  const saved = ['alcohol', 'porn', 'gaming'];
  const out = ids(orderHabits(BUILT_IN, saved));
  assert.deepEqual([...out].sort(), ids(BUILT_IN).sort());
});

test('moveItem moves one item and clamps indexes', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, 99), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 5, 0), ['a', 'b', 'c']);
});

test('stored order is validated', () => {
  assert.equal(parseHabitOrder(null), null);
  assert.equal(parseHabitOrder('gaming'), null);
  assert.equal(parseHabitOrder([]), null);
  assert.deepEqual(parseHabitOrder(['a', 2, '', 'b', 'a']), ['a', 'b']);
});

test('private means the Personal category', () => {
  assert.equal(isPrivateHabit({ id: 'porn', category: 'adult' }), true);
  assert.equal(isPrivateHabit({ id: 'gaming', category: 'digital' }), false);
});

// ── Batch check-ins ──────────────────────────────────────────────────────────

const moment = { date: '2026-11-14', time: '21:05', timestamp: Date.UTC(2026, 10, 14, 15, 35) };
let n = 0;
const makeId = () => `id-${++n}`;

test('three selected habits make three separate entries with the same moment and note', () => {
  const batch = buildBatchEntries(['social-media', 'gaming', 'short-videos'], moment, 'After dinner', makeId, 1000);
  assert.equal(batch.length, 3);
  assert.deepEqual(batch.map(e => e.habitId), ['social-media', 'gaming', 'short-videos']);
  for (const e of batch) {
    assert.equal(e.date, '2026-11-14');
    assert.equal(e.time, '21:05');
    assert.equal(e.timestamp, moment.timestamp);
    assert.equal(e.notes, 'After dinner');
    assert.equal(e.createdAt, 1000);
  }
  assert.equal(new Set(batch.map(e => e.id)).size, 3);
});

test('the same habit twice in one batch is logged once', () => {
  const batch = buildBatchEntries(['gaming', 'gaming', '', 'alcohol'], moment, undefined, makeId);
  assert.deepEqual(batch.map(e => e.habitId), ['gaming', 'alcohol']);
});

test('an empty or blank note is stored as no note', () => {
  assert.equal(buildBatchEntries(['gaming'], moment, '', makeId)[0].notes, undefined);
  assert.equal(buildBatchEntries(['gaming'], moment, '   ', makeId)[0].notes, undefined);
});

test('nothing selected makes no entries', () => {
  assert.deepEqual(buildBatchEntries([], moment, 'x', makeId), []);
});
