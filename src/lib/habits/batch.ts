// Logging several habits at once ("Track 3 activities"). Pure function (no React, no path
// aliases) so it is covered by `npm test`.

/** The fields of a log entry (matches LogEntry in src/types). */
export interface BatchEntry {
  id: string;
  habitId: string;
  date: string;
  time: string;
  timestamp: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BatchMoment {
  /** Local date YYYY-MM-DD and time HH:MM shown in History. */
  date: string;
  time: string;
  /** Milliseconds since the epoch: the same for every entry in the batch. */
  timestamp: number;
}

/**
 * One entry per selected habit, all sharing the same moment and note. Duplicate or empty habit
 * ids are dropped, so one batch can never log the same habit twice.
 */
export function buildBatchEntries(
  habitIds: readonly string[],
  moment: BatchMoment,
  notes: string | undefined,
  makeId: () => string,
  now: number = Date.now(),
): BatchEntry[] {
  const note = notes?.trim() ? notes : undefined;
  const unique = [...new Set(habitIds.filter(id => typeof id === 'string' && id.length > 0))];
  return unique.map(habitId => ({
    id: makeId(),
    habitId,
    date: moment.date,
    time: moment.time,
    timestamp: moment.timestamp,
    notes: note,
    createdAt: now,
    updatedAt: now,
  }));
}
