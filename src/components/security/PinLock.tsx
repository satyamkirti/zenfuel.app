'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Delete, ArrowRight } from 'lucide-react';
import type { UnlockResult } from '@/hooks/usePinLock';
import { getPinThrottle } from '@/hooks/usePinLock';

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
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryAt) { setRetryAt(null); setError(''); }
    }, 500);
    return () => clearInterval(t);
  }, [retryAt]);

  const fail = useCallback((result: Exclude<UnlockResult, { ok: true }>) => {
    setPin('');
    setShake(true);
    setTimeout(() => setShake(false), 500);
    if (result.reason === 'throttled' || result.retryAt) {
      setRetryAt(result.retryAt);
      setNow(Date.now());
      setError('Too many incorrect attempts.');
    } else {
      setError(result.attemptsBeforeDelay <= 2
        ? `Incorrect PIN. ${result.attemptsBeforeDelay} attempt${result.attemptsBeforeDelay === 1 ? '' : 's'} left before a short wait.`
        : 'Incorrect PIN.');
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
      <div className="surface-dark fixed inset-0 z-[200] bg-slate-950 overflow-y-auto">
        <div role="dialog" aria-modal="true" aria-labelledby="forgot-title" className="min-h-full flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4 text-slate-300">
            <h1 id="forgot-title" className="text-white text-xl font-bold">Forgot your PIN?</h1>
            <p className="text-sm leading-relaxed">
              The PIN cannot be recovered or reset, because there is no account or server. The only way back in is to
              erase all {appName} data stored in this browser: entries, notes, habits, goals, challenges and settings.
            </p>
            <p className="text-sm leading-relaxed">
              If you have a backup file, you can restore it afterwards from Settings. A backup restores its PIN too.
            </p>
            <label className="block text-sm">
              <span className="block mb-1.5">Type <strong className="text-white">ERASE</strong> to confirm</span>
              <input
                value={eraseText}
                onChange={e => setEraseText(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </label>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onReset}
                disabled={eraseText.trim().toUpperCase() !== 'ERASE'}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                Erase all data in this browser
              </button>
              <button
                onClick={() => { setForgot(false); setEraseText(''); }}
                className="w-full py-3 rounded-xl bg-slate-800 text-white font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Back to PIN entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-dark fixed inset-0 z-[200] bg-slate-950 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="lock-title" className="min-h-full flex flex-col items-center justify-center gap-7 px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center">
            <Shield size={32} className="text-violet-400" aria-hidden="true" />
          </div>
          <h1 id="lock-title" className="text-white text-2xl font-bold">Locked</h1>
          <p className="text-slate-400 text-sm">
            {pinLength ? `Enter your ${pinLength}-digit PIN` : 'Enter your PIN, then press Unlock'}
          </p>
        </div>

        <div className={`flex gap-3 ${shake ? 'animate-bounce' : ''}`} aria-hidden="true">
          {Array.from({ length: dotCount }, (_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < pin.length
                ? error ? 'bg-red-500 border-red-500' : 'bg-violet-400 border-violet-400'
                : 'border-slate-500'
            }`} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{pin.length} of {pinLength ?? 'up to 6'} digits entered</p>

        <div className="min-h-[2.5rem] -mt-3 text-center" aria-live="assertive">
          {throttled ? (
            <p className="text-amber-300 text-sm">Too many incorrect attempts. Try again in {formatWait((retryAt ?? now) - now)}.</p>
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
                aria-label="Delete last digit"
                className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Delete size={20} aria-hidden="true" />
              </button>
            ) : d === '' ? (
              pinLength === null ? (
                <button
                  key={i}
                  onClick={() => submit(pin)}
                  disabled={pin.length < MIN || throttled}
                  aria-label="Unlock"
                  className="h-16 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  <ArrowRight size={22} aria-hidden="true" />
                </button>
              ) : <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => addDigit(d)}
                disabled={throttled}
                className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-violet-700 text-white text-2xl font-light transition-all active:scale-95 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {d}
              </button>
            )
          ))}
        </div>

        <button onClick={() => setForgot(true)} className="text-sm text-slate-400 hover:text-white underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded px-2 py-1">
          Forgot PIN?
        </button>
        <p className="text-[11px] text-slate-500 text-center max-w-xs">
          The PIN lock hides the app on this device. It does not encrypt your data.
        </p>
      </div>
    </div>
  );
}
