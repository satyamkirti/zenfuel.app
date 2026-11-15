'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { LogEntry, AppAnalytics, StreakData, Insight, Theme, Habit, Challenge, Goal, HabitAnalytics, DetoxScore } from '@/types';
import { Subscription, PremiumFeature, SubscriptionPlan } from '@/types/subscription';
import { useStorage } from '@/hooks/useStorage';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { usePinLock, UnlockResult } from '@/hooks/usePinLock';
import { useSubscription } from '@/hooks/useSubscription';
import { calculateRisk, RiskAssessment } from '@/lib/risk-calculator';
import { PrivacyProvider } from '@/context/PrivacyContext';
import { NotificationScheduler } from '@/components/system/NotificationScheduler';
import { UsageConfigSync } from '@/components/system/UsageConfigSync';
import { useI18n } from '@/i18n/I18nProvider';
import { isBuildHabit } from '@/lib/habits/templates';

interface AppContextType {
  // Data
  entries: LogEntry[];
  /**
   * Entries for the habits being reduced (good habits left out). The detox score, streaks of
   * clear days, risk, challenges and the reduction analytics are all based on these, so tracking
   * a good habit (a walk, a glass of water) never counts against the person.
   */
  reductionEntries: LogEntry[];
  habits: Habit[];
  challenges: Challenge[];
  goals: Goal[];
  isLoaded: boolean;
  // Analytics
  analytics: AppAnalytics;
  habitAnalytics: HabitAnalytics[];
  streaks: StreakData;
  detoxScore: DetoxScore;
  insights: Insight[];
  // Entry actions
  logEntry: (habitId: string, notes?: string, custom?: { date: string; time: string; timestamp: number }) => LogEntry;
  updateEntry: (id: string, updates: Partial<LogEntry>) => LogEntry | null;
  deleteEntry: (id: string) => boolean;
  /** Logs several habits in one save (same moment and note for all); null if nothing was saved. */
  logEntries: (habitIds: string[], notes: string | undefined, moment: { date: string; time: string; timestamp: number }) => LogEntry[] | null;
  /** Removes several entries in one save (undoing a batch); returns how many were removed. */
  deleteEntries: (ids: string[]) => number;
  importBackup: (json: string) => { success: boolean; count: number };
  clearAll: () => void;
  // Habit actions
  addHabit: (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => Habit | null;
  deleteHabit: (id: string) => boolean;
  /** Saves the person's own habit order (every habit id, top to bottom). */
  reorderHabits: (ids: string[]) => boolean;
  /** Adds several habits in one save (Good Habit Templates); returns the new habits. */
  addHabits: (items: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>[]) => Habit[];
  // Challenge actions
  startChallenge: (id: string) => void;
  stopChallenge: (id: string) => void;
  completeChallenge: (id: string) => void;
  addChallenge: (data: Omit<Challenge, 'id' | 'createdAt'>) => Challenge;
  // Goal actions
  addGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => Goal | null;
  deleteGoal: (id: string) => boolean;
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  // PIN Lock
  isLocked: boolean;
  /** False until the PIN setting has been read; protected screens wait for it. */
  lockReady: boolean;
  pinEnabled: boolean;
  pinLength: number | null;
  autoLockMinutes: number;
  lock: () => void;
  unlock: (pin: string, opts?: { silent?: boolean }) => UnlockResult;
  enablePin: (pin: string) => void;
  disablePin: () => void;
  updateAutoLock: (minutes: number) => void;
  // Subscription
  subscription: Subscription;
  legacyDemoEnded: boolean;
  /** Full feature access. Always true during the Free Beta. */
  isPremium: boolean;
  checkFeature: (feature: PremiumFeature) => boolean;
  historyCutoff: Date | null;
  daysLeft: number | null;
  trialDaysLeft: number | null;
  activateDemo: (plan?: SubscriptionPlan) => void;
  startTrial: () => void;
  cancelSubscription: () => void;
  // Risk
  riskAssessment: RiskAssessment;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    entries, habits, challenges, goals, isLoaded,
    logEntry, updateEntry, deleteEntry, logEntries, deleteEntries,
    addHabit, addHabits, updateHabit, deleteHabit, reorderHabits,
    startChallenge, stopChallenge, completeChallenge, addChallenge,
    addGoal, updateGoal, deleteGoal,
    importBackup, clearAll,
  } = useStorage();
  const { locale } = useI18n();

  // Habits being reduced, and only their entries, for the reduction metrics.
  const reductionHabits = useMemo(() => habits.filter(h => !isBuildHabit(h)), [habits]);
  const reductionEntries = useMemo(() => {
    const build = new Set(habits.filter(isBuildHabit).map(h => h.id));
    return build.size === 0 ? entries : entries.filter(e => !build.has(e.habitId));
  }, [entries, habits]);

  const { analytics, habitAnalytics, streaks, detoxScore, insights } = useAnalytics(reductionEntries, reductionHabits, locale);
  const riskAssessment = useMemo(
    () => calculateRisk(detoxScore.score, reductionEntries, streaks.currentStreak),
    // locale: the assessment's wording is generated in the interface language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detoxScore.score, reductionEntries, streaks.currentStreak, locale]
  );
  const { theme, toggleTheme, setTheme } = useTheme();
  const { isLocked, lockReady, pinEnabled, pinLength, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock } = usePinLock();
  const {
    subscription, legacyDemoEnded, isPremium, checkFeature, historyCutoff,
    daysLeft, trialDaysLeft, activateDemo, startTrial, cancel: cancelSubscription,
  } = useSubscription();

  return (
    <AppContext.Provider value={{
      entries, reductionEntries, habits, challenges, goals, isLoaded,
      analytics, habitAnalytics, streaks, detoxScore, insights,
      logEntry, updateEntry, deleteEntry, logEntries, deleteEntries, importBackup, clearAll,
      addHabit, addHabits, updateHabit, deleteHabit, reorderHabits,
      startChallenge, stopChallenge, completeChallenge, addChallenge,
      addGoal, updateGoal, deleteGoal,
      theme, toggleTheme, setTheme,
      isLocked, lockReady, pinEnabled, pinLength, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock,
      subscription, legacyDemoEnded, isPremium, checkFeature, historyCutoff, daysLeft, trialDaysLeft,
      activateDemo, startTrial, cancelSubscription,
      riskAssessment,
    }}>
      <PrivacyProvider habits={habits}>
        {children}
        <NotificationScheduler />
        <UsageConfigSync />
      </PrivacyProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
