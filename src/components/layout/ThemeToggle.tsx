'use client';

import { Sun, Moon } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost p-2 rounded-lg flex items-center gap-2 text-sm"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      <span className="text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
