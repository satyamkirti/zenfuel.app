'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Lock, Flame, CircleCheck, CalendarDays, Trophy, Check, Info, ListChecks, GripVertical, ArrowUp, ArrowDown, Sprout } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { HabitModal, AddHabitModal } from '@/components/habits/HabitModal';
import { habitsFromTemplates } from '@/components/habits/TemplatePicker';
import { HabitGlyph } from '@/components/dashboard/HabitGlyph';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { Habit } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconTile, Tone } from '@/components/ui/Card';
import { habitTodayStats, lastNDays } from '@/utils/habitStats';
import { brandColor, onColor } from '@/utils/palette';
import { useDragReorder } from '@/hooks/useDragReorder';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/translate';
import { goalSummary } from '@/i18n/labels';
import { isBuildHabit, templatesToAdd, TemplateId } from '@/lib/habits/templates';
import { getStartOfMonth } from '@/utils/dateUtils';

export default function HabitsPage() {
  const { habits, entries, habitAnalytics, addHabit, addHabits, updateHabit, deleteHabit, reorderHabits, isPremium } = useApp();
  const { t, locale } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const { habitName, masked } = usePrivacy();

  // Reordering: drag a card by its handle, or tap the handle for Move up / Move down buttons
  // (arrow keys also work on a focused handle). The order is saved on this device.
  const [arrangeId, setArrangeId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const habitById = useMemo(() => new Map(habits.map(h => [h.id, h])), [habits]);
  const refocus = useRef<HTMLElement | null>(null);
  const { order, dragId, itemRef, handleProps, move } = useDragReorder(
    habits.map(h => h.id),
    ids => { reorderHabits(ids); },
    id => setArrangeId(a => (a === id ? null : id)),
    (id, index) => {
      const h = habitById.get(id);
      if (h) setAnnouncement(t('habits.moved', { name: habitName(h), position: index + 1, total: habits.length }));
      // Keep keyboard focus on the control that moved the card (the card's DOM node moves).
      const el = refocus.current ?? (document.activeElement as HTMLElement | null);
      refocus.current = null;
      requestAnimationFrame(() => {
        if (el && el.isConnected && !(el as HTMLButtonElement).disabled) el.focus();
        else document.getElementById(`reorder-${id}`)?.focus();
      });
    },
  );
  const ordered = order.map(id => habitById.get(id)).filter((h): h is Habit => !!h);

  // Habits being reduced use the reduction analytics; good habits use their own simple counts.
  const analyticsMap = new Map(habitAnalytics.map(h => [h.habitId, h]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => new Map(habitTodayStats(habits, entries).map(s => [s.habit.id, s])), [habits, entries, locale]);
  const goodTotals = useMemo(() => {
    const monthStart = getStartOfMonth().getTime();
    const totals = new Map<string, { total: number; month: number }>();
    for (const h of habits.filter(isBuildHabit)) totals.set(h.id, { total: 0, month: 0 });
    for (const e of entries) {
      const c = totals.get(e.habitId);
      if (!c) continue;
      c.total++;
      if (e.timestamp >= monthStart) c.month++;
    }
    return totals;
  }, [habits, entries]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dayLabels = useMemo(() => lastNDays([], 7).map(d => d.label), [locale]);
  const FREE_LIMIT = 3;
  const atFreeLimit = !isPremium && habits.length >= FREE_LIMIT;

  // Page summary, from the user's own activity (habits being reduced).
  const reducing = habits.filter(h => !isBuildHabit(h));
  const all = [...today.values()].filter(s => !isBuildHabit(s.habit));
  const clearToday = all.filter(s => s.today === 0).length;
  const bestStreak = all.filter(s => s.hasHistory).reduce((m, s) => Math.max(m, s.streak), 0);
  const monthTotal = habitAnalytics.reduce((sum, h) => sum + h.monthCount, 0) + [...goodTotals.values()].reduce((sum, c) => sum + c.month, 0);
  // Habits never tracked get one shared note above the list, not the same paragraph on every card.
  const unlogged = habits.filter(h => !(isBuildHabit(h) ? goodTotals.get(h.id)?.total : analyticsMap.get(h.id)?.lifetimeCount)).length;

  const handleSave = (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => {
    if (editingHabit) { updateHabit(editingHabit.id, data); }
    else { const h = addHabit(data); setNotice(t('habits.added', { name: habitName(h) })); }
    setEditingHabit(null);
  };

  const handleAddTemplates = (ids: TemplateId[]) => {
    const toAdd = templatesToAdd(ids, habits.map(h => h.templateId));
    if (toAdd.length === 0) return true;
    const added = addHabits(habitsFromTemplates(toAdd, t));
    if (added.length === 0) return false;
    setNotice(t('template.added', { count: added.length }));
    return true;
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) { deleteHabit(id); setConfirmDeleteId(null); }
    else { setConfirmDeleteId(id); setTimeout(() => setConfirmDeleteId(null), 3000); }
  };

  const handleAddClick = () => {
    if (atFreeLimit) return;
    setEditingHabit(null);
    setShowAdd(true);
  };

  const kpis: { label: string; icon: typeof Flame; tone: Tone; value: React.ReactNode }[] = [
    { label: t('habits.kpiClear'), icon: CircleCheck, tone: 'emerald', value: <>{clearToday}<span className="text-sm text-muted font-semibold">/{reducing.length}</span></> },
    { label: t('habits.kpiBestStreak'), icon: Trophy, tone: 'orange', value: <>{bestStreak}<span className="text-sm text-muted font-semibold"> {t('habits.dayUnit', { count: bestStreak })}</span></> },
    { label: t('habits.kpiMonth'), icon: CalendarDays, tone: 'teal', value: monthTotal },
  ];

  const description = t('habits.count', { count: habits.length }) + (!isPremium ? ` · ${t('habits.freePlanSuffix', { count: FREE_LIMIT })}` : '');

  return (
    <AppLayout title={t('habits.title')}>
      <div className="space-y-5">
        <PageHeader
          icon={<ListChecks size={21} />}
          tone="teal"
          title={t('habits.title')}
          description={description}
          actions={atFreeLimit ? (
            <Link href="/upgrade" className="flex items-center gap-1.5 px-4 py-2 btn-primary rounded-xl text-sm">
              <Lock size={13} /> {t('habits.upgradeForMore')}
            </Link>
          ) : (
            <Button size="sm" icon={<Plus size={15} />} onClick={handleAddClick}>{t('habits.add')}</Button>
          )}
        />

        {atFreeLimit && (
          <UpgradeBanner
            message={t('habits.limitReached', { count: FREE_LIMIT })}
            cta={t('habits.limitCta')}
            variant="prominent"
            dismissKey="habits-limit"
          />
        )}

        {!isPremium && !atFreeLimit && habits.length > 0 && (
          <UpgradeBanner
            message={t('habits.limitCounter', { used: habits.length, limit: FREE_LIMIT })}
            dismissKey="habits-counter"
          />
        )}

        <p className="sr-only" role="status" aria-live="polite">{notice}</p>
        {notice && (
          <p className="flex items-center gap-2 rounded-xl bg-good-soft px-3 py-2.5 text-sm text-good animate-fade-in" aria-hidden="true">
            <Check size={16} strokeWidth={2.75} className="shrink-0" />{notice}
          </p>
        )}

        {habits.length > 0 && (
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {kpis.map(({ label, icon: Icon, tone, value }) => (
              <div key={label} className="card p-3 sm:p-4 flex flex-col gap-2">
                <IconTile tone={tone} size="sm"><Icon size={15} /></IconTile>
                <div className="min-w-0 flex flex-col-reverse">
                  <dt className="mt-1 text-xs font-medium text-muted">{label}</dt>
                  <dd className="num text-[22px] leading-none font-bold text-ink whitespace-nowrap">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {unlogged > 0 && (
          <p className="flex gap-2.5 rounded-2xl bg-surface-2/70 border border-line px-3.5 py-3 text-sm text-ink-2 leading-relaxed">
            <Info size={16} className="shrink-0 mt-0.5 text-brand-text" aria-hidden="true" />
            <span>{unlogged === 1 ? t('habits.unloggedOne') : t('habits.unloggedMany', { count: unlogged })}</span>
          </p>
        )}

        {habits.length > 1 && (
          <p className="flex items-center gap-1.5 px-1 -mb-1 text-xs text-muted">
            <GripVertical size={14} aria-hidden="true" />
            {t('habits.dragHint')}
          </p>
        )}
        <p id="reorder-help" className="sr-only">{t('habits.reorderHelp')}</p>
        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 rise">
          {ordered.map((habit, i) => {
            const good = isBuildHabit(habit);
            const ha = analyticsMap.get(habit.id);
            const gt = goodTotals.get(habit.id);
            const st = today.get(habit.id);
            const color = brandColor(habit.color, i);
            const clearDays = st ? st.week.filter(n => n === 0).length : 0;
            const doneDays = st ? st.week.filter(n => n > 0).length : 0;
            const lifetime = good ? gt?.total ?? 0 : ha?.lifetimeCount ?? 0;
            const month = good ? gt?.month ?? 0 : ha?.monthCount ?? 0;
            const logged = lifetime > 0;
            const streak = ha?.streak.currentStreak ?? 0;
            const goal = goalSummary(t, habit.goal);
            return (
              <li
                key={habit.id}
                ref={itemRef(habit.id)}
                className={clsx('card p-4 sm:p-5 flex flex-col', dragId === habit.id && 'relative z-30 !shadow-pop ring-2 ring-brand/50 will-change-transform select-none')}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    id={`reorder-${habit.id}`}
                    {...handleProps(habit.id)}
                    aria-label={t('habits.reorderLabel', { name: habitName(habit), position: i + 1, total: ordered.length })}
                    aria-describedby="reorder-help"
                    aria-expanded={arrangeId === habit.id}
                    className={clsx(
                      '-ml-2 w-8 h-11 shrink-0 flex items-center justify-center rounded-lg select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      dragId === habit.id ? 'cursor-grabbing text-brand-text bg-brand-soft' : 'cursor-grab text-muted hover:text-ink hover:bg-surface-2'
                    )}
                  >
                    <GripVertical size={18} aria-hidden="true" />
                  </button>
                  <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: `${color}24`, color }}>
                    <HabitGlyph habit={habit} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[16px] font-semibold text-ink truncate">{habitName(habit)}</h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                      {!masked && <span className={clsx(good && 'text-good font-semibold')}>{t(`category.${habit.category}` as MessageKey)}</span>}
                      {!masked && !habit.isDefault && !good && <span aria-hidden="true">·</span>}
                      {!habit.isDefault && !good && <span className="text-info font-semibold">{t('habits.custom')}</span>}
                      {masked && habit.isDefault && <span>{t('habits.habit')}</span>}
                    </p>
                  </div>
                  <div className="flex -mr-1.5">
                    <button onClick={() => { setEditingHabit(habit); setShowModal(true); }} aria-label={t('habits.editName', { name: habitName(habit) })} className="w-11 h-11 flex items-center justify-center rounded-xl btn-ghost text-muted hover:text-ink"><Edit3 size={17} aria-hidden="true" /></button>
                    {!habit.isDefault && (
                      <button onClick={() => handleDelete(habit.id)} aria-label={confirmDeleteId === habit.id ? t('habits.confirmDeleteName', { name: habitName(habit) }) : t('habits.deleteName', { name: habitName(habit) })} className={clsx('w-11 h-11 flex items-center justify-center rounded-xl transition-colors', confirmDeleteId === habit.id ? 'bg-bad-soft text-bad' : 'btn-ghost text-muted hover:text-bad')}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Today's state: clear and the clean streak (habits being reduced), or done and the
                    goal (good habits). */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  {good ? (
                    <>
                      {st && (st.today > 0
                        ? <span className="pill-good"><CircleCheck size={12} aria-hidden="true" />{habit.goal?.kind === 'count' && habit.goal.count ? t('goal.todayCount', { done: st.today, target: habit.goal.count }) : t('habits.doneToday')}</span>
                        : <span className="pill-neutral">{t('habits.notYetToday')}</span>)}
                      {goal && <span className="pill-info"><Sprout size={12} aria-hidden="true" />{goal}</span>}
                    </>
                  ) : (
                    <>
                      {st && (st.today === 0
                        ? <span className="pill-good pop-in"><CircleCheck size={12} aria-hidden="true" />{t('habits.clearToday')}</span>
                        : <span className="pill-warn">{t('habits.trackedToday', { count: st.today })}</span>)}
                      {logged
                        ? streak > 0
                          ? <span className="pill-accent"><Flame size={12} aria-hidden="true" />{t('habits.streak', { count: streak })}</span>
                          : <span className="pill-neutral">{t('habits.streakTomorrow')}</span>
                        : <span className="pill-neutral">{t('habits.noActivity')}</span>}
                    </>
                  )}
                </div>

                {logged && st && (
                  <div className="mt-4">
                    <div className="grid grid-cols-7 gap-1" role="img" aria-label={good ? t('habits.weekAriaGood', { done: doneDays, list: st.week.join(', ') }) : t('habits.weekAria', { clear: clearDays, list: st.week.join(', ') })}>
                      {st.week.map((n, d) => (
                        <div key={d} className="flex flex-col items-center gap-1.5">
                          {n === 0 ? (
                            good
                              ? <span className="w-8 h-8 rounded-full bg-surface-2 ring-1 ring-inset ring-line dark:bg-white/[0.04]" />
                              : <span className="w-8 h-8 rounded-full flex items-center justify-center bg-good-soft text-good ring-1 ring-inset ring-good/25 pop-in" style={{ animationDelay: `${d * 35}ms` }}>
                                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                                </span>
                          ) : (
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold pop-in" style={{ background: color, color: onColor(color), animationDelay: `${d * 35}ms` }}>
                              {n}
                            </span>
                          )}
                          <span className={clsx('text-[10.5px]', d === 6 ? 'font-bold text-ink' : 'text-muted')} aria-hidden="true">{d === 6 ? t('habits.today') : dayLabels[d]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="track h-1.5 flex-1" aria-hidden="true"><div className="bar-good" style={{ width: `${((good ? doneDays : clearDays) / 7) * 100}%` }} /></div>
                      <span className="shrink-0 text-xs font-semibold text-ink-2">{good ? t('habits.doneOf7', { count: doneDays }) : t('habits.clearOf7', { count: clearDays })}</span>
                    </div>
                    <p className="mt-2.5 text-xs text-muted">{t('habits.totals', { total: lifetime, month })}</p>
                  </div>
                )}
                {arrangeId === habit.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-surface-2 p-2 animate-fade-in dark:bg-white/[0.04]">
                    <Button size="sm" variant="outline" icon={<ArrowUp size={15} aria-hidden="true" />} disabled={i === 0}
                      onClick={e => { refocus.current = e.currentTarget; move(habit.id, -1); }}>{t('habits.moveUp')}</Button>
                    <Button size="sm" variant="outline" icon={<ArrowDown size={15} aria-hidden="true" />} disabled={i === ordered.length - 1}
                      onClick={e => { refocus.current = e.currentTarget; move(habit.id, 1); }}>{t('habits.moveDown')}</Button>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setArrangeId(null); requestAnimationFrame(() => document.getElementById(`reorder-${habit.id}`)?.focus()); }}>{t('common.done')}</Button>
                  </div>
                )}
                {confirmDeleteId === habit.id && (
                  <p role="status" className="mt-3 text-xs text-bad text-center">{t('habits.deleteConfirm')}</p>
                )}
              </li>
            );
          })}

          {!atFreeLimit && (
            <li>
              <button onClick={handleAddClick} className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-line-strong rounded-card hover:border-brand hover:bg-brand-soft/40 transition-[transform,box-shadow,background-color,border-color,color,opacity] text-muted hover:text-brand-text">
                <IconTile tone="teal" size="lg"><Plus size={20} /></IconTile>
                <span className="text-sm font-semibold">{t('habits.addCard')}</span>
                <span className="text-xs">{t('habits.addCardSub')}</span>
              </button>
            </li>
          )}

          {atFreeLimit && (
            <li>
              <Link href="/upgrade" className="h-full min-h-[120px] flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-card bg-accent-soft/50 transition-[transform,box-shadow,background-color,border-color,color,opacity] text-accent-text">
                <Lock size={22} />
                <span className="text-sm font-semibold">{t('habits.upgradeToAdd')}</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      {showAdd && (
        <AddHabitModal
          existingTemplateIds={habits.map(h => h.templateId ?? '').filter(Boolean)}
          onClose={() => setShowAdd(false)}
          onAddTemplates={handleAddTemplates}
          onCustom={() => { setShowAdd(false); setEditingHabit(null); setShowModal(true); }}
        />
      )}
      {showModal && (
        <HabitModal habit={editingHabit} onClose={() => { setShowModal(false); setEditingHabit(null); }} onSave={handleSave} />
      )}
    </AppLayout>
  );
}
