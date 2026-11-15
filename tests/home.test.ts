// Home "today at a glance" summary: the empty state, the all-clear state and partial days, and
// that the gauge's numbers and wording always agree. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeToday, todayGaugeText } from '../src/lib/home/todaySummary';

const six = (todayCounts: number[]) => todayCounts.map(today => ({ today }));

test('no check-ins ever: empty state, never "6/6 clear"', () => {
  assert.deepEqual(summarizeToday(six([0, 0, 0, 0, 0, 0]), 0, 0), { kind: 'empty' });
});

test('no home-screen habits: empty state', () => {
  assert.deepEqual(summarizeToday([], 12, 0), { kind: 'empty' });
});

test('history but nothing today: every habit clear, worded as "so far"', () => {
  const s = summarizeToday(six([0, 0, 0, 0, 0, 0]), 40, 0);
  assert.equal(s.kind, 'tracking');
  if (s.kind !== 'tracking') return;
  assert.equal(s.clear, 6);
  assert.equal(s.total, 6);
  assert.equal(s.logged, 0);
  assert.deepEqual(todayGaugeText(s), { caption: 'Clear so far today', sub: 'Nothing tracked today' });
});

test('some habits logged today: clear count and logged count agree', () => {
  const s = summarizeToday(six([2, 0, 1, 0, 0, 0]), 40, 3);
  assert.equal(s.kind, 'tracking');
  if (s.kind !== 'tracking') return;
  assert.equal(s.clear, 4);
  assert.equal(s.logged, 3);
  assert.equal(s.otherLogged, 0);
  assert.equal(s.total - s.clear, 2);
  assert.deepEqual(todayGaugeText(s), { caption: 'Habits clear today', sub: '3 activities tracked' });
});

test('one check-in today: singular wording', () => {
  const s = summarizeToday(six([1, 0, 0, 0, 0, 0]), 5, 1);
  if (s.kind !== 'tracking') return assert.fail('expected tracking');
  assert.equal(todayGaugeText(s).sub, '1 activity tracked');
});

test('only other (personal) habits logged today: home habits stay clear and the line says so', () => {
  const s = summarizeToday(six([0, 0, 0, 0, 0, 0]), 9, 2);
  if (s.kind !== 'tracking') return assert.fail('expected tracking');
  assert.equal(s.clear, 6);
  assert.equal(s.logged, 0);
  assert.equal(s.otherLogged, 2);
  assert.deepEqual(todayGaugeText(s), { caption: 'Clear so far today', sub: '2 activities tracked for other habits' });
});

test('every habit logged today: 0 clear', () => {
  const s = summarizeToday(six([1, 1, 1, 1, 1, 1]), 30, 6);
  if (s.kind !== 'tracking') return assert.fail('expected tracking');
  assert.equal(s.clear, 0);
  assert.equal(todayGaugeText(s).caption, 'Habits clear today');
});
