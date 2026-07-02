'use client';

import { useState, useEffect } from 'react';
import { Theme } from '@/types';
import { storage } from '@/utils/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const t = storage.getSettings().theme;
    setThemeState(t);
    applyTheme(t);
  }, []);

  function applyTheme(t: Theme) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  const setTheme = (t: Theme) => {
    setThemeState(t);
    storage.saveSettings({ theme: t });
    applyTheme(t);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggleTheme };
}
