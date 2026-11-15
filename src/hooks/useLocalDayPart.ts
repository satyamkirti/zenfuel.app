'use client';

import { useEffect, useState } from 'react';
import { msUntilNextDayPart, sameDayPart } from '@/lib/home/dayPart';

/**
 * The device's local time, refreshed only when the hero's date, greeting or sky would change:
 * when Home opens, when the app returns to the foreground, and once at the next change while it
 * stays open. A single timeout (cleared in the background), never a ticking timer.
 */
export function useLocalDayPart(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { if (timer) clearTimeout(timer); timer = undefined; };
    const refresh = () => {
      stop();
      if (document.visibilityState === 'hidden') return;
      const d = new Date();
      setNow(prev => (sameDayPart(prev, d) ? prev : d));
      // A moment past the boundary, so the new hour is certain when it fires.
      timer = setTimeout(refresh, msUntilNextDayPart(d) + 250);
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : refresh());
    refresh();
    document.addEventListener('visibilitychange', onVisibility);
    // Capacitor also fires these on the document when the Android activity pauses and resumes.
    document.addEventListener('pause', stop);
    document.addEventListener('resume', refresh);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pause', stop);
      document.removeEventListener('resume', refresh);
    };
  }, []);
  return now;
}
