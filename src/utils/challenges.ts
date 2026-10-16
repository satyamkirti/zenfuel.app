import { Challenge, LogEntry } from '@/types';
import { formatDate } from './dateUtils';

export interface ChallengeProgress {
  daysDone: number;
  daysLeft: number;
  percentage: number;
  isViolated: boolean;
  violationDate?: string;
}

export function computeChallengeProgress(challenge: Challenge, entries: LogEntry[]): ChallengeProgress {
  if (!challenge.startDate || !challenge.isActive) {
    return { daysDone: 0, daysLeft: challenge.durationDays, percentage: 0, isViolated: false };
  }

  // Days are counted from local midnight of the start date.
  const dayStart = new Date(challenge.startDate + 'T00:00:00').getTime();
  // Only entries logged after the challenge was started count against it. Older records
  // without startedAt fall back to the start of the start date.
  const countFrom = challenge.startedAt ?? dayStart;
  const now = Date.now();

  const daysDone = Math.min(challenge.durationDays, Math.max(0, Math.floor((now - dayStart) / 86400000)));
  const daysLeft = Math.max(0, challenge.durationDays - daysDone);
  const percentage = Math.round((daysDone / challenge.durationDays) * 100);

  const relevant = challenge.habitId === 'all'
    ? entries.filter(e => e.timestamp >= countFrom)
    : entries.filter(e => e.habitId === challenge.habitId && e.timestamp >= countFrom);

  const isViolated = relevant.length > 0;
  const violationDate = isViolated
    ? formatDate(new Date(Math.min(...relevant.map(e => e.timestamp))))
    : undefined;

  return { daysDone, daysLeft, percentage, isViolated, violationDate };
}
