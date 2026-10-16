'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogEntry, Habit, Challenge, Goal } from '@/types';
import { storage } from '@/utils/storage';
import { formatDate } from '@/utils/dateUtils';
import { parseBackupText, applyBackup } from '@/utils/backup';

export function useStorage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setEntries(storage.getEntries());
    setHabits(storage.getHabits());
    setChallenges(storage.getChallenges());
    setGoals(storage.getGoals());
    setIsLoaded(true);
  }, []);

  // ── Entries ────────────────────────────────────────────────────────────────
  const logEntry = useCallback(
    (habitId: string, notes?: string, custom?: { date: string; time: string; timestamp: number }) => {
      const entry = storage.addEntry(custom ? { habitId, ...custom, notes } : { habitId, notes });
      setEntries(storage.getEntries());
      return entry;
    }, []
  );

  const updateEntry = useCallback((id: string, updates: Partial<LogEntry>) => {
    const updated = storage.updateEntry(id, updates);
    setEntries(storage.getEntries());
    return updated;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const ok = storage.deleteEntry(id);
    if (ok) setEntries(storage.getEntries());
    return ok;
  }, []);

  // ── Habits ─────────────────────────────────────────────────────────────────
  const addHabit = useCallback((data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => {
    const habit = storage.addHabit(data);
    setHabits(storage.getHabits());
    return habit;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const updated = storage.updateHabit(id, updates);
    setHabits(storage.getHabits());
    return updated;
  }, []);

  const deleteHabit = useCallback((id: string) => {
    const ok = storage.deleteHabit(id);
    if (ok) setHabits(storage.getHabits());
    return ok;
  }, []);

  // ── Challenges ─────────────────────────────────────────────────────────────
  const startChallenge = useCallback((id: string) => {
    // Local calendar date (toISOString would give the UTC date, a day early in India before 5:30 am).
    const now = new Date();
    storage.updateChallenge(id, { isActive: true, startDate: formatDate(now), startedAt: now.getTime(), isCompleted: false });
    setChallenges(storage.getChallenges());
  }, []);

  const stopChallenge = useCallback((id: string) => {
    storage.updateChallenge(id, { isActive: false });
    setChallenges(storage.getChallenges());
  }, []);

  const completeChallenge = useCallback((id: string) => {
    storage.updateChallenge(id, { isActive: false, isCompleted: true });
    setChallenges(storage.getChallenges());
  }, []);

  const addChallenge = useCallback((data: Omit<Challenge, 'id' | 'createdAt'>) => {
    const all = storage.getChallenges();
    const c: Challenge = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    storage.saveChallenges([...all, c]);
    setChallenges(storage.getChallenges());
    return c;
  }, []);

  // ── Goals ──────────────────────────────────────────────────────────────────
  const addGoal = useCallback((data: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal = storage.addGoal(data);
    setGoals(storage.getGoals());
    return goal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    const updated = storage.updateGoal(id, updates);
    setGoals(storage.getGoals());
    return updated;
  }, []);

  const deleteGoal = useCallback((id: string) => {
    const ok = storage.deleteGoal(id);
    if (ok) setGoals(storage.getGoals());
    return ok;
  }, []);

  // ── Backup ─────────────────────────────────────────────────────────────────
  // Validated, all-or-nothing replace. Settings uses the two-step parse/confirm flow instead.
  const importBackup = useCallback((json: string) => {
    const parsed = parseBackupText(json);
    if (!parsed.ok) return { success: false, count: 0 };
    const result = applyBackup(parsed.backup, 'replace');
    if (!result.ok) return { success: false, count: 0 };
    setEntries(storage.getEntries());
    setHabits(storage.getHabits());
    setChallenges(storage.getChallenges());
    setGoals(storage.getGoals());
    return { success: true, count: result.entryCount };
  }, []);

  const clearAll = useCallback(() => {
    storage.clearAll();
    setEntries([]);
    setHabits(storage.getHabits());
    setChallenges(storage.getChallenges());
    setGoals([]);
  }, []);

  return {
    entries, habits, challenges, goals, isLoaded,
    logEntry, updateEntry, deleteEntry,
    addHabit, updateHabit, deleteHabit,
    startChallenge, stopChallenge, completeChallenge, addChallenge,
    addGoal, updateGoal, deleteGoal,
    importBackup, clearAll,
  };
}
