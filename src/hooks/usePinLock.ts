'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/storage';

function simpleHash(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 33) ^ pin.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function usePinLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);

  useEffect(() => {
    const s = storage.getSettings();
    setPinEnabled(s.pinEnabled);
    setAutoLockMinutes(s.autoLockMinutes);
    if (s.pinEnabled) {
      const idle = Date.now() - storage.getLastActive();
      if (idle > s.autoLockMinutes * 60_000) setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    if (!pinEnabled) return;
    const onActivity = () => storage.touchLastActive();
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    const timer = setInterval(() => {
      const idle = Date.now() - storage.getLastActive();
      if (idle > autoLockMinutes * 60_000) setIsLocked(true);
    }, 30_000);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearInterval(timer);
    };
  }, [pinEnabled, autoLockMinutes]);

  const unlock = useCallback((pin: string): boolean => {
    const s = storage.getSettings();
    if (simpleHash(pin) === s.pinHash) {
      setIsLocked(false);
      storage.touchLastActive();
      return true;
    }
    return false;
  }, []);

  const enablePin = useCallback((pin: string) => {
    storage.saveSettings({ pinEnabled: true, pinHash: simpleHash(pin) });
    setPinEnabled(true);
  }, []);

  const disablePin = useCallback(() => {
    storage.saveSettings({ pinEnabled: false, pinHash: '' });
    setPinEnabled(false);
    setIsLocked(false);
  }, []);

  const updateAutoLock = useCallback((minutes: number) => {
    storage.saveSettings({ autoLockMinutes: minutes });
    setAutoLockMinutes(minutes);
  }, []);

  const lock = useCallback(() => {
    if (pinEnabled) setIsLocked(true);
  }, [pinEnabled]);

  return { isLocked, pinEnabled, autoLockMinutes, lock, unlock, enablePin, disablePin, updateAutoLock };
}
