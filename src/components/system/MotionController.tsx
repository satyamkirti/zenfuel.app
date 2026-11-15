'use client';

import { useEffect } from 'react';

/**
 * Pauses every CSS animation while the app is in the background (screen off, another app in
 * front), so decorative motion never uses battery when nobody can see it. See
 * html[data-app-hidden] in globals.css.
 */
export function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      if (document.visibilityState === 'hidden') root.setAttribute('data-app-hidden', '');
      else root.removeAttribute('data-app-hidden');
    };
    const pause = () => root.setAttribute('data-app-hidden', '');
    sync();
    document.addEventListener('visibilitychange', sync);
    // Capacitor also fires these on the document when the Android activity pauses and resumes.
    document.addEventListener('pause', pause);
    document.addEventListener('resume', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      document.removeEventListener('pause', pause);
      document.removeEventListener('resume', sync);
    };
  }, []);
  return null;
}
