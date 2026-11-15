// The Home hero's time of day: greeting, sun or moon, and when the next change is due. Run with
// `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, skyPhase, msUntilNextDayPart, sameDayPart } from '../src/lib/home/dayPart';

const at = (h: number, m = 0, s = 0) => new Date(2026, 10, 15, h, m, s, 0);

test('greetings keep their existing hours', () => {
  assert.equal(greeting(0), 'Still up');
  assert.equal(greeting(4), 'Still up');
  assert.equal(greeting(5), 'Good morning');
  assert.equal(greeting(11), 'Good morning');
  assert.equal(greeting(12), 'Good afternoon');
  assert.equal(greeting(16), 'Good afternoon');
  assert.equal(greeting(17), 'Good evening');
  assert.equal(greeting(23), 'Good evening');
});

test('sun during the morning and afternoon greetings, moon during evening and night', () => {
  for (let h = 0; h < 24; h++) {
    const g = greeting(h);
    const expected = g === 'Good morning' || g === 'Good afternoon' ? 'day' : 'night';
    assert.equal(skyPhase(h), expected, `hour ${h}`);
  }
});

test('next change: the next of 05:00, 12:00, 17:00 and midnight', () => {
  assert.equal(msUntilNextDayPart(at(4, 59, 30)), 30_000);
  assert.equal(msUntilNextDayPart(at(9)), 3 * 3_600_000);
  assert.equal(msUntilNextDayPart(at(16, 59, 59)), 1_000);
  assert.equal(msUntilNextDayPart(at(17)), 7 * 3_600_000);
  assert.equal(msUntilNextDayPart(at(23, 30)), 30 * 60_000);
});

test('next change is always in the future and within a day', () => {
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 1, 30, 59]) {
      const ms = msUntilNextDayPart(at(h, m));
      assert.ok(ms > 0 && ms <= 7 * 3_600_000, `${h}:${m} → ${ms}`);
      const after = new Date(at(h, m).getTime() + ms);
      assert.ok([0, 5, 12, 17].includes(after.getHours()) && after.getMinutes() === 0, `${h}:${m} lands on ${after}`);
    }
  }
});

test('sameDayPart: unchanged within a part, changed across a boundary or midnight', () => {
  assert.equal(sameDayPart(at(13), at(16, 59)), true);
  assert.equal(sameDayPart(at(16, 59), at(17)), false);
  assert.equal(sameDayPart(at(23, 59), new Date(2026, 10, 16, 0, 0)), false);
});
