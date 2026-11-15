'use client';

// First-launch setup for new installs: welcome, language, country/region and optional good
// habits, then Home. Existing users never see it (see i18n/prefs.ts). Language changes apply
// immediately, so every later step is already in the chosen language. Nothing here asks for
// location: the region is only suggested from the device's language and time zone settings.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Globe2, Leaf, MapPin, Search, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { TemplatePicker, habitsFromTemplates } from '@/components/habits/TemplatePicker';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/i18n/I18nProvider';
import { useRegionName } from '@/i18n/useRegionNames';
import { LOCALES, LOCALE_INFO, Locale, suggestLocale } from '@/i18n/locales';
import { filterRegions, regionFlag, suggestRegion } from '@/i18n/regions';
import { deviceTimeZone } from '@/i18n/format';
import { TemplateId, templatesToAdd } from '@/lib/habits/templates';

const STEPS = ['welcome', 'language', 'country', 'habits'] as const;
type Step = (typeof STEPS)[number];

function deviceLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  return (navigator.languages?.length ? [...navigator.languages] : [navigator.language]).filter(Boolean);
}

export function Onboarding() {
  const { t, locale, country: initialCountry, setLocale, completeOnboarding } = useI18n();
  const { habits, addHabits } = useApp();
  const regionName = useRegionName();
  const [step, setStep] = useState<Step>('welcome');
  const suggestedLocale = useMemo(() => suggestLocale(deviceLanguages()), []);
  const suggestedCountry = useMemo(() => suggestRegion(deviceLanguages(), deviceTimeZone()), []);
  const [country, setCountry] = useState<string | null>(initialCountry ?? suggestedCountry);
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateId[]>([]);
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = STEPS.indexOf(step);

  // Move focus to each step's heading so screen readers announce it.
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const regions = useMemo(() => {
    const list = filterRegions(query, regionName);
    // The suggestion first (when it matches the search), then A–Z by the shown name.
    const sorted = [...list].sort((a, b) => regionName(a).localeCompare(regionName(b), locale));
    if (suggestedCountry && sorted.includes(suggestedCountry)) {
      return [suggestedCountry, ...sorted.filter(c => c !== suggestedCountry)];
    }
    return sorted;
  }, [query, regionName, locale, suggestedCountry]);

  const go = (next: Step) => { setStep(next); window.scrollTo({ top: 0 }); };
  const back = () => index > 0 && go(STEPS[index - 1]);

  const finish = (withTemplates: boolean) => {
    if (saving) return;
    setSaving(true);
    if (withTemplates) {
      const ids = templatesToAdd(templates, habits.map(h => h.templateId));
      if (ids.length) addHabits(habitsFromTemplates(ids, t));
    }
    completeOnboarding({ locale, country });
  };

  const toggleTemplate = (id: TemplateId) => setTemplates(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const primary = 'btn-track w-full min-h-[52px] rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:opacity-60';
  const secondary = 'w-full min-h-[48px] rounded-2xl text-[15px] font-semibold text-brand-text hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pt-[calc(1rem+var(--sat))] pb-[calc(1.25rem+var(--sab))]" role="dialog" aria-modal="true" aria-label={t('onboarding.dialogLabel')}>
      <div className="w-full max-w-md flex-1 flex flex-col">
        {/* Top bar: back and progress (after the welcome step). */}
        <div className="h-12 flex items-center justify-between gap-3">
          {index > 0 ? (
            <button type="button" onClick={back} className="w-11 h-11 -ml-2 rounded-xl flex items-center justify-center text-ink-2 hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={t('common.back')}>
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : <span />}
          {index > 0 && (
            <div className="flex items-center gap-2" role="progressbar" aria-label={t('onboarding.progress')} aria-valuemin={1} aria-valuemax={3} aria-valuenow={index} aria-valuetext={t('onboarding.step', { n: index, total: 3 })}>
              {[1, 2, 3].map(n => (
                <span key={n} className={clsx('h-1.5 rounded-full transition-[width,background-color] duration-300', n <= index ? 'w-7 bg-track' : 'w-3.5 bg-line-strong')} aria-hidden="true" />
              ))}
            </div>
          )}
        </div>

        {step === 'welcome' && (
          <div className="flex-1 flex flex-col page-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center pt-4 pb-6">
              <Logo size="lg" descriptor linked={false} />
              <h1 ref={headingRef} tabIndex={-1} className="mt-8 font-display text-[28px] font-bold tracking-tight text-ink leading-tight outline-none">{t('onboarding.welcomeTitle')}</h1>
              <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-sm">{t('onboarding.welcomeBody')}</p>
              <ul className="mt-7 w-full space-y-2.5 text-left">
                {[
                  { icon: TrendingDown, text: t('onboarding.welcomePoint1'), tone: 'bg-blue-500/10 text-blue-600 dark:text-sky-300' },
                  { icon: Leaf, text: t('onboarding.welcomePoint2'), tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
                  { icon: ShieldCheck, text: t('onboarding.welcomePoint3'), tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
                ].map(({ icon: Icon, text, tone }) => (
                  <li key={text} className="card flex items-center gap-3 px-4 py-3">
                    <span className={clsx('w-9 h-9 shrink-0 rounded-xl flex items-center justify-center', tone)} aria-hidden="true"><Icon size={18} /></span>
                    <span className="text-[15px] font-medium text-ink leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" className={primary} onClick={() => go('language')}>{t('onboarding.getStarted')}</button>
          </div>
        )}

        {step === 'language' && (
          <div className="flex-1 flex flex-col page-in">
            <div className="flex-1 pt-3">
              <span className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-text flex items-center justify-center" aria-hidden="true"><Globe2 size={24} /></span>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-[24px] font-bold tracking-tight text-ink leading-tight outline-none">{t('onboarding.languageTitle')}</h1>
              <p className="mt-1.5 text-[15px] text-muted leading-relaxed">{t('onboarding.languageBody')}</p>
              <div className="mt-6 space-y-3" role="radiogroup" aria-label={t('prefs.language')}>
                {LOCALES.map((code: Locale) => {
                  const on = locale === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      lang={code}
                      onClick={() => setLocale(code)}
                      className={clsx(
                        'w-full min-h-[72px] flex items-center gap-4 px-4 py-3 rounded-[20px] border text-left transition-[background-color,border-color,box-shadow] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25',
                        on ? 'border-brand bg-brand-soft shadow-[0_0_0_1px_rgb(var(--brand))]' : 'border-line bg-surface hover:border-line-strong',
                      )}
                    >
                      <span className={clsx('w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-display text-lg font-bold', on ? 'bg-track text-white' : 'bg-surface-2 text-ink-2')} aria-hidden="true">
                        {code === 'hi' ? 'अ' : 'A'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[17px] font-semibold text-ink leading-snug">{LOCALE_INFO[code].native}</span>
                        <span className="block text-[13px] text-muted">
                          {code !== 'en' ? LOCALE_INFO[code].english : ''}
                          {code === suggestedLocale && <span lang={locale}>{code !== 'en' ? ' · ' : ''}{t('onboarding.suggested')}</span>}
                        </span>
                      </span>
                      <span className={clsx('w-6 h-6 shrink-0 rounded-full flex items-center justify-center', on ? 'bg-track text-white' : 'border-2 border-line-strong')} aria-hidden="true">
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" className={clsx(primary, 'mt-6')} onClick={() => go('country')}>{t('common.continue')}</button>
          </div>
        )}

        {step === 'country' && (
          <div className="flex-1 flex flex-col page-in min-h-0">
            <div className="pt-3">
              <span className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-text flex items-center justify-center" aria-hidden="true"><MapPin size={24} /></span>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-[24px] font-bold tracking-tight text-ink leading-tight outline-none">{t('onboarding.countryTitle')}</h1>
              <p className="mt-1.5 text-[15px] text-muted leading-relaxed">{t('onboarding.countryBody')}</p>
              <label className="relative mt-5 block">
                <span className="sr-only">{t('prefs.searchCountry')}</span>
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('prefs.searchCountry')}
                  className="input pl-10 min-h-[48px] text-[15px]"
                  autoComplete="off"
                />
              </label>
            </div>
            <CountryList
              codes={regions}
              selected={country}
              suggested={suggestedCountry}
              onSelect={setCountry}
              nameOf={regionName}
              emptyText={t('prefs.noCountryMatch', { query })}
              className="mt-3 flex-1 min-h-[220px] max-h-[46dvh]"
            />
            {suggestedCountry && <p className="mt-2 text-xs text-muted">{t('onboarding.countryHint')}</p>}
            <button type="button" className={clsx(primary, 'mt-4')} onClick={() => go('habits')}>{t('common.continue')}</button>
            <button type="button" className={clsx(secondary, 'mt-1')} onClick={() => { setCountry(null); go('habits'); }}>{t('common.skip')}</button>
          </div>
        )}

        {step === 'habits' && (
          <div className="flex-1 flex flex-col page-in">
            <div className="flex-1 pt-3">
              <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center" aria-hidden="true"><Sparkles size={24} /></span>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-[24px] font-bold tracking-tight text-ink leading-tight outline-none">{t('onboarding.habitsTitle')}</h1>
              <p className="mt-1.5 text-[15px] text-muted leading-relaxed">{t('onboarding.habitsBody')}</p>
              <div className="mt-5">
                <TemplatePicker selected={templates} onToggle={toggleTemplate} added={habits.map(h => h.templateId ?? '')} idPrefix="ob" />
              </div>
            </div>
            <div className="sticky bottom-0 -mx-4 px-4 pt-6 pb-1 bg-gradient-to-t from-bg from-75% to-transparent">
              <button type="button" className={primary} disabled={saving} onClick={() => finish(true)}>
                {templates.length ? t('onboarding.addAndFinish', { count: templates.length }) : t('onboarding.finish')}
              </button>
              <button type="button" className={clsx(secondary, 'mt-1')} disabled={saving} onClick={() => finish(false)}>{t('onboarding.skipHabits')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** A selectable, scrollable list of countries and regions (radio semantics). */
export function CountryList({
  codes, selected, suggested, onSelect, nameOf, emptyText, className,
}: {
  codes: string[];
  selected: string | null;
  suggested: string | null;
  onSelect: (code: string) => void;
  nameOf: (code: string) => string;
  emptyText: string;
  className?: string;
}) {
  const { t } = useI18n();
  if (codes.length === 0) return <p className={clsx('card px-4 py-6 text-center text-sm text-muted', className)}>{emptyText}</p>;
  return (
    <div className={clsx('card p-1.5 overflow-y-auto overscroll-contain', className)} role="radiogroup" aria-label={t('prefs.countryList')}>
      {codes.map(code => {
        const on = selected === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(code)}
            className={clsx(
              'w-full min-h-[48px] flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
              on ? 'bg-brand-soft' : 'hover:bg-surface-2',
            )}
          >
            <span className="w-7 text-xl leading-none text-center" aria-hidden="true">{regionFlag(code)}</span>
            <span className="flex-1 min-w-0">
              <span className={clsx('block text-[15px] leading-snug truncate', on ? 'font-semibold text-ink' : 'text-ink')}>{nameOf(code)}</span>
              {code === suggested && <span className="block text-xs text-brand-text">{t('onboarding.suggested')}</span>}
            </span>
            <span className={clsx('w-5 h-5 shrink-0 rounded-full flex items-center justify-center', on ? 'bg-track text-white' : 'border-2 border-line-strong')} aria-hidden="true">
              {on && <Check size={12} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
