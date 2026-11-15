// Localisation: complete catalogues, interpolation and plurals, regions, first-launch and
// existing-user preferences, translated names, reminders and native alert wording, and a scan
// for user-facing English left hard-coded in screens. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { SECTIONS, MESSAGES } from '../src/i18n/messages/catalog';
import { CATALOGS, translate, setActiveLocale, t } from '../src/i18n/translate';
import { LOCALES, suggestLocale, formattingTag, isLocale } from '../src/i18n/locales';
import { REGION_CODES, REGION_NAMES_EN, regionFlag, suggestRegion, filterRegions, isRegion } from '../src/i18n/regions';
import { resolveLocalePrefs, parseLocalePrefs, EXISTING_DATA_KEYS } from '../src/i18n/prefs';
import { localizedHabitName, habitNameKey, BUILT_IN_HABIT_NAMES } from '../src/i18n/habitNames';
import { builtInChallengeText } from '../src/i18n/challengeNames';
import { buildReminder, getDefaultNotificationPrefs } from '../src/lib/notifications';
import { alertMessages } from '../src/lib/usage/settings';
import { formatDuration, statusLabel, usageStatus } from '../src/lib/usage/status';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const texts = (v: unknown): string[] => (typeof v === 'string' ? [v] : Object.values(v as Record<string, string>));

// ── Catalogues ───────────────────────────────────────────────────────────────────

test('every message has every supported language, non-empty', () => {
  for (const [key, entry] of Object.entries(MESSAGES)) {
    for (const l of LOCALES) {
      const v = (entry as Record<string, unknown>)[l];
      assert.ok(v !== undefined, `${key} has no ${l}`);
      for (const s of texts(v)) assert.ok(s.trim().length > 0, `${key} (${l}) is empty`);
    }
  }
});

test('plural messages have one and other forms in every language', () => {
  for (const [key, entry] of Object.entries(MESSAGES)) {
    const en = (entry as Record<string, unknown>).en;
    if (typeof en === 'string') continue;
    for (const l of LOCALES) {
      const v = (entry as Record<string, Record<string, string>>)[l];
      assert.equal(typeof v, 'object', `${key} (${l}) should be a plural object like English`);
      assert.ok(v.one && v.other, `${key} (${l}) needs one and other`);
    }
  }
});

test('placeholders match between English and every other language', () => {
  for (const [key, entry] of Object.entries(MESSAGES)) {
    const en = texts((entry as Record<string, unknown>).en);
    const expected = placeholders(en.join(' '));
    for (const l of LOCALES) {
      for (const s of texts((entry as Record<string, unknown>)[l])) {
        const got = placeholders(s);
        for (const p of got) assert.ok(expected.includes(p), `${key} (${l}) uses unknown placeholder {${p}}`);
      }
      const all = placeholders(texts((entry as Record<string, unknown>)[l]).join(' '));
      for (const p of expected) assert.ok(all.includes(p), `${key} (${l}) is missing {${p}}`);
    }
  }
});

test('no message key is defined in two sections', () => {
  const seen = new Map<string, string>();
  for (const [section, entries] of Object.entries(SECTIONS)) {
    for (const key of Object.keys(entries)) {
      assert.ok(!seen.has(key), `${key} is in both ${seen.get(key)} and ${section}`);
      seen.set(key, section);
    }
  }
  assert.equal(seen.size, Object.keys(MESSAGES).length);
});

test('Hindi is actually translated (Devanagari), not copied English', () => {
  const allowSame = /^[\s{}\w%./·:—…→'’()+-]*$/u; // codes like "{count}d", "—", "Q{n}"
  let english = 0;
  const offenders: string[] = [];
  for (const [key, entry] of Object.entries(MESSAGES)) {
    const hi = texts((entry as Record<string, unknown>).hi).join(' ');
    const en = texts((entry as Record<string, unknown>).en).join(' ');
    if (/[ऀ-ॿ]/.test(hi)) continue;
    if (allowSame.test(hi) && hi.replace(/\{\w+\}/g, '').replace(/[^A-Za-z]/g, '').length <= 3) continue;
    english++;
    offenders.push(`${key}: ${hi}`);
    void en;
  }
  assert.equal(english, 0, `Untranslated Hindi messages:\n${offenders.join('\n')}`);
});

// ── Translator ───────────────────────────────────────────────────────────────────

test('interpolation, number formatting and plurals', () => {
  assert.equal(translate('en', 'quicklog.trackMany', { count: 3 }), 'Track 3 activities');
  assert.equal(translate('en', 'quicklog.trackMany', { count: 1 }), 'Track 1 activity');
  assert.equal(translate('hi', 'quicklog.trackMany', { count: 3 }), '3 गतिविधियाँ ट्रैक करें');
  assert.equal(translate('en', 'quicklog.activities', { count: 1234 }), '1,234 activities');
  assert.equal(translate('en', 'habits.moved', { name: 'Gaming', position: 2, total: 9 }), 'Gaming moved to position 2 of 9.');
});

test('unknown keys show the key, never a blank; English is the fallback', () => {
  assert.equal(translate('hi', 'no.such.key'), 'no.such.key');
  assert.equal(translate('en', 'hero.trackHabit'), 'Track a Habit');
  assert.equal(translate('hi', 'hero.trackHabit'), 'आदत ट्रैक करें');
  // A language code that is not supported falls back to English.
  assert.equal(translate('xx' as never, 'hero.trackHabit'), 'Track a Habit');
});

test('approved terminology: no "check-in" in any language', () => {
  for (const l of LOCALES) {
    for (const [key, v] of Object.entries(CATALOGS[l])) {
      for (const s of texts(v)) assert.ok(!/\bcheck[- ]?ins?\b/i.test(s), `${key} (${l}) says check-in`);
    }
  }
  assert.equal(translate('en', 'hero.trackScreenTime'), 'Track Your Screen Time');
  assert.equal(translate('en', 'quicklog.title'), 'Choose Your Activities');
  assert.equal(translate('en', 'history.empty'), 'No activity tracked yet');
});

// ── Languages and regions ────────────────────────────────────────────────────────

test('language suggestion: Hindi devices get Hindi, everything else English', () => {
  assert.equal(suggestLocale(['hi-IN', 'en-IN']), 'hi');
  assert.equal(suggestLocale(['HI']), 'hi');
  assert.equal(suggestLocale(['en-US']), 'en');
  assert.equal(suggestLocale(['fr-FR', 'de-DE']), 'en');
  assert.equal(suggestLocale(['fr-FR', 'hi-IN']), 'hi');
  assert.equal(suggestLocale([]), 'en');
  assert.equal(isLocale('hi'), true);
  assert.equal(isLocale('fr'), false);
});

test('formatting tag combines language and region', () => {
  assert.equal(formattingTag('hi', 'IN'), 'hi-IN');
  assert.equal(formattingTag('en', 'US'), 'en-US');
  assert.equal(formattingTag('en', null), 'en');
});

test('the country list is complete ISO 3166-1 alpha-2', () => {
  assert.ok(REGION_CODES.length >= 249, `only ${REGION_CODES.length} regions`);
  assert.equal(new Set(REGION_CODES).size, REGION_CODES.length);
  for (const c of REGION_CODES) assert.match(c, /^[A-Z]{2}$/);
  for (const c of ['IN', 'US', 'GB', 'CA', 'FR', 'DE', 'BR', 'JP', 'AU', 'NP', 'AE', 'ZA']) assert.ok(isRegion(c), c);
  assert.equal(REGION_NAMES_EN.IN, 'India');
  assert.equal(regionFlag('IN'), '🇮🇳');
});

test('region suggestion: time zone first, then the language tag, no location needed', () => {
  assert.equal(suggestRegion(['en-US'], 'Asia/Kolkata'), 'IN', 'an Indian time zone wins over en-US');
  assert.equal(suggestRegion(['en-GB'], 'UTC'), 'GB');
  assert.equal(suggestRegion(['fr-CA'], 'Etc/Unknown'), 'CA');
  assert.equal(suggestRegion(['en'], 'UTC'), null);
});

test('country search by name, English name or code', () => {
  const names = (c: string) => REGION_NAMES_EN[c];
  assert.ok(filterRegions('ind', names).includes('IN'));
  assert.ok(filterRegions('IN', names).includes('IN'));
  assert.ok(filterRegions('cote', names).includes('CI'), 'accents ignored');
  assert.equal(filterRegions('', names).length, REGION_CODES.length);
  assert.deepEqual(filterRegions('zzzz', names), []);
});

// ── First launch and existing users ──────────────────────────────────────────────

const device = { languages: ['hi-IN'], timeZone: 'Asia/Kolkata' };

test('new install: onboarding, with the device suggestions', () => {
  const r = resolveLocalePrefs(null, false, device);
  assert.equal(r.needsOnboarding, true);
  assert.equal(r.locale, 'hi');
  assert.equal(r.country, 'IN');
  assert.equal(r.write, false);
});

test('existing user without preferences: never onboarding, device language suggested', () => {
  const r = resolveLocalePrefs(null, true, device);
  assert.equal(r.needsOnboarding, false);
  assert.equal(r.write, true);
  assert.equal(r.prefs.onboarded, true);
  assert.equal(r.prefs.migrated, true);
  assert.equal(r.prefs.language, undefined, 'the language is not forced, only suggested');
  assert.equal(r.locale, 'hi');
  assert.equal(resolveLocalePrefs(null, true, { languages: ['de-DE'], timeZone: 'Europe/Berlin' }).locale, 'en');
});

test('saved choices win, and country never changes the language', () => {
  const r = resolveLocalePrefs({ onboarded: true, language: 'en', country: 'IN' }, true, device);
  assert.equal(r.locale, 'en');
  assert.equal(r.country, 'IN');
  assert.equal(r.needsOnboarding, false);
  const r2 = resolveLocalePrefs({ onboarded: true, language: 'hi', country: 'US' }, true, { languages: ['en-US'], timeZone: 'America/New_York' });
  assert.equal(r2.locale, 'hi');
  assert.equal(r2.country, 'US');
});

test('stored preferences are validated', () => {
  assert.deepEqual(parseLocalePrefs({ onboarded: true, language: 'xx', country: 'ZZ' }), { onboarded: true });
  assert.equal(parseLocalePrefs('nope'), null);
  assert.deepEqual(parseLocalePrefs({ onboarded: true, language: 'hi', country: 'IN' }), { onboarded: true, language: 'hi', country: 'IN' });
});

test('existing-user detection covers every older data key', () => {
  for (const k of ['mt_entries', 'mt_settings', 'ddt_habits', 'ddt_habit_order', 'zenfuel_usage_settings']) assert.ok(EXISTING_DATA_KEYS.includes(k), k);
});

// ── Names ────────────────────────────────────────────────────────────────────────

test('built-in habits follow the language until renamed', () => {
  for (const [id, name] of Object.entries(BUILT_IN_HABIT_NAMES)) {
    assert.equal(localizedHabitName({ id, name }, 'en'), name);
    assert.match(localizedHabitName({ id, name }, 'hi'), /[ऀ-ॿ]/, id);
  }
  assert.equal(localizedHabitName({ id: 'gaming', name: 'Video games' }, 'hi'), 'Video games', 'renamed habits keep their name');
  assert.equal(localizedHabitName({ id: 'x1', name: 'My habit' }, 'hi'), 'My habit');
});

test('template habits follow the language whichever language they were added in', () => {
  assert.equal(localizedHabitName({ id: 'a', name: 'Walking', templateId: 'walking' }, 'hi'), 'पैदल चलना');
  assert.equal(localizedHabitName({ id: 'a', name: 'पैदल चलना', templateId: 'walking' }, 'en'), 'Walking');
  assert.equal(habitNameKey({ id: 'a', name: 'Evening walk', templateId: 'walking' }), null);
});

test('built-in challenges are translated until edited', () => {
  assert.equal(builtInChallengeText({ id: 'no-social-7', isBuiltIn: true, name: 'Social Media Detox' }, 'name', 'hi'), 'सोशल मीडिया डिटॉक्स');
  assert.equal(builtInChallengeText({ id: 'no-social-7', isBuiltIn: true, name: 'My detox' }, 'name', 'hi'), null);
  assert.equal(builtInChallengeText({ id: 'c1', isBuiltIn: false, name: 'X' }, 'name', 'hi'), null);
});

// ── Notifications ────────────────────────────────────────────────────────────────

test('reminders use the selected app language', () => {
  const prefs = { ...getDefaultNotificationPrefs(), userName: 'Asha' };
  const ctx = { detoxScore: 80, streakDays: 3, discreet: false, discreetTitle: 'X' };
  setActiveLocale('en');
  assert.equal(buildReminder('morning', prefs, ctx).body, 'Good morning Asha. How are you starting today?');
  setActiveLocale('hi', 'IN');
  const hi = buildReminder('morning', prefs, ctx);
  assert.match(hi.title, /दिन 3/);
  assert.match(hi.body, /सुप्रभात Asha/);
  assert.match(buildReminder('evening', prefs, ctx).title, /स्कोर: 80\/100/);
  assert.equal(buildReminder('vulnerable', prefs, { ...ctx, discreet: true, discreetTitle: 'निजी स्थान' }).body, 'आपके लिए एक रिमाइंडर है।');
  setActiveLocale('en');
});

test('Android limit-alert wording is sent in the app language with placeholders intact', () => {
  const en = alertMessages('en');
  assert.equal(en.title, 'Daily limit reached');
  assert.equal(en.many, '{count} of your app limits for today have been reached.');
  const hi = alertMessages('hi');
  assert.match(hi.title, /[ऀ-ॿ]/);
  assert.ok(hi.many.includes('{count}') && hi.namedOne.includes('{app}') && hi.namedMany.includes('{apps}'));
  assert.deepEqual(alertMessages('fr'), en, 'unsupported languages fall back to English');
});

test('screen-time figures follow the language (English unchanged)', () => {
  setActiveLocale('en');
  assert.equal(formatDuration(61 * 60_000), '1h 01m');
  assert.equal(statusLabel(usageStatus(80 * 60_000, 60, 'stale')), 'Over limit (may be out of date)');
  setActiveLocale('hi', 'IN');
  assert.equal(formatDuration(61 * 60_000), '1 घं 01 मि');
  assert.equal(statusLabel(usageStatus(10 * 60_000, 60, 'fresh')), 'सीमा से कम');
  assert.equal(t('hero.trackHabit'), 'आदत ट्रैक करें');
  setActiveLocale('en');
});

// ── No hard-coded English in screens ─────────────────────────────────────────────

// Files whose English is intentional: legal documents published in English only, the paid-plan
// screens that are never rendered during the Free Beta, and page metadata (search engines).
const SCAN_EXCLUDE = [
  'src/app/privacy/page.tsx', 'src/app/terms/page.tsx', 'src/app/refund/page.tsx',
  'src/components/subscription/PremiumUpgradeView.tsx', 'src/components/subscription/PricingCards.tsx', 'src/components/subscription/PlanBadge.tsx',
  'src/app/layout.tsx',
  // Server-rendered description for search engines (sr-only, lang=en) on the website.
  'src/app/page.tsx',
];
// Words that are the same in every language here (brand, product and format names).
const ALLOWED = /^(ZenFuel|ZenFuel —|Zen|Fuel|CSV|JSON|PDF|ERASE|zenfuel\.support@gmail\.com|Google Analytics|Android|•|—)$/;

// Code, not text: keywords that can sit between braces and tags on a line.
const CODE_WORDS = /^(catch|else|else if|try|finally|return|do|as const|as|in|of|typeof|new)$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

test('screens have no hard-coded English text or labels', () => {
  const problems: string[] = [];
  for (const file of files('src')) {
    const rel = relative('.', file).split(sep).join('/');
    if (SCAN_EXCLUDE.includes(rel)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      // JSX text: >Words< (text between tags, no expressions).
      for (const m of line.matchAll(/>([^<>{}=;()&|]*[A-Za-z]{3,}[^<>{}=;()&|]*)<\/?[A-Za-z]/g)) {
        const text = m[1].trim();
        if (!text || ALLOWED.test(text) || /^&[a-z]+;$/.test(text)) continue;
        problems.push(`${rel}:${i + 1}: >${text}<`);
      }
      // Text next to an expression: >Words {x}< or {x} words</tag>.
      for (const m of line.matchAll(/(?:>|\})\s*([A-Za-z][^<>{}=;()|&$`'":]*?)\s*(?:\{|<\/)/g)) {
        const text = m[1].trim();
        if (!/[A-Za-z]{2,}/.test(text) || ALLOWED.test(text) || CODE_WORDS.test(text)) continue;
        problems.push(`${rel}:${i + 1}: ${text}`);
      }
      // JSX text on a line of its own (multi-line elements): "Words" or "Words {value}".
      const own = line.match(/^\s+([A-Z][a-z]+(?:[ ,'’][A-Za-z]+)*[.!?]?)\s*(\{[^{}]*\})?\s*$/);
      if (own && !ALLOWED.test(own[1]) && !CODE_WORDS.test(own[1])) problems.push(`${rel}:${i + 1}: ${own[1]}`);
      // String props that are shown or read aloud.
      for (const m of line.matchAll(/\b(aria-label|placeholder|title|alt|label|sub|hint|description|message|cta|subtitle|feature)="([^"]*[A-Za-z]{3,}[^"]*)"/g)) {
        if (ALLOWED.test(m[2])) continue;
        problems.push(`${rel}:${i + 1}: ${m[1]}="${m[2]}"`);
      }
    });
  }
  assert.deepEqual(problems, [], `Hard-coded text found:\n${problems.join('\n')}`);
});
