'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';

// Shown when a page throws while rendering. Stored data is not touched.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div role="alert" className="max-w-sm text-center space-y-4">
        <span className="mx-auto w-16 h-16 rounded-[20px] bg-amber-50 text-amber-700 dark:bg-amber-400/[0.14] dark:text-amber-300 ring-1 ring-inset ring-amber-400/20 flex items-center justify-center" aria-hidden="true"><TriangleAlert size={28} /></span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('error.title')}</h1>
        <p className="text-sm text-ink-2">{t('error.body')}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button onClick={reset} className="btn-primary px-4 py-2 text-sm">{t('common.tryAgain')}</button>
          <Link href="/" className="btn-ghost px-4 py-2 text-sm border border-line-strong bg-surface rounded-xl">{t('common.goHome')}</Link>
        </div>
      </div>
    </main>
  );
}
