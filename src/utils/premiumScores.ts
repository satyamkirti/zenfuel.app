import { LogEntry } from '@/types';
import { PremiumScore, RelapseRisk } from '@/types/subscription';
import { getStartOfDay, getStartOfWeek, WEEKDAYS, formatHour } from './dateUtils';
import { computeStreaks } from './streaks';

export function computeFocusScore(entries: LogEntry[]): PremiumScore {
  if (entries.length === 0) {
    return { score: 100, label: 'Excellent', color: '#10b981', breakdown: [] };
  }

  const breakdown: PremiumScore['breakdown'] = [];
  let score = 100;

  // Penalty for work-hours sessions (9am–6pm Mon-Fri)
  const workHourSessions = entries.filter(e => {
    const d = new Date(e.timestamp);
    const h = d.getHours();
    const dow = d.getDay();
    return dow >= 1 && dow <= 5 && h >= 9 && h < 18;
  });
  const workPenalty = Math.min(40, workHourSessions.length * 4);
  score -= workPenalty;
  breakdown.push({ label: 'Work-hour triggers', value: workHourSessions.length, impact: workHourSessions.length > 0 ? 'negative' : 'neutral' });

  // Penalty for late-night sessions (11pm–4am)
  const lateNight = entries.filter(e => {
    const h = new Date(e.timestamp).getHours();
    return h >= 23 || h < 4;
  });
  const nightPenalty = Math.min(20, lateNight.length * 3);
  score -= nightPenalty;
  breakdown.push({ label: 'Late-night triggers', value: lateNight.length, impact: lateNight.length > 0 ? 'negative' : 'neutral' });

  // Bonus for long average gap between sessions
  if (entries.length >= 2) {
    const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    const gaps = sorted.slice(1).map((e, i) => e.timestamp - sorted[i].timestamp);
    const avgGapHours = (gaps.reduce((s, g) => s + g, 0) / gaps.length) / 3600000;
    if (avgGapHours >= 48) { score += 15; breakdown.push({ label: 'Long avg gap (48h+)', value: Math.round(avgGapHours), impact: 'positive' }); }
    else if (avgGapHours >= 24) { score += 8; breakdown.push({ label: 'Moderate avg gap (24h+)', value: Math.round(avgGapHours), impact: 'positive' }); }
    else { breakdown.push({ label: `Avg gap ${Math.round(avgGapHours)}h`, value: Math.round(avgGapHours), impact: 'neutral' }); }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  return { score, label, color, breakdown };
}

export function computeDisciplineScore(entries: LogEntry[], completedChallengesCount: number, achievedGoalsCount: number): PremiumScore {
  const breakdown: PremiumScore['breakdown'] = [];
  let score = 50;

  const streaks = computeStreaks(entries);

  // Streak bonus
  const streakBonus = Math.min(30, streaks.currentStreak * 2);
  score += streakBonus;
  breakdown.push({ label: `Current streak (${streaks.currentStreak}d)`, value: streakBonus, impact: streakBonus > 0 ? 'positive' : 'neutral' });

  // Longest streak recognition
  if (streaks.longestStreak >= 30) { score += 10; breakdown.push({ label: 'Achieved 30-day streak', value: 10, impact: 'positive' }); }
  else if (streaks.longestStreak >= 14) { score += 6; breakdown.push({ label: 'Achieved 14-day streak', value: 6, impact: 'positive' }); }
  else if (streaks.longestStreak >= 7) { score += 3; breakdown.push({ label: 'Achieved 7-day streak', value: 3, impact: 'positive' }); }

  // Challenge completions
  const challengeBonus = Math.min(15, completedChallengesCount * 5);
  score += challengeBonus;
  if (completedChallengesCount > 0) breakdown.push({ label: `${completedChallengesCount} challenge(s) completed`, value: challengeBonus, impact: 'positive' });

  // Goal achievements
  const goalBonus = Math.min(10, achievedGoalsCount * 5);
  score += goalBonus;
  if (achievedGoalsCount > 0) breakdown.push({ label: `${achievedGoalsCount} goal(s) achieved`, value: goalBonus, impact: 'positive' });

  // Recent activity penalty
  const todayCount = entries.filter(e => e.timestamp >= getStartOfDay(new Date()).getTime()).length;
  if (todayCount > 2) { score -= 15; breakdown.push({ label: `${todayCount} events today`, value: -15, impact: 'negative' }); }
  else if (todayCount > 0) { score -= 5; breakdown.push({ label: `${todayCount} event today`, value: -5, impact: 'negative' }); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  return { score, label, color, breakdown };
}

export function computeProductivityScore(focusScore: number, disciplineScore: number, detoxScore: number): PremiumScore {
  const score = Math.round(focusScore * 0.35 + disciplineScore * 0.35 + detoxScore * 0.30);
  const label = score >= 80 ? 'Peak Performance' : score >= 60 ? 'On Track' : score >= 40 ? 'Building Up' : 'Needs Attention';
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';
  return {
    score,
    label,
    color,
    breakdown: [
      { label: 'Focus Score (35%)', value: Math.round(focusScore * 0.35), impact: 'neutral' },
      { label: 'Discipline Score (35%)', value: Math.round(disciplineScore * 0.35), impact: 'neutral' },
      { label: 'Detox Score (30%)', value: Math.round(detoxScore * 0.30), impact: 'neutral' },
    ],
  };
}

export function computeRelapseRisk(entries: LogEntry[]): RelapseRisk {
  const now = new Date();
  const todayDow = now.getDay();
  const currentHour = now.getHours();

  let riskScore = 0;
  const factors: string[] = [];

  if (entries.length < 3) {
    return { level: 'low', score: 10, color: '#10b981', factors: ['Not enough data yet'], recommendation: 'Keep logging to get personalized risk analysis.' };
  }

  // Most active weekday risk
  const dowCounts = new Array(7).fill(0);
  entries.forEach(e => dowCounts[new Date(e.timestamp).getDay()]++);
  const maxDow = dowCounts.indexOf(Math.max(...dowCounts));
  if (todayDow === maxDow) {
    riskScore += 25;
    factors.push(`${WEEKDAYS[maxDow]} is your highest-risk day`);
  }

  // Peak hour proximity
  const hourCounts = new Array(24).fill(0);
  entries.forEach(e => hourCounts[new Date(e.timestamp).getHours()]++);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const hourDiff = Math.min(Math.abs(currentHour - peakHour), 24 - Math.abs(currentHour - peakHour));
  if (hourDiff <= 2 && hourCounts[peakHour] > 0) {
    riskScore += 20;
    factors.push(`Approaching your peak trigger time (${formatHour(peakHour)})`);
  }

  // Streak vulnerability window (7-21 days — common relapse zone)
  const { currentStreak } = computeStreaks(entries);
  if (currentStreak >= 7 && currentStreak <= 21) {
    riskScore += 20;
    factors.push(`Day ${currentStreak} streak — historically a vulnerable window`);
  } else if (currentStreak === 0) {
    riskScore += 15;
    factors.push('No active streak — establish a new one today');
  }

  // Recent trend worsening
  const weekStart = getStartOfWeek(now).getTime();
  const prevWeekStart = weekStart - 7 * 86400000;
  const thisWeek = entries.filter(e => e.timestamp >= weekStart).length;
  const lastWeek = entries.filter(e => e.timestamp >= prevWeekStart && e.timestamp < weekStart).length;
  if (thisWeek > lastWeek && lastWeek > 0) {
    riskScore += 15;
    factors.push(`This week (${thisWeek}) is above last week (${lastWeek})`);
  }

  // Today already had events
  const todayStart = getStartOfDay(now).getTime();
  const todayCount = entries.filter(e => e.timestamp >= todayStart).length;
  if (todayCount >= 2) {
    riskScore += 20;
    factors.push(`Already triggered ${todayCount}x today — pattern risk`);
  }

  riskScore = Math.min(100, riskScore);
  const level: RelapseRisk['level'] = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';

  const recommendations: Record<RelapseRisk['level'], string> = {
    high: 'High risk right now. Try the 5-minute delay technique — urge surf until it passes.',
    medium: 'Moderate risk. Engage in a physical activity or call a friend now.',
    low: 'Low risk. You\'re doing great — maintain your environment control.',
  };

  return { level, score: riskScore, color, factors, recommendation: recommendations[level] };
}
