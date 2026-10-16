'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import {
  getNotificationPrefs, getPermissionStatus, registerNotificationWorker, scheduleInSessionNotifications,
  clearScheduledNotifications, PREFS_CHANGED_EVENT, PREFS_KEY, ReminderContext,
} from '@/lib/notifications';

// Schedules reminders whenever the app is open (not only after a setting changes) and
// reschedules when preferences change in this or another tab.
export function NotificationScheduler() {
  const { detoxScore, streaks, isLoaded } = useApp();
  const { hiddenMode, hiddenTitle } = usePrivacy();
  const context = useRef<ReminderContext>({ detoxScore: 0, streakDays: 0, discreet: false, discreetTitle: hiddenTitle });

  useEffect(() => {
    context.current = { detoxScore: detoxScore.score, streakDays: streaks.currentStreak, discreet: hiddenMode, discreetTitle: hiddenTitle };
  }, [detoxScore.score, streaks.currentStreak, hiddenMode, hiddenTitle]);

  useEffect(() => {
    if (!isLoaded) return;
    const run = () => {
      const prefs = getNotificationPrefs();
      if (prefs.enabled && getPermissionStatus() === 'granted') {
        void registerNotificationWorker();
        scheduleInSessionNotifications(prefs, () => context.current);
      } else {
        clearScheduledNotifications();
      }
    };
    run();
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === PREFS_KEY) run(); };
    window.addEventListener(PREFS_CHANGED_EVENT, run);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PREFS_CHANGED_EVENT, run);
      window.removeEventListener('storage', onStorage);
      clearScheduledNotifications();
    };
  }, [isLoaded]);

  return null;
}
