'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage, PIN_ATTEMPTS_KEY } from '@/utils/storage';

// The PIN lock hides the app from casual access on a shared device. It does not encrypt
// anything: the data stays readable in browser storage.

function simpleHash(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 33) ^ pin.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

// Failed-attempt throttling. Stored locally so a reload does not reset it.
const FREE_ATTEMPTS = 5;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;

interface Attempts { count: number; lockedUntil: number }

function readAttempts(): Attempts {
  try {
    const raw = localStorage.getItem(PIN_ATTEMPTS_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (v && typeof v.count === 'number' && typeof v.lockedUntil === 'number') return v;
  } catch {}
  return { count: 0, lockedUntil: 0 };
}

function writeAttempts(a: Attempts | null): void {
  try {
    if (a) localStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify(a));
    else localStorage.removeItem(PIN_ATTEMPTS_KEY);
  } catch {}
}

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsBeforeDelay: number; retryAt: number | null }
  | { ok: false; reason: 'throttled'; retryAt: number };

export function getPinThrottle(): number | null {
  const { lockedUntil } = readAttempts();
  return lockedUntil > Date.now() ? lockedUntil : null;
}

export function usePinLock() {
  const [isLocked, setIsLocked] = useState(false);
  // False until the saved settings have been checked, so protected screens never render first.
  const [lockReady, setLockReady] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinLength, setPinLength] = useState<number | null>(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const lockedRef = useRef(false);

  // Every lock is recorded in storage, so reloading the page cannot skip the PIN.
  const applyLock = useCallback(() => {
    lockedRef.current = true;
    storage.markLocked();
    setIsLocked(true);
  }, []);

  useEffect(() => {
    const s = storage.getSettings();
    setPinEnabled(s.pinEnabled);
    setPinLength(s.pinLength ?? null);
    setAutoLockMinutes(s.autoLockMinutes);
    if (s.pinEnabled) {
      const idle = Date.now() - storage.getLastActive();
      if (idle > s.autoLockMinutes * 60_000) applyLock();
    }
    setLockReady(true);
  }, [applyLock]);

  useEffect(() => {
    if (!pinEnabled) return;
    // Input on the lock screen is not activity; otherwise a reload after tapping digits would unlock.
    const onActivity = () => { if (!lockedRef.current) storage.touchLastActive(); };
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    const timer = setInterval(() => {
      const idle = Date.now() - storage.getLastActive();
      if (!lockedRef.current && idle > autoLockMinutes * 60_000) applyLock();
    }, 30_000);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearInterval(timer);
    };
  }, [pinEnabled, autoLockMinutes, applyLock]);

  /**
   * Checks a PIN. A `silent` check (used while typing a PIN of unknown length) never counts
   * as a failed attempt.
   */
  const unlock = useCallback((pin: string, opts: { silent?: boolean } = {}): UnlockResult => {
    const attempts = readAttempts();
    if (attempts.lockedUntil > Date.now()) return { ok: false, reason: 'throttled', retryAt: attempts.lockedUntil };

    const s = storage.getSettings();
    if (simpleHash(pin) === s.pinHash) {
      writeAttempts(null);
      lockedRef.current = false;
      setIsLocked(false);
      storage.touchLastActive();
      return { ok: true };
    }
    if (opts.silent) return { ok: false, reason: 'wrong', attemptsBeforeDelay: Math.max(0, FREE_ATTEMPTS - attempts.count), retryAt: null };

    const count = attempts.count + 1;
    let lockedUntil = 0;
    if (count >= FREE_ATTEMPTS) {
      const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (count - FREE_ATTEMPTS));
      lockedUntil = Date.now() + delay;
    }
    writeAttempts({ count, lockedUntil });
    return { ok: false, reason: 'wrong', attemptsBeforeDelay: Math.max(0, FREE_ATTEMPTS - count), retryAt: lockedUntil || null };
  }, []);

  const enablePin = useCallback((pin: string) => {
    storage.saveSettings({ pinEnabled: true, pinHash: simpleHash(pin), pinLength: pin.length });
    writeAttempts(null);
    setPinEnabled(true);
    setPinLength(pin.length);
  }, []);

  const disablePin = useCallback(() => {
    storage.saveSettings({ pinEnabled: false, pinHash: '', pinLength: undefined });
    writeAttempts(null);
    setPinEnabled(false);
    setPinLength(null);
    lockedRef.current = false;
    setIsLocked(false);
  }, []);

  const updateAutoLock = useCallback((minutes: number) => {
    storage.saveSettings({ autoLockMinutes: minutes });
    setAutoLockMinutes(minutes);
  }, []);

  const lock = useCallback(() => {
    if (pinEnabled) applyLock();
  }, [pinEnabled, applyLock]);

  return { isLocked, lockReady, pinEnabled, pinLength, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock };
}
