'use client';

// Hidden Mode: a display-only privacy layer.
//
// - Discreet identity: the in-app brand, page title and tab icon switch to a neutral title.
// - Masking: habit names/icons, notes, goal and challenge names, and generated insight text
//   are replaced with neutral placeholders wherever they are rendered.
//
// Nothing here ever writes masked values to storage. Components keep working with the real
// records and only pass display strings through these helpers.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Habit, Goal, Challenge } from '@/types';
import { storage } from '@/utils/storage';

export const DEFAULT_HIDDEN_TITLE = 'Personal Space';
export const MASK_ICON = '🔒';
export const HIDDEN_NOTE = 'Note hidden';
// A temporary reveal ends by itself so private details are not left on screen.
const REVEAL_MS = 2 * 60_000;
// Neutral tab icon used while Hidden Mode is on (grey rounded square).
const NEUTRAL_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2364748b'/%3E%3C/svg%3E";
const DEFAULT_TITLE = 'ZenFuel — Screen Time & Habit Tracker';

type HabitRef = Pick<Habit, 'id' | 'name' | 'icon'> | undefined | null;

interface PrivacyValue {
  /** The saved Hidden Mode preference. Controls discreet identity. */
  hiddenMode: boolean;
  /** Neutral title shown instead of ZenFuel while Hidden Mode is on. */
  hiddenTitle: string;
  /** The raw saved title, for the settings field. */
  storedHiddenTitle: string;
  /** True while private details are temporarily shown. */
  revealed: boolean;
  /** True when content should be masked (Hidden Mode on and not revealed). */
  masked: boolean;
  setHiddenMode: (on: boolean) => void;
  setHiddenTitle: (title: string) => void;
  reveal: () => void;
  conceal: () => void;
  /** App name for headings: ZenFuel, or the neutral title in Hidden Mode. */
  appName: string;
  /** Picks the normal or neutral wording depending on Hidden Mode. */
  discreet: (normal: string, neutral: string) => string;
  habitName: (habit: HabitRef, fallbackId?: string) => string;
  habitIcon: (habit: HabitRef) => string;
  note: (text: string | undefined) => string | undefined;
  goalName: (goal: Pick<Goal, 'name'>) => string;
  challengeName: (challenge: Pick<Challenge, 'name'>) => string;
  challengeDescription: (challenge: Pick<Challenge, 'description'>) => string;
  /** Masks habit names/icons (and the brand in Hidden Mode) inside generated text. */
  maskText: (text: string) => string;
}

const PrivacyContext = createContext<PrivacyValue | null>(null);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function PrivacyProvider({ habits, children }: { habits: Habit[]; children: ReactNode }) {
  // Read after mount so the server render and the first client render match.
  const [hiddenMode, setHiddenModeState] = useState(false);
  const [storedHiddenTitle, setStoredHiddenTitle] = useState('');
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeTitle = useRef<string | null>(null);

  useEffect(() => {
    const read = () => {
      const s = storage.getSettings();
      setHiddenModeState(!!s.hiddenMode);
      setStoredHiddenTitle(s.hiddenTitle ?? '');
    };
    read();
    // Keep other open tabs in sync.
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === 'mt_settings') read(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hiddenTitle = storedHiddenTitle.trim() || DEFAULT_HIDDEN_TITLE;

  const conceal = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
    setRevealed(false);
  }, []);

  const reveal = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setRevealed(false), REVEAL_MS);
    setRevealed(true);
  }, []);

  // Re-hide when the app goes to the background.
  useEffect(() => {
    if (!revealed) return;
    const onHide = () => { if (document.visibilityState === 'hidden') conceal(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [revealed, conceal]);

  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  const setHiddenMode = useCallback((on: boolean) => {
    storage.saveSettings({ hiddenMode: on });
    setHiddenModeState(on);
    conceal();
  }, [conceal]);

  const setHiddenTitle = useCallback((title: string) => {
    const value = title.slice(0, 40);
    storage.saveSettings({ hiddenTitle: value });
    setStoredHiddenTitle(value);
  }, []);

  // ── Discreet identity: page title, tab icon and the html flag used by CSS ──────────
  useEffect(() => {
    const root = document.documentElement;
    const icons = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"]'));

    if (!hiddenMode) {
      root.removeAttribute('data-discreet');
      icons().forEach(link => {
        if (link.dataset.originalHref) { link.href = link.dataset.originalHref; delete link.dataset.originalHref; }
      });
      if (document.title === hiddenTitle || document.title === DEFAULT_HIDDEN_TITLE) {
        document.title = routeTitle.current ?? DEFAULT_TITLE;
      }
      // Remember the title Next.js sets on navigation so it can be restored later.
      const remember = new MutationObserver(() => { routeTitle.current = document.title; });
      remember.observe(document.head, { subtree: true, childList: true, characterData: true });
      routeTitle.current = document.title;
      return () => remember.disconnect();
    }

    root.setAttribute('data-discreet', '');
    const apply = () => {
      if (document.title !== hiddenTitle) {
        routeTitle.current = document.title;
        document.title = hiddenTitle;
      }
      icons().forEach(link => {
        if (!link.dataset.originalHref) link.dataset.originalHref = link.getAttribute('href') ?? '';
        if (link.getAttribute('href') !== NEUTRAL_ICON) link.setAttribute('href', NEUTRAL_ICON);
      });
    };
    apply();
    // Next.js rewrites <title> on client navigation; put the neutral title back.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['href'] });
    return () => observer.disconnect();
  }, [hiddenMode, hiddenTitle]);

  const masked = hiddenMode && !revealed;

  const habitIndex = useMemo(() => new Map(habits.map((h, i) => [h.id, i + 1])), [habits]);

  const habitName = useCallback((habit: HabitRef, fallbackId?: string) => {
    const id = habit?.id ?? fallbackId;
    if (masked) {
      const n = id ? habitIndex.get(id) : undefined;
      return n ? `Private habit ${n}` : 'Private habit';
    }
    return habit?.name ?? fallbackId ?? 'Unknown habit';
  }, [masked, habitIndex]);

  const habitIcon = useCallback((habit: HabitRef) => (masked ? MASK_ICON : habit?.icon ?? '•'), [masked]);

  const note = useCallback((text: string | undefined) => (masked && text ? HIDDEN_NOTE : text), [masked]);
  const goalName = useCallback((goal: Pick<Goal, 'name'>) => (masked ? 'Personal goal' : goal.name), [masked]);
  const challengeName = useCallback((c: Pick<Challenge, 'name'>) => (masked ? 'Personal challenge' : c.name), [masked]);
  const challengeDescription = useCallback((c: Pick<Challenge, 'description'>) => (masked ? 'Details hidden' : c.description), [masked]);

  const habitPatterns = useMemo(() => {
    // Longest names first so "Short Videos" is replaced before "Videos".
    return [...habits]
      .filter(h => h.name.trim())
      .sort((a, b) => b.name.length - a.name.length)
      .map(h => ({
        re: new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(h.name.trim())})(?=[^\\p{L}\\p{N}]|$)`, 'giu'),
        label: `Private habit ${habitIndex.get(h.id)}`,
        icon: h.icon,
      }));
  }, [habits, habitIndex]);

  const maskText = useCallback((text: string) => {
    let out = text;
    if (masked) {
      for (const p of habitPatterns) {
        out = out.replace(p.re, (_m, pre: string) => `${pre}${p.label}`);
        if (p.icon && !/^[\w\s]*$/.test(p.icon)) out = out.split(p.icon).join(MASK_ICON);
      }
    }
    if (hiddenMode) out = out.replace(/ZenFuel/g, 'this app');
    return out;
  }, [masked, hiddenMode, habitPatterns]);

  const discreet = useCallback((normal: string, neutral: string) => (hiddenMode ? neutral : normal), [hiddenMode]);

  const value = useMemo<PrivacyValue>(() => ({
    hiddenMode, hiddenTitle, storedHiddenTitle, revealed, masked,
    setHiddenMode, setHiddenTitle, reveal, conceal,
    appName: hiddenMode ? hiddenTitle : 'ZenFuel',
    discreet, habitName, habitIcon, note, goalName, challengeName, challengeDescription, maskText,
  }), [hiddenMode, hiddenTitle, storedHiddenTitle, revealed, masked, setHiddenMode, setHiddenTitle, reveal, conceal,
    discreet, habitName, habitIcon, note, goalName, challengeName, challengeDescription, maskText]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
  return ctx;
}
