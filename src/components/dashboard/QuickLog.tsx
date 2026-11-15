'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarClock, ChevronDown, Check, Lock, Pointer, PencilLine, X, AlertCircle, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { Habit, LogEntry } from '@/types';
import { checkinWording } from './checkinLabels';
import { HabitGlyph } from './HabitGlyph';
import { brandColor, tint } from '@/utils/palette';
import { useT } from '@/i18n/I18nProvider';
import { formatDateStyle } from '@/i18n/format';

// Category cards: each habit's own colour (see .cat-card in globals.css); neutral in Hidden Mode.
const catTile = 'relative flex flex-col items-center justify-center gap-1.5 min-h-[78px] px-1.5 py-2.5 rounded-[18px] border text-center text-[13px] font-semibold leading-tight transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:scale-[0.96] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25';
const catOn = 'border-brand bg-brand-soft text-ink shadow-[0_0_0_1px_rgb(var(--brand))]';
const catOff = 'border-line bg-surface-2/70 text-ink-2 hover:border-line-strong hover:text-ink';
const tileBase = 'relative flex items-center gap-2.5 min-[380px]:gap-3 min-h-[56px] pl-2.5 min-[380px]:pl-3 pr-5 rounded-2xl border text-left text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25';
const tileOn = 'border-brand bg-brand-soft text-ink';
const tileOff = 'border-line/80 bg-surface text-ink-2 hover:border-line-strong hover:text-ink dark:bg-surface-2';
// Icon well: neutral by default, the brand colour when the tile is selected.
const iconBoxSm = 'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors';
// Selected mark sits in the corner, inside the tile's right padding, so it never touches the name.
const checkBadge = 'absolute top-1 right-1 w-4 h-4 rounded-full bg-brand text-on-brand flex items-center justify-center';
const iconOn = 'bg-brand-gradient text-on-brand shadow-glow';
const iconOff = 'bg-surface text-ink-2 dark:bg-surface-3';
// Selected-activity chip: the whole chip removes it, with a hit area extended to about 48px tall.
const chipBase = "relative inline-flex max-w-full items-center gap-1.5 min-h-[38px] pl-2.5 pr-1.5 rounded-full border text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 after:absolute after:inset-x-0 after:-inset-y-[5px] after:content-['']";
const chipMasked = 'border-line bg-surface-2 text-ink hover:border-line-strong dark:bg-white/[0.05]';
// How long a removed chip takes to fade out (matches .chip-out in globals.css).
const CHIP_OUT_MS = 180;

// "Choose Your Activities": pick one or more activities, then one clearly labelled button tracks
// them all (one entry each, same time and note). Nothing is pre-selected, so nothing is tracked
// by accident. The Home hero's "Track a Habit" button jumps here.


/** The small sprout in the corner of Choose Your Activities (decorative, static). */
function Sprout() {
  return (
    <svg viewBox="0 0 48 36" className="pointer-events-none absolute top-3 right-3 w-11 h-auto" aria-hidden="true">
      <ellipse cx="24" cy="32" rx="17" ry="3.6" fill="#8b5a2b" fillOpacity="0.28" />
      <path d="M24 32 C24 25 24.5 20 26 15" stroke="#2f9a55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M25.4 17.5 C 30 9 38 8 43 9.5 C 40 17 33 20 25.4 17.5 Z" fill="#3cb46a" />
      <path d="M25.4 17.5 C 33 14.5 37.5 12 41 10" stroke="#2a8a4c" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M25 22 C 21 14 14 12.5 8.5 14 C 11 21.5 18 24.5 25 22 Z" fill="#5fcf7e" />
      <path d="M25 22 C 19 19 14.5 17 10.5 15" stroke="#3aa35e" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function QuickLog() {
  const { logEntries, deleteEntries, habits } = useApp();
  const { habitName, masked } = usePrivacy();
  const t = useT();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Blocks a second tap until the cleared selection has rendered, so one batch is saved once.
  const savingRef = useRef(false);
  useEffect(() => { if (selectedIds.length === 0) savingRef.current = false; }, [selectedIds]);
  const [panel, setPanel] = useState<null | 'note' | 'time'>(null);
  const [notes, setNotes] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState(formatDate(new Date()));
  const [customTime, setCustomTime] = useState(formatTime(new Date()));
  const [done, setDone] = useState<{ entries: LogEntry[]; label: string; time: string } | null>(null);
  const [undone, setUndone] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // The note and time fields open below the toggle: bring them fully into view (above the bottom
  // bar, via the page's scroll-padding) instead of leaving them hidden under it.
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panel) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    optionsRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [panel]);
  const togglePanel = (p: 'note' | 'time') => {
    // Opening the time fields starts them at the current moment unless a time was already chosen.
    if (p === 'time' && panel !== 'time' && !useCustomTime) {
      const now = new Date();
      setCustomDate(formatDate(now));
      setCustomTime(formatTime(now));
    }
    setPanel(cur => (cur === p ? null : p));
  };
  const timeLabel = !useCustomTime ? t('quicklog.now') : customDate === formatDate(new Date()) ? customTime : `${formatDateStyle(customDate, 'dayMonth')} · ${customTime}`;

  // Selected habits in display order (the order entries are saved in).
  const selectedHabits = habits.filter(h => selectedIds.includes(h.id));
  const count = selectedHabits.length;
  const isOn = (id: string) => selectedIds.includes(id);
  // Removed chips stay briefly to fade out; the selection, count and button update at once.
  // This only changes the unsaved selection: habits, history and order are untouched.
  const [leaving, setLeaving] = useState<string[]>([]);
  const chipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => chipTimers.current.forEach(clearTimeout), []);
  const deselect = (ids: string[]) => {
    if (ids.length === 0) return;
    setError('');
    setSelectedIds(prev => prev.filter(x => !ids.includes(x)));
    setLeaving(prev => [...prev.filter(x => !ids.includes(x)), ...ids]);
    chipTimers.current.push(setTimeout(() => setLeaving(prev => prev.filter(x => !ids.includes(x))), CHIP_OUT_MS));
  };
  const toggle = (id: string) => {
    if (isOn(id)) { deselect([id]); return; }
    setError('');
    setLeaving(prev => prev.filter(x => x !== id));
    setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };
  const standardHabits = habits.filter(h => h.category !== 'adult');
  // A habit's colour: the same one its category card uses.
  const colorOf = (h: Habit) => { const i = standardHabits.indexOf(h); return brandColor(h.color, i >= 0 ? i : habits.indexOf(h)); };
  // Chips: the selected habits plus any still fading out, in display order.
  const chipHabits = habits.filter(h => isOn(h.id) || leaving.includes(h.id));
  const personalHabits = habits.filter(h => h.category === 'adult');
  const quickHabits = standardHabits.slice(0, 6);
  const additionalHabits = standardHabits.slice(6);
  const wording = (h: Habit) => checkinWording(h, habitName(h), masked);

  const handleLog = () => {
    if (savingRef.current || count === 0) return;
    // One moment for the whole batch: now, or the chosen date and time.
    const now = new Date();
    const moment = useCustomTime
      ? { date: customDate, time: customTime, timestamp: new Date(`${customDate}T${customTime}:00`).getTime() }
      : { date: formatDate(now), time: formatTime(now), timestamp: now.getTime() };
    if (!Number.isFinite(moment.timestamp)) { setError(t('quicklog.checkDate')); return; }
    savingRef.current = true;
    setSaving(true);
    let batch: LogEntry[] | null = null;
    try { batch = logEntries(selectedHabits.map(h => h.id), notes || undefined, moment); } catch { batch = null; }
    setSaving(false);
    if (!batch) {
      // Saved in one write, so a failure means nothing was logged; the selection stays for a retry.
      savingRef.current = false;
      setError(t('quicklog.saveFailed'));
      return;
    }
    setDone({ entries: batch, label: batch.length === 1 ? wording(selectedHabits[0]).noun : t('quicklog.activities', { count: batch.length }), time: moment.time });
    setUndone('');
    setError('');
    setNotes('');
    setUseCustomTime(false);
    setPanel(null);
    setSelectedIds([]);
    setLeaving([]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 8000);
  };

  const undo = () => {
    if (!done) return;
    deleteEntries(done.entries.map(e => e.id));
    setUndone(done.entries.length === 1 ? t('quicklog.entryRemoved', { label: done.label }) : t('quicklog.activitiesRemoved', { count: done.entries.length }));
    setDone(null);
  };

  const actionLabel = count === 0 ? t('quicklog.selectOne') : count === 1 ? t('quicklog.trackOne') : t('quicklog.trackMany', { count });

  return (
    <section id="quick-log" aria-labelledby="quicklog-title" data-fab-hide className="scroll-mt-24">
      <div className="panel relative p-4 sm:p-5">
        <Sprout />
        <header className="pr-12">
          <h2 id="quicklog-title" className="flex items-center gap-2 font-display text-[19px] sm:text-[21px] font-bold tracking-tight leading-tight text-ink">
            <Target size={25} strokeWidth={2.4} className="shrink-0 text-teal-500 dark:text-teal-300" aria-hidden="true" />
            {t('quicklog.title')}
          </h2>
          <p className="mt-1.5 text-[13px] sm:text-sm text-ink-2 leading-snug">{t('quicklog.body')}</p>
        </header>

        <div className="relative mt-3.5 grid grid-cols-3 gap-2" role="group" aria-label={t('quicklog.group')}>
          {quickHabits.map((h, i) => {
            const on = isOn(h.id);
            const color = brandColor(h.color, i);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggle(h.id)}
                aria-pressed={on}
                className={clsx(catTile, masked ? (on ? catOn : catOff) : 'cat-card')}
                style={masked ? undefined : tint(color)}
              >
                <span className={clsx('shrink-0 flex items-center justify-center transition-colors duration-200', masked ? clsx('w-9 h-9 rounded-xl', on ? iconOn : iconOff) : 'cat-glyph w-8 h-8')}>
                  <HabitGlyph habit={h} size={masked ? 19 : 25} className="[stroke-width:2]" />
                </span>
                <span className="max-w-full [overflow-wrap:anywhere]">{habitName(h)}</span>
                {on
                  ? <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-track text-white flex items-center justify-center pop-in shadow-md ring-2 ring-surface dark:ring-surface-2" aria-hidden="true"><Check size={11} strokeWidth={3.25} /></span>
                  : <span className="absolute top-[7px] right-[7px] w-4 h-4 rounded-full border-[1.5px] border-line-strong bg-surface/80 dark:border-white/30 dark:bg-transparent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {additionalHabits.length > 0 && (
          <>
            <select
              value=""
              onChange={e => { const id = e.target.value; if (id && !isOn(id)) toggle(id); }}
              aria-label={t('quicklog.addAnother')}
              className="input mt-2.5 min-h-[48px] text-[15px] text-ink-2"
            >
              <option value="">{t('quicklog.somethingElse', { count: additionalHabits.length })}</option>
              {additionalHabits.map(h => <option key={h.id} value={h.id} disabled={isOn(h.id)}>{isOn(h.id) ? t('quicklog.selectedSuffix', { name: habitName(h) }) : habitName(h)}</option>)}
            </select>
          </>
        )}

        {personalHabits.length > 0 && (
          <details className="group mt-3 rounded-[20px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-surface to-blue-50 open:shadow-card transition-shadow dark:border-violet-400/20 dark:from-violet-500/[0.12] dark:via-surface-2 dark:to-blue-500/[0.08]">
            <summary className="flex min-h-[56px] cursor-pointer list-none select-none items-center justify-between gap-3 pl-2.5 pr-3 text-[15px] font-semibold text-ink hover:bg-white/40 dark:hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-[20px] transition-colors [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-sm" aria-hidden="true"><Lock size={16} strokeWidth={2.25} /></span>
                <span className="min-w-0">
                  <span className="block leading-tight">{t('quicklog.personalHabits')}</span>
                  <span className="block text-xs font-medium text-muted mt-0.5">{t('quicklog.personalSub')}</span>
                </span>
              </span>
              <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-surface ring-1 ring-violet-200 text-violet-600 shadow-sm dark:bg-surface-3 dark:ring-violet-400/25 dark:text-violet-300" aria-hidden="true">
                <ChevronDown size={16} strokeWidth={2.25} className="transition-transform duration-300 group-open:rotate-180" />
              </span>
            </summary>
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 pt-0.5 animate-fade-in" role="group" aria-label={t('quicklog.personalHabits')}>
              {personalHabits.map(h => {
                const on = isOn(h.id);
                return (
                  <button key={h.id} type="button" onClick={() => toggle(h.id)} aria-pressed={on} className={clsx(tileBase, 'min-h-[48px] text-sm', on ? tileOn : tileOff)}>
                    <span className={clsx(iconBoxSm, on ? iconOn : iconOff)}><HabitGlyph habit={h} size={18} /></span>
                    <span className="min-w-0 flex-1 truncate">{habitName(h)}</span>
                    {on && <span className={checkBadge} aria-hidden="true"><Check size={11} strokeWidth={3.25} /></span>}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {/* Selected activities: the count, Clear all, and a removable chip for each one. */}
        <div className="relative mt-3.5">
          <div className="flex items-center justify-between gap-3 min-h-[32px] px-0.5" role="status" aria-live="polite">
            {count === 0 ? (
              <span className="text-[15px] font-bold text-ink">{t('quicklog.nothingSelected')}</span>
            ) : (
              <span className="flex items-center gap-2 text-[15px] font-bold text-ink">
                {t('quicklog.selectedActivities')}
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-track text-white text-[13px] tabular-nums" aria-hidden="true">{count}</span>
                <span className="sr-only">{t('quicklog.selectedCount', { count })}</span>
              </span>
            )}
            {count > 0 && (
              <button type="button" onClick={() => deselect(selectedIds)} className="min-h-[36px] px-2 -mr-1 rounded-lg text-sm font-semibold text-brand-text hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                {t('quicklog.clearAll')}
              </button>
            )}
          </div>
          {chipHabits.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-2.5" aria-label={t('quicklog.selectedActivities')}>
              {chipHabits.map(h => {
                const out = !isOn(h.id);
                return (
                  <li key={h.id} className={clsx('max-w-full', out ? 'chip-out' : 'chip-in')} aria-hidden={out || undefined}>
                    <button
                      type="button"
                      onClick={() => deselect([h.id])}
                      disabled={out}
                      tabIndex={out ? -1 : undefined}
                      aria-label={t('quicklog.remove', { name: habitName(h) })}
                      className={clsx(chipBase, masked ? chipMasked : 'cat-chip')}
                      style={masked ? undefined : tint(colorOf(h))}
                    >
                      <HabitGlyph habit={h} size={16} className={clsx('shrink-0 [stroke-width:2.25]', masked ? 'text-ink-2' : 'cat-glyph')} />
                      <span className="min-w-0 truncate">{habitName(h)}</span>
                      <span className={clsx('w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center transition-colors', masked ? 'bg-surface-3 text-ink-2 dark:bg-white/10' : 'cat-chip-x')} aria-hidden="true">
                        <X size={13} strokeWidth={2.75} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="relative mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
          <button
            type="button"
            onClick={() => togglePanel('note')}
            aria-expanded={panel === 'note'}
            className={clsx('min-w-0 flex items-center gap-2.5 min-h-[44px] px-3.5 rounded-2xl border text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              panel === 'note' ? 'border-brand/50 bg-brand-soft text-ink' : 'border-line bg-surface-2 text-ink-2 hover:text-ink hover:border-line-strong dark:bg-white/[0.04]')}
          >
            <PencilLine size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{notes.trim() ? notes.trim() : t('quicklog.addNote')}</span>
          </button>
          <button
            type="button"
            onClick={() => togglePanel('time')}
            aria-expanded={panel === 'time'}
            aria-label={t('quicklog.timeLabel', { value: useCustomTime ? `${formatDateStyle(customDate, 'medium')} ${customTime}` : t('quicklog.timeNow') })}
            className={clsx('flex items-center gap-2 min-h-[44px] pl-3 pr-2.5 rounded-2xl border text-[15px] font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              panel === 'time' ? 'border-brand/50 bg-brand-soft text-ink' : 'border-line bg-surface text-ink hover:border-line-strong dark:bg-white/[0.04]')}
          >
            <CalendarClock size={18} className="shrink-0 text-muted" aria-hidden="true" />
            {timeLabel}
            <ChevronDown size={16} className={clsx('shrink-0 text-muted transition-transform', panel === 'time' && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>

        {panel && (
          <div ref={optionsRef} className="relative mt-2.5 space-y-2.5 animate-fade-in">
            {panel === 'note' ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('quicklog.optionalNote')} aria-label={t('quicklog.note')} rows={2} className="input resize-none text-[15px]" autoFocus />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" aria-label={t('quicklog.date')} value={customDate} onChange={e => { setCustomDate(e.target.value); setUseCustomTime(true); }} max={formatDate(new Date())} className="input" />
                  <input type="time" aria-label={t('quicklog.time')} value={customTime} onChange={e => { setCustomTime(e.target.value); setUseCustomTime(true); }} className="input" />
                </div>
                <p className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>{useCustomTime ? t('quicklog.savedWithTime') : t('quicklog.savedWithNow')}</span>
                  {useCustomTime && <button type="button" onClick={() => setUseCustomTime(false)} className="min-h-[36px] px-2 -mr-2 rounded-lg font-semibold text-brand-text hover:bg-brand-soft">{t('quicklog.useNow')}</button>}
                </p>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleLog}
          disabled={count === 0 || saving}
          aria-busy={saving || undefined}
          className={clsx(
            'relative mt-3.5 w-full flex items-center justify-center gap-2 min-h-[52px] rounded-2xl text-base font-bold transition-[background-color,box-shadow,transform,color] duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
            count > 0
              ? 'btn-track active:scale-[0.97] disabled:opacity-70'
              : 'cursor-not-allowed border border-line bg-surface-3/70 text-muted dark:bg-white/[0.05]'
          )}
        >
          {count > 0
            ? <><Check size={18} strokeWidth={2.75} aria-hidden="true" />{actionLabel}</>
            : <><Pointer size={17} aria-hidden="true" />{actionLabel}</>}
        </button>

        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-bad-soft px-3 py-2.5 text-sm text-bad">
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" />{error}
          </p>
        )}

        <div aria-live="polite">
          {done && (
            <p className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-good-soft px-3 py-2.5 text-sm text-good animate-fade-in">
              <span className="flex items-center gap-2 min-w-0">
                <Check size={16} strokeWidth={2.75} className="shrink-0 pop-in" aria-hidden="true" />
                <span className="truncate">{t('quicklog.trackedAt', { label: done.label, time: done.time })}</span>
              </span>
              <button type="button" onClick={undo} className="shrink-0 rounded-lg px-2 py-1 font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-good">
                {t('quicklog.undo')}
              </button>
            </p>
          )}
          {undone && <p className="mt-3 text-sm text-muted">{undone}</p>}
        </div>
      </div>
    </section>
  );
}
