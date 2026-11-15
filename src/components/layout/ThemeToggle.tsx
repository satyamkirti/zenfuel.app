'use client';

import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/I18nProvider';

export function ThemeToggle({ onDark }: { onDark?: boolean }) {
  const { theme, toggleTheme } = useApp();
  const t = useT();
  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'px-2.5 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors',
        onDark ? 'text-blue-100/80 hover:text-white hover:bg-white/10' : 'btn-ghost'
      )}
      aria-label={t('common.toggleTheme')}
    >
      {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
      <span className="text-xs font-medium">{theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}</span>
    </button>
  );
}
