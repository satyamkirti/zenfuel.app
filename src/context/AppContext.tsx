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

interface AppContextType {
  // Data
  entries: LogEntry[];
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
  importBackup: (json: string) => { success: boolean; count: number };
  clearAll: () => void;
  // Habit actions
  addHabit: (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => Habit | null;
  deleteHabit: (id: string) => boolean;
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
    logEntry, updateEntry, deleteEntry,
    addHabit, updateHabit, deleteHabit,
    startChallenge, stopChallenge, completeChallenge, addChallenge,
    addGoal, updateGoal, deleteGoal,
    importBackup, clearAll,
  } = useStorage();

  const { analytics, habitAnalytics, streaks, detoxScore, insights } = useAnalytics(entries, habits);
  const riskAssessment = useMemo(
    () => calculateRisk(detoxScore.score, entries, streaks.currentStreak),
    [detoxScore.score, entries, streaks.currentStreak]
  );
  const { theme, toggleTheme, setTheme } = useTheme();
  const { isLocked, lockReady, pinEnabled, pinLength, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock } = usePinLock();
  const {
    subscription, legacyDemoEnded, isPremium, checkFeature, historyCutoff,
    daysLeft, trialDaysLeft, activateDemo, startTrial, cancel: cancelSubscription,
  } = useSubscription();

  return (
    <AppContext.Provider value={{
      entries, habits, challenges, goals, isLoaded,
      analytics, habitAnalytics, streaks, detoxScore, insights,
      logEntry, updateEntry, deleteEntry, importBackup, clearAll,
      addHabit, updateHabit, deleteHabit,
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
      </PrivacyProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
