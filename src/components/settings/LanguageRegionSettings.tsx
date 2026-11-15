'use client';

// Settings → Language & region. Language and country are independent: choosing a country never
// changes the language. The time zone always comes from the device (read-only). Changing either
// preference re-renders the app immediately and touches nothing else (habits, history, PIN…).

import { useMemo, useState } from 'react';
import { Check, Clock, Globe2, Languages, MapPin, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/Card';
import { CountryList } from '@/components/onboarding/Onboarding';
import { useI18n } from '@/i18n/I18nProvider';
import { useRegionName } from '@/i18n/useRegionNames';
import { LOCALES, LOCALE_INFO, Locale } from '@/i18n/locales';
import { filterRegions, regionFlag } from '@/i18n/regions';
import { formatDateStyle, formatNumber, formatClock, timeZoneOffsetLabel } from '@/i18n/format';

export function LanguageRegionSettings() {
  const { t, locale, setLocale, country, countryChosen, setCountry, timeZone } = useI18n();
  const regionName = useRegionName();
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const codes = useMemo(() => {
    const list = [...filterRegions(query, regionName)].sort((a, b) => regionName(a).localeCompare(regionName(b), locale));
    return country && list.includes(country) ? [country, ...list.filter(c => c !== country)] : list;
  }, [query, regionName, locale, country]);

  const chooseLanguage = (code: Locale) => {
    if (code === locale) return;
    setLocale(code);
    setAnnouncement(LOCALE_INFO[code].native);
  };

  const now = new Date();
  const preview = `${formatDateStyle(now, 'full')} · ${formatClock(now)} · ${formatNumber(1234567.5)}`;
  const offset = timeZoneOffsetLabel(timeZone);

  return (
    <div className="space-y-4">
      {/* Language */}
      <div>
        <div className="flex items-center gap-3.5">
          <IconTile tone="blue" size="lg"><Languages size={19} /></IconTile>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">{t('prefs.language')}</p>
            <p className="text-[13px] text-muted mt-0.5 leading-snug">{t('prefs.languageSub')}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm" role="radiogroup" aria-label={t('prefs.language')}>
          {LOCALES.map(code => {
            const on = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={on}
                lang={code}
                onClick={() => chooseLanguage(code)}
                className={clsx(
                  'min-h-[48px] flex items-center justify-between gap-2 px-3.5 rounded-2xl border text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                  on ? 'border-brand bg-brand-soft text-ink shadow-[0_0_0_1px_rgb(var(--brand))]' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
                )}
              >
                {LOCALE_INFO[code].native}
                {on && <span className="w-5 h-5 rounded-full bg-track text-white flex items-center justify-center" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{announcement && t('prefs.languageChanged', { name: announcement })}</p>
      </div>

      <div className="h-px bg-line" />

      {/* Country / region */}
      <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2">
        <IconTile tone="teal" size="lg"><MapPin size={19} /></IconTile>
        <div className="flex-1 min-w-[9rem]">
          <p className="text-[15px] font-semibold text-ink">{t('prefs.country')}</p>
          <p className="text-[13px] text-muted mt-0.5 leading-snug">
            {country
              ? <span className="font-medium text-ink-2"><span aria-hidden="true">{regionFlag(country)} </span>{countryChosen ? regionName(country) : t('prefs.countrySuggested', { name: regionName(country) })}</span>
              : t('prefs.countryNotSet')}
          </p>
          <p className="text-xs text-muted mt-0.5 leading-snug">{t('prefs.countrySub')}</p>
        </div>
        <Button variant="outline" size="sm" icon={<Globe2 size={14} />} onClick={() => { setQuery(''); setPicking(true); }}>{t('common.change')}</Button>
      </div>

      <div className="h-px bg-line" />

      {/* Time zone (automatic) */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <IconTile tone="violet" size="lg"><Clock size={19} /></IconTile>
        <div className="flex-1 min-w-[9rem]">
          <p className="text-[15px] font-semibold text-ink">{t('prefs.timeZone')}</p>
          <p className="text-[13px] font-medium text-ink-2 mt-0.5 break-words" lang="en">{timeZone}{offset ? ` (${offset})` : ''}</p>
          <p className="text-xs text-muted mt-0.5 leading-snug">{t('prefs.timeZoneSub')}</p>
        </div>
      </div>

      <p className="text-xs text-muted bg-surface-2 rounded-xl px-3 py-2 leading-relaxed">{t('prefs.formatPreview', { example: preview })}</p>

      {picking && (
        <Modal open={true} onClose={() => setPicking(false)} title={t('prefs.chooseCountry')} size="sm">
          <div className="p-4 sm:p-5 flex flex-col gap-3">
            <label className="relative block">
              <span className="sr-only">{t('prefs.searchCountry')}</span>
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('prefs.searchCountry')} className="input pl-10 min-h-[48px] text-[15px]" autoComplete="off" />
            </label>
            <CountryList
              codes={codes}
              selected={country}
              suggested={countryChosen ? null : country}
              onSelect={code => { setCountry(code); setPicking(false); }}
              nameOf={regionName}
              emptyText={t('prefs.noCountryMatch', { query })}
              className="max-h-[55dvh] min-h-[200px]"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
