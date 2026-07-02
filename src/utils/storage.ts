import { LogEntry, AppSettings, Habit, Challenge, Goal } from '@/types';
import { formatDate, formatTime } from './dateUtils';

const KEYS = {
  ENTRIES: 'mt_entries',
  SETTINGS: 'mt_settings',
  LAST_ACTIVE: 'mt_last_active',
  HABITS: 'ddt_habits',
  CHALLENGES: 'ddt_challenges',
  GOALS: 'ddt_goals',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  pinEnabled: false,
  pinHash: '',
  autoLockMinutes: 5,
  hiddenMode: false,
  hiddenTitle: 'Habit Tracker',
};

export const DEFAULT_HABITS: Habit[] = [
  { id: 'social-media', name: 'Social Media', icon: '📱', color: '#3b82f6', category: 'digital', isDefault: true, createdAt: 0 },
  { id: 'porn', name: 'Porn', icon: '🔞', color: '#ef4444', category: 'adult', isDefault: true, createdAt: 0 },
  { id: 'masturbation', name: 'Masturbation', icon: '✋', color: '#8b5cf6', category: 'adult', isDefault: true, createdAt: 0 },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#10b981', category: 'digital', isDefault: true, createdAt: 0 },
  { id: 'short-videos', name: 'Short Videos', icon: '📹', color: '#f59e0b', category: 'digital', isDefault: true, createdAt: 0 },
  { id: 'junk-food', name: 'Junk Food', icon: '🍔', color: '#f97316', category: 'food', isDefault: true, createdAt: 0 },
  { id: 'smoking', name: 'Smoking', icon: '🚬', color: '#94a3b8', category: 'substance', isDefault: true, createdAt: 0 },
  { id: 'alcohol', name: 'Alcohol', icon: '🍺', color: '#84cc16', category: 'substance', isDefault: true, createdAt: 0 },
];

export const BUILT_IN_CHALLENGES: Challenge[] = [
  { id: 'no-social-7', name: 'Social Media Detox', description: 'Go 7 days without social media', habitId: 'social-media', durationDays: 7, startDate: null, isActive: false, isCompleted: false, isBuiltIn: true, createdAt: 0 },
  { id: 'no-porn-30', name: 'Porn-Free Month', description: 'Stay porn-free for 30 days', habitId: 'porn', durationDays: 30, startDate: null, isActive: false, isCompleted: false, isBuiltIn: true, createdAt: 0 },
  { id: 'no-gaming-7', name: 'Gaming Detox', description: 'No gaming for 7 days', habitId: 'gaming', durationDays: 7, startDate: null, isActive: false, isCompleted: false, isBuiltIn: true, createdAt: 0 },
  { id: 'no-reels-7', name: 'No Short Videos', description: '7 days without reels, shorts, or TikTok', habitId: 'short-videos', durationDays: 7, startDate: null, isActive: false, isCompleted: false, isBuiltIn: true, createdAt: 0 },
  { id: 'dopamine-reset-30', name: '30-Day Dopamine Reset', description: 'Minimize all dopamine triggers for 30 days', habitId: 'all', durationDays: 30, startDate: null, isActive: false, isCompleted: false, isBuiltIn: true, createdAt: 0 },
];

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function migrateEntries(entries: LogEntry[]): LogEntry[] {
  return entries.map(e => ({
    ...e,
    habitId: (e as LogEntry & { habitId?: string }).habitId ?? 'masturbation',
  }));
}

export const storage = {
  // ── Entries ──────────────────────────────────────────────────────────────
  getEntries(): LogEntry[] {
    return migrateEntries(safeRead<LogEntry[]>(KEYS.ENTRIES, []));
  },
  saveEntries(entries: LogEntry[]): void {
    safeWrite(KEYS.ENTRIES, [...entries].sort((a, b) => b.timestamp - a.timestamp));
  },
  addEntry(data: { habitId: string; date?: string; time?: string; timestamp?: number; notes?: string }): LogEntry {
    const now = new Date();
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      habitId: data.habitId,
      date: data.date ?? formatDate(now),
      time: data.time ?? formatTime(now),
      timestamp: data.timestamp ?? now.getTime(),
      notes: data.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const entries = storage.getEntries();
    entries.push(entry);
    storage.saveEntries(entries);
    return entry;
  },
  updateEntry(id: string, updates: Partial<Omit<LogEntry, 'id' | 'createdAt'>>): LogEntry | null {
    const entries = storage.getEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    storage.saveEntries(entries);
    return entries[idx];
  },
  deleteEntry(id: string): boolean {
    const entries = storage.getEntries();
    const next = entries.filter(e => e.id !== id);
    if (next.length === entries.length) return false;
    storage.saveEntries(next);
    return true;
  },

  // ── Habits ───────────────────────────────────────────────────────────────
  getHabits(): Habit[] {
    const stored = safeRead<Habit[]>(KEYS.HABITS, []);
    if (stored.length === 0) return [...DEFAULT_HABITS];
    const storedIds = new Set(stored.map(h => h.id));
    const missing = DEFAULT_HABITS.filter(h => !storedIds.has(h.id));
    return [...missing, ...stored];
  },
  saveHabits(habits: Habit[]): void {
    safeWrite(KEYS.HABITS, habits);
  },
  addHabit(data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>): Habit {
    const habits = storage.getHabits();
    const habit: Habit = { ...data, id: crypto.randomUUID(), isDefault: false, createdAt: Date.now() };
    storage.saveHabits([...habits, habit]);
    return habit;
  },
  updateHabit(id: string, updates: Partial<Habit>): Habit | null {
    const habits = storage.getHabits();
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return null;
    habits[idx] = { ...habits[idx], ...updates };
    storage.saveHabits(habits);
    return habits[idx];
  },
  deleteHabit(id: string): boolean {
    const habits = storage.getHabits();
    const h = habits.find(x => x.id === id);
    if (!h || h.isDefault) return false;
    storage.saveHabits(habits.filter(x => x.id !== id));
    return true;
  },

  // ── Challenges ───────────────────────────────────────────────────────────
  getChallenges(): Challenge[] {
    const stored = safeRead<Challenge[]>(KEYS.CHALLENGES, []);
    const storedIds = new Set(stored.map(c => c.id));
    const missing = BUILT_IN_CHALLENGES.filter(c => !storedIds.has(c.id));
    return [...missing, ...stored];
  },
  saveChallenges(challenges: Challenge[]): void {
    safeWrite(KEYS.CHALLENGES, challenges);
  },
  updateChallenge(id: string, updates: Partial<Challenge>): Challenge | null {
    const challenges = storage.getChallenges();
    const idx = challenges.findIndex(c => c.id === id);
    if (idx === -1) return null;
    challenges[idx] = { ...challenges[idx], ...updates };
    storage.saveChallenges(challenges);
    return challenges[idx];
  },

  // ── Goals ────────────────────────────────────────────────────────────────
  getGoals(): Goal[] { return safeRead<Goal[]>(KEYS.GOALS, []); },
  saveGoals(goals: Goal[]): void { safeWrite(KEYS.GOALS, goals); },
  addGoal(data: Omit<Goal, 'id' | 'createdAt'>): Goal {
    const goals = storage.getGoals();
    const goal: Goal = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    storage.saveGoals([...goals, goal]);
    return goal;
  },
  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    const goals = storage.getGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    goals[idx] = { ...goals[idx], ...updates };
    storage.saveGoals(goals);
    return goals[idx];
  },
  deleteGoal(id: string): boolean {
    const goals = storage.getGoals();
    const next = goals.filter(g => g.id !== id);
    if (next.length === goals.length) return false;
    storage.saveGoals(next);
    return true;
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...safeRead<Partial<AppSettings>>(KEYS.SETTINGS, {}) };
  },
  saveSettings(updates: Partial<AppSettings>): void {
    safeWrite(KEYS.SETTINGS, { ...storage.getSettings(), ...updates });
  },

  // ── Activity ─────────────────────────────────────────────────────────────
  getLastActive(): number { return safeRead<number>(KEYS.LAST_ACTIVE, Date.now()); },
  touchLastActive(): void { safeWrite(KEYS.LAST_ACTIVE, Date.now()); },

  // ── Backup ───────────────────────────────────────────────────────────────
  exportBackup(): string {
    return JSON.stringify({
      version: 2,
      app: 'Dopamine Detox Tracker',
      exportedAt: new Date().toISOString(),
      entries: storage.getEntries(),
      habits: storage.getHabits(),
      challenges: storage.getChallenges(),
      goals: storage.getGoals(),
      settings: storage.getSettings(),
    }, null, 2);
  },
  importBackup(json: string): { success: boolean; count: number } {
    try {
      const data = JSON.parse(json) as {
        entries?: LogEntry[];
        habits?: Habit[];
        challenges?: Challenge[];
        goals?: Goal[];
        settings?: Partial<AppSettings>;
      };
      if (!Array.isArray(data.entries)) return { success: false, count: 0 };
      storage.saveEntries(migrateEntries(data.entries));
      if (data.habits) storage.saveHabits(data.habits);
      if (data.challenges) storage.saveChallenges(data.challenges);
      if (data.goals) storage.saveGoals(data.goals);
      if (data.settings) storage.saveSettings(data.settings);
      return { success: true, count: data.entries.length };
    } catch { return { success: false, count: 0 }; }
  },
  clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
