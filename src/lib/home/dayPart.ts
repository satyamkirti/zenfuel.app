// The Home hero's time of day, from the device's local clock: the greeting and whether the
// landscape shows the sun (morning and afternoon) or the moon (evening and night). Pure, so it is
// unit tested (tests/home.test.ts).

export type SkyPhase = 'day' | 'night';

/** The greeting for a local hour (0–23). */
export function greeting(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The translation key of the greeting for a local hour (same hours as `greeting`). */
export function greetingKey(hour: number): 'greeting.night' | 'greeting.morning' | 'greeting.afternoon' | 'greeting.evening' {
  if (hour < 5) return 'greeting.night';
  if (hour < 12) return 'greeting.morning';
  if (hour < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}

/** The sun through the morning and afternoon greetings (05:00–16:59), the moon otherwise. */
export function skyPhase(hour: number): SkyPhase {
  return hour >= 5 && hour < 17 ? 'day' : 'night';
}

// Local hours where the greeting, the sky or the date changes.
const BOUNDARIES = [0, 5, 12, 17];

/** Milliseconds from `now` until the next greeting, sky or date change, in local time. */
export function msUntilNextDayPart(now: Date): number {
  const next = new Date(now.getTime());
  const h = BOUNDARIES.find(b => b > now.getHours());
  if (h === undefined) next.setDate(next.getDate() + 1);
  next.setHours(h ?? 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** Same date, greeting and sky: nothing on the hero would change between `a` and `b`. */
export function sameDayPart(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString() && greeting(a.getHours()) === greeting(b.getHours());
}
