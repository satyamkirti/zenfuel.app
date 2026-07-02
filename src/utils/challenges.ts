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

  const start = new Date(challenge.startDate + 'T00:00:00').getTime();
  const now = Date.now();

  const daysDone = Math.min(challenge.durationDays, Math.max(0, Math.floor((now - start) / 86400000)));
  const daysLeft = Math.max(0, challenge.durationDays - daysDone);
  const percentage = Math.round((daysDone / challenge.durationDays) * 100);

  const relevant = challenge.habitId === 'all'
    ? entries.filter(e => e.timestamp >= start)
    : entries.filter(e => e.habitId === challenge.habitId && e.timestamp >= start);

  const isViolated = relevant.length > 0;
  const violationDate = isViolated
    ? formatDate(new Date(Math.min(...relevant.map(e => e.timestamp))))
    : undefined;

  return { daysDone, daysLeft, percentage, isViolated, violationDate };
}
