'use client';

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';

/** The page-not-found screen, in the interface language. */
export function NotFoundContent() {
  const t = useT();
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <span className="mx-auto w-16 h-16 rounded-[20px] bg-brand-soft text-brand-text ring-1 ring-inset ring-brand/20 flex items-center justify-center" aria-hidden="true"><Compass size={28} /></span>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t('notFound.title')}</h1>
        <p className="text-sm text-ink-2">{t('notFound.body')}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link href="/" className="btn-primary px-4 py-2 text-sm">{t('common.goHome')}</Link>
          <Link href="/contact" className="btn-ghost px-4 py-2 text-sm border border-line-strong bg-surface rounded-xl">{t('nav.contact')}</Link>
        </div>
      </div>
    </main>
  );
}
