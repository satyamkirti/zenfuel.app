'use client';

import Link from 'next/link';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { HeroArtwork } from '@/components/dashboard/DashboardHero';
import { useT } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';

// Only features that exist in the app today.
const INCLUDED: MessageKey[] = ['beta.item1', 'beta.item2', 'beta.item3', 'beta.item4', 'beta.item5', 'beta.item6', 'beta.item7'];

/** The Free Beta page: everything in ZenFuel is free during the beta. */
export function FreeBetaInfo() {
  const t = useT();
  return (
    <AppLayout title={t('beta.title')}>
      <div className="space-y-4 max-w-2xl">
        <div className="surface-hero p-6 sm:p-8">
          <HeroArtwork className="opacity-40" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 ring-1 ring-white/25 text-white px-2.5 py-1 text-xs font-semibold">
              <Sparkles size={13} aria-hidden="true" /> {t('beta.badge')}
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white">{t('beta.heading')}</h1>
            <p className="mt-2 text-sm text-blue-50/85 leading-relaxed max-w-xl">{t('beta.sub')}</p>
          </div>
        </div>

        <Card>
          <p className="text-sm text-ink-2 leading-relaxed">{t('beta.body')}</p>
        </Card>

        <Card>
          <h2 className="font-semibold text-ink mb-3">{t('beta.included')}</h2>
          <ul className="space-y-2.5">
            {INCLUDED.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{t(item)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="text-sm text-ink-2 leading-relaxed">
            {t('beta.privacyBefore')}{' '}
            <Link href="/privacy" className="text-brand-text hover:underline">{t('beta.privacyLink')}</Link>{' '}
            {t('beta.privacyMiddle')}{' '}
            <Link href="/terms" className="text-brand-text hover:underline">{t('beta.termsLink')}</Link>{' '}
            {t('beta.privacyAfter')}
          </p>
        </Card>

        <Link href="/" className="inline-flex px-4 py-2 btn-primary text-sm">
          {t('common.goHome')}
        </Link>
      </div>
    </AppLayout>
  );
}
