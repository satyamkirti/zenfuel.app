'use client';

import { createContext, useContext, ReactNode } from 'react';
import { LogEntry, AppAnalytics, StreakData, Insight, Theme, Habit, Challenge, Goal, HabitAnalytics, DetoxScore } from '@/types';
import { Subscription, PremiumFeature, SubscriptionPlan } from '@/types/subscription';
import { useStorage } from '@/hooks/useStorage';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { usePinLock } from '@/hooks/usePinLock';
import { useSubscription } from '@/hooks/useSubscription';

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
  pinEnabled: boolean;
  autoLockMinutes: number;
  lock: () => void;
  unlock: (pin: string) => boolean;
  enablePin: (pin: string) => void;
  disablePin: () => void;
  updateAutoLock: (minutes: number) => void;
  // Subscription
  subscription: Subscription;
  isPremium: boolean;
  checkFeature: (feature: PremiumFeature) => boolean;
  historyCutoff: Date | null;
  daysLeft: number | null;
  trialDaysLeft: number | null;
  activateDemo: (plan?: SubscriptionPlan) => void;
  startTrial: () => void;
  cancelSubscription: () => void;
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
  const { theme, toggleTheme, setTheme } = useTheme();
  const { isLocked, pinEnabled, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock } = usePinLock();
  const {
    subscription, isPremium, checkFeature, historyCutoff,
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
      isLocked, pinEnabled, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock,
      subscription, isPremium, checkFeature, historyCutoff, daysLeft, trialDaysLeft,
      activateDemo, startTrial, cancelSubscription,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
