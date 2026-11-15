'use client';

import { useMemo } from 'react';
import { REGION_NAMES_EN } from './regions';
import { useI18n } from './I18nProvider';

/**
 * Country and region names in the interface language (from the browser's Intl data), falling
 * back to the built-in English names where the browser has none.
 */
export function useRegionName(): (code: string) => string {
  const { locale } = useI18n();
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames([locale], { type: 'region' }); } catch { names = null; }
    const cache = new Map<string, string>();
    return (code: string) => {
      let name = cache.get(code);
      if (name === undefined) {
        let fromIntl: string | undefined;
        try { fromIntl = names?.of(code); } catch { fromIntl = undefined; }
        name = fromIntl && fromIntl !== code ? fromIntl : REGION_NAMES_EN[code] ?? code;
        cache.set(code, name);
      }
      return name;
    };
  }, [locale]);
}
