// "Today at a glance" on Home: how many of the home-screen habits have no check-in today.
// Pure functions (no React, no path aliases) so they are covered by `npm test`.
//
// A habit is "clear" when it has no check-in today. That only means something once the person
// has started logging, so with no check-ins at all the summary is an empty state, never "6/6".

/** One home-screen habit's state for today. */
export interface HabitTodayState {
  /** Check-ins for this habit today. */
  today: number;
}

export type TodaySummary =
  /** Nothing has ever been logged: there is no progress to show yet. */
  | { kind: 'empty' }
  | {
      kind: 'tracking';
      /** Home-screen habits with no check-in today. */
      clear: number;
      /** Home-screen habits. */
      total: number;
      /** Check-ins today for the home-screen habits (the ones counted in clear/total). */
      logged: number;
      /** Check-ins today for other habits (personal or hidden ones not shown on Home). */
      otherLogged: number;
    };

/**
 * @param habits      the home-screen habits (personal and hidden habits excluded)
 * @param totalEntries every check-in ever logged, for any habit
 * @param todayAll    check-ins logged today, for any habit
 */
export function summarizeToday(habits: HabitTodayState[], totalEntries: number, todayAll: number): TodaySummary {
  if (totalEntries === 0 || habits.length === 0) return { kind: 'empty' };
  const logged = habits.reduce((n, h) => n + h.today, 0);
  return {
    kind: 'tracking',
    clear: habits.filter(h => h.today === 0).length,
    total: habits.length,
    logged,
    otherLogged: Math.max(0, todayAll - logged),
  };
}

const activities = (n: number) => `${n} ${n === 1 ? 'activity' : 'activities'}`;

/** The gauge's caption and supporting line, worded so the two never contradict each other. */
export function todayGaugeText(s: Extract<TodaySummary, { kind: 'tracking' }>): { caption: string; sub: string } {
  if (s.logged > 0) return { caption: 'Habits clear today', sub: `${activities(s.logged)} tracked` };
  if (s.otherLogged > 0) return { caption: 'Clear so far today', sub: `${activities(s.otherLogged)} tracked for other habits` };
  return { caption: 'Clear so far today', sub: 'Nothing tracked today' };
}
