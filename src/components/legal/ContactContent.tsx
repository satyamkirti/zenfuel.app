'use client';

import Link from 'next/link';
import { LegalLayout, H2, P, InfoBox, MailLink } from './LegalLayout';
import { useT } from '@/i18n/I18nProvider';

// Email subjects are in the interface language, as shown on the card.
function ContactCard({ subject, label, description }: { subject: string; label: string; description?: string }) {
  const t = useT();
  const href = `mailto:zenfuel.support@gmail.com?subject=${encodeURIComponent(subject)}`;
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 rounded-2xl border-2 border-line hover:border-brand/60 hover:bg-brand-soft/50 transition-[transform,box-shadow,background-color,border-color,color,opacity] group"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink group-hover:text-brand-text transition-colors">{label}</p>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        <p className="text-xs text-muted mt-1">{t('contact.subject', { subject })}</p>
      </div>
      <span className="text-brand-text opacity-0 group-hover:opacity-100 transition-opacity text-lg" aria-hidden="true">→</span>
    </a>
  );
}

export function ContactContent() {
  const t = useT();
  return (
    <LegalLayout titleKey="contact.title" lastUpdated="October 17, 2026">
      <InfoBox>
        <p className="font-semibold text-ink-2 text-base">ZenFuel</p>
        <p>{t('contact.operated')}</p>
        <p>{t('contact.email')} <MailLink /></p>
        <p>{t('contact.response')}</p>
      </InfoBox>

      <P>{t('contact.intro')}</P>

      <H2>{t('contact.helpWith')}</H2>
      <div className="space-y-3 mb-8">
        <ContactCard subject={t('contact.subj.support')} label={t('contact.support')} description={t('contact.supportDesc')} />
        <ContactCard subject={t('contact.subj.bug')} label={t('contact.bug')} description={t('contact.bugDesc')} />
        <ContactCard subject={t('contact.subj.feature')} label={t('contact.feature')} description={t('contact.featureDesc')} />
      </div>

      <H2>{t('contact.dataTitle')}</H2>
      <P>
        {t('contact.dataBody')}{' '}
        <Link href="/privacy" className="text-brand-text hover:underline">{t('legal.privacy')}</Link>
      </P>

      <H2>{t('contact.mediaTitle')}</H2>
      <InfoBox>
        <p>{t('contact.email')} <MailLink /></p>
        <p>{t('contact.subject', { subject: t('contact.subj.media') })}</p>
      </InfoBox>

      <H2>{t('contact.privacyTitle')}</H2>
      <P>{t('contact.privacyBody')}</P>
      <InfoBox>
        <p>{t('contact.email')} <MailLink /></p>
        <p>{t('contact.subject', { subject: t('contact.subj.privacy') })}</p>
      </InfoBox>

      <p className="text-sm text-muted mt-8 italic">{t('contact.footer')}</p>
    </LegalLayout>
  );
}
