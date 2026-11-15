'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Delete, ArrowRight } from 'lucide-react';
import type { UnlockResult } from '@/hooks/usePinLock';
import { getPinThrottle } from '@/hooks/usePinLock';
import { usePrivacy } from '@/context/PrivacyContext';
import { BrandMark } from '@/components/ui/BrandMark';
import { useT } from '@/i18n/I18nProvider';

interface PinLockProps {
  onUnlock: (pin: string, opts?: { silent?: boolean }) => UnlockResult;
  /** Digits in the saved PIN, or null for PINs saved before the length was recorded. */
  pinLength: number | null;
  appName: string;
  /** Erases this browser's app data and reloads (the only way past a forgotten PIN). */
  onReset: () => void;
}

const MIN = 4;
const MAX = 6;
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function formatWait(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function PinLock({ onUnlock, pinLength, appName, onReset }: PinLockProps) {
  // In Hidden Mode the lock screen shows a plain shield, never the ZenFuel mark.
  const { hiddenMode } = usePrivacy();
  const t = useT();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [forgot, setForgot] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const submitting = useRef(false);

  const maxLen = pinLength ?? MAX;
  const throttled = retryAt !== null && retryAt > now;

  useEffect(() => { setRetryAt(getPinThrottle()); }, []);

  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryAt) { setRetryAt(null); setError(''); }
    }, 500);
    return () => clearInterval(timer);
  }, [retryAt]);

  const fail = useCallback((result: Exclude<UnlockResult, { ok: true }>) => {
    setPin('');
    setShake(true);
    setTimeout(() => setShake(false), 500);
    if (result.reason === 'throttled' || result.retryAt) {
      setRetryAt(result.retryAt);
      setNow(Date.now());
      setError(t('pin.tooMany'));
    } else {
      setError(result.attemptsBeforeDelay <= 2
        ? t('pin.incorrectLeft', { count: result.attemptsBeforeDelay })
        : t('pin.incorrect'));
    }
  }, []);

  const submit = useCallback((value: string) => {
    if (submitting.current || value.length < MIN) return;
    submitting.current = true;
    const result = onUnlock(value);
    submitting.current = false;
    if (!result.ok) fail(result);
  }, [onUnlock, fail]);

  const addDigit = useCallback((d: string) => {
    if (throttled || pin.length >= maxLen) return;
    const next = pin + d;
    setError('');
    setPin(next);
    if (pinLength !== null) {
      // Known length: check automatically once every digit is entered.
      if (next.length === pinLength) setTimeout(() => submit(next), 80);
    } else if (next.length >= MIN) {
      // Unknown length: unlock as soon as it matches, without counting misses.
      setTimeout(() => { onUnlock(next, { silent: true }); }, 80);
    }
  }, [throttled, pin, maxLen, pinLength, submit, onUnlock]);

  const removeDigit = useCallback(() => { setPin(p => p.slice(0, -1)); setError(''); }, []);

  useEffect(() => {
    if (forgot) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); addDigit(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); removeDigit(); }
      else if (e.key === 'Enter') { e.preventDefault(); submit(pin); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forgot, addDigit, removeDigit, submit, pin]);

  const dotCount = pinLength ?? Math.max(MIN, pin.length);

  if (forgot) {
    return (
      <div className="surface-dark fixed inset-0 z-[200] bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-950 overflow-y-auto pt-[var(--sat)] pb-[var(--sab)]">
        <div role="dialog" aria-modal="true" aria-labelledby="forgot-title" className="min-h-full flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4 text-slate-300">
            <h1 id="forgot-title" className="text-white text-xl font-bold">{t('pin.forgotTitle')}</h1>
            <p className="text-sm leading-relaxed">{t('pin.forgotBody', { app: appName })}</p>
            <p className="text-sm leading-relaxed">{t('pin.forgotBackup')}</p>
            <label className="block text-sm">
              <span className="block mb-1.5">{t('pin.typeErase', { word: 'ERASE' })}</span>
              <input
                value={eraseText}
                onChange={e => setEraseText(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onReset}
                disabled={eraseText.trim().toUpperCase() !== 'ERASE'}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                {t('pin.eraseAll')}
              </button>
              <button
                onClick={() => { setForgot(false); setEraseText(''); }}
                className="w-full py-3 rounded-xl bg-white/10 ring-1 ring-white/15 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-400"
              >
                {t('pin.backToEntry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-dark fixed inset-0 z-[200] bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-950 overflow-y-auto pt-[var(--sat)] pb-[var(--sab)]">
      <span className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full glow-blue" aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="lock-title" className="relative min-h-full flex flex-col items-center justify-center gap-7 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          {hiddenMode ? (
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient shadow-glow ring-1 ring-white/20 flex items-center justify-center">
              <Shield size={30} className="text-white" aria-hidden="true" />
            </div>
          ) : (
            <BrandMark size={64} tone="onDark" />
          )}
          <h1 id="lock-title" className="text-white text-2xl font-bold">{t('pin.locked')}</h1>
          <p className="text-white/70 text-sm">
            {pinLength ? t('pin.enterN', { count: pinLength }) : t('pin.enter')}
          </p>
        </div>

        <div className={`flex gap-3 ${shake ? 'animate-bounce' : ''}`} aria-hidden="true">
          {Array.from({ length: dotCount }, (_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < pin.length
                ? error ? 'bg-red-500 border-red-500' : 'bg-zen-300 border-zen-300'
                : 'border-white/35'
            }`} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{t('pin.digits', { count: pin.length, total: pinLength ?? t('pin.upTo6') })}</p>

        <div className="min-h-[2.5rem] -mt-3 text-center" aria-live="assertive">
          {throttled ? (
            <p className="text-amber-300 text-sm">{t('pin.tryAgainIn', { time: formatWait((retryAt ?? now) - now) })}</p>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-3 w-64">
          {DIGITS.map((d, i) => (
            d === 'del' ? (
              <button
                key={i}
                onClick={removeDigit}
                aria-label={t('pin.deleteDigit')}
                className="h-16 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 hover:bg-white/[0.12] text-white flex items-center justify-center transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-400"
              >
                <Delete size={20} aria-hidden="true" />
              </button>
            ) : d === '' ? (
              pinLength === null ? (
                <button
                  key={i}
                  onClick={() => submit(pin)}
                  disabled={pin.length < MIN || throttled}
                  aria-label={t('pin.unlock')}
                  className="h-16 rounded-2xl bg-brand-gradient shadow-glow text-on-brand flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-300"
                >
                  <ArrowRight size={22} aria-hidden="true" />
                </button>
              ) : <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => addDigit(d)}
                disabled={throttled}
                className="h-16 rounded-2xl bg-white/[0.07] ring-1 ring-white/10 hover:bg-white/[0.12] active:bg-zen-600 text-white text-2xl font-light transition-[transform,box-shadow,background-color,border-color,color,opacity] active:scale-95 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-400"
              >
                {d}
              </button>
            )
          ))}
        </div>

        <button onClick={() => setForgot(true)} className="text-sm text-slate-400 hover:text-white underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-400 rounded px-2 py-1">
          {t('pin.forgot')}
        </button>
        <p className="text-[11px] text-slate-500 text-center max-w-xs">
          {t('pin.note')}
        </p>
      </div>
    </div>
  );
}
