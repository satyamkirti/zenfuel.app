'use client';

import { useEffect, useState } from 'react';
import { Trophy, Play, Square, CheckCircle2, AlertCircle, Plus, Medal, Flame, Clock, RotateCcw, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { IconTile } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { HabitGlyph } from '@/components/dashboard/HabitGlyph';
import { MountainScene } from '@/components/scene/MountainScene';
import { Celebration } from '@/components/ui/Celebration';
import { Button } from '@/components/ui/Button';
import { Challenge } from '@/types';
import { computeChallengeProgress } from '@/utils/challenges';
import { Modal } from '@/components/ui/Modal';
import { usePrivacy } from '@/context/PrivacyContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChallengeArt, challengeArtKind } from '@/components/ui/Illustrations';
import { useT } from '@/i18n/I18nProvider';
import { isBuildHabit } from '@/lib/habits/templates';
import { formatDisplayDate } from '@/utils/dateUtils';

// How demanding a challenge is, from its length alone.
function difficulty(days: number) {
  return days <= 7 ? { label: 'challenges.level.starter', bars: 1 } as const : days <= 21 ? { label: 'challenges.level.steady', bars: 2 } as const : { label: 'challenges.level.committed', bars: 3 } as const;
}

export default function ChallengesPage() {
  const { challenges, habits: allHabits, reductionEntries: entries, startChallenge, stopChallenge, completeChallenge, addChallenge } = useApp();
  const t = useT();
  // Challenges are about going without a habit, so good habits are not offered.
  const habits = allHabits.filter(h => !isBuildHabit(h));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHabitId, setNewHabitId] = useState(habits[0]?.id ?? '');
  const [newDays, setNewDays] = useState(7);
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);
  // The challenge just completed, for a short celebration.
  const [celebrating, setCelebrating] = useState<string | null>(null);
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(null), 1600);
    return () => clearTimeout(timer);
  }, [celebrating]);
  const { challengeName, challengeDescription, habitName, masked } = usePrivacy();

  // Habits load after the first render (e.g. on a hard refresh); fall back to the first habit.
  const selectedHabitId = newHabitId === 'all' || habits.some(h => h.id === newHabitId) ? newHabitId : habits[0]?.id ?? 'all';

  useEffect(() => {
    if (!confirmStopId) return;
    const timer = setTimeout(() => setConfirmStopId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmStopId]);

  const handleStop = (id: string) => {
    if (confirmStopId === id) { stopChallenge(id); setConfirmStopId(null); }
    else setConfirmStopId(id);
  };

  const habitMap = new Map(allHabits.map(h => [h.id, h]));
  const active = challenges.filter(c => c.isActive);
  const available = challenges.filter(c => !c.isActive && !c.isCompleted);
  const completed = challenges.filter(c => c.isCompleted);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addChallenge({
      name: newName.trim(),
      description: newDesc.trim(),
      habitId: selectedHabitId,
      durationDays: newDays,
      startDate: null,
      isActive: false,
      isCompleted: false,
      isBuiltIn: false,
    });
    setNewName(''); setNewDesc(''); setShowAddModal(false);
  };

  const renderCard = (c: Challenge, index: number) => {
    const progress = computeChallengeProgress(c, entries);
    const habit = c.habitId === 'all' ? null : habitMap.get(c.habitId);
    const pct = Math.min(100, progress.percentage);
    const target = c.habitId === 'all' ? t('challenges.everything') : habitName(habit, c.habitId);
    // One segment per day for challenges up to 30 days; a plain bar beyond that.
    const segments = c.durationDays <= 30 ? Array.from({ length: c.durationDays }, (_, i) => i < progress.daysDone) : null;
    const kind = challengeArtKind(c.habitId, habit?.category, masked);
    const level = difficulty(c.durationDays);
    const broken = c.isActive && progress.isViolated;

    return (
      <div key={c.id} className={clsx('relative card overflow-hidden flex flex-col', c.isActive && !broken && 'ring-1 ring-orange-400/50', c.isCompleted && 'ring-1 ring-good/30')}>
        {/* A banner per kind of challenge, so the list never repeats one picture. */}
        <div className="relative h-[112px] overflow-hidden bg-[#071a40]">
          {kind === 'summit'
            ? <MountainScene still banner flag sunShift={((index * 47) % 120) - 70} className="absolute inset-0 w-full h-full" />
            : <ChallengeArt kind={kind} className="absolute inset-0 w-full h-full" />}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#071a40]/70 to-transparent" aria-hidden="true" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#071a40]/75 ring-1 ring-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"><Clock size={11} aria-hidden="true" />{t('common.days', { count: c.durationDays })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#071a40]/75 ring-1 ring-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
              <span className="flex items-end gap-[2px] h-2.5" aria-hidden="true">
                {[1, 2, 3].map(b => <span key={b} className={clsx('w-[3px] rounded-sm', b <= level.bars ? 'bg-yellow-300' : 'bg-white/25')} style={{ height: `${b * 33}%` }} />)}
              </span>
              {t(level.label)}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            {c.isActive && (broken
              ? <span className="pill-bad ring-1 ring-black/20">{t('challenges.broken')}</span>
              : <span className="pill-accent ring-1 ring-black/20"><Flame size={11} aria-hidden="true" />{t('challenges.active')}</span>)}
            {c.isCompleted && <span className="pill-good ring-1 ring-black/20"><CheckCircle2 size={11} aria-hidden="true" />{t('challenges.completed')}</span>}
          </div>
          {c.isCompleted && (
            <span className={clsx('absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-charcoal-950 flex items-center justify-center shadow-glow', celebrating === c.id && 'achieve-glow pop-in')} aria-hidden="true">
              <Medal size={28} strokeWidth={2} />
            </span>
          )}
        </div>
        {celebrating === c.id && <Celebration />}

        <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
          <div className="flex items-start gap-3.5">
            {c.isActive && (
              <ProgressRing value={pct / 100} size={60} stroke={6} tone={broken ? 'bad' : 'warm'} label={t('challenges.percentComplete', { pct })}>
                <span className="num text-[14px] font-bold text-ink">{pct}%</span>
              </ProgressRing>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[17px] font-semibold text-ink leading-snug break-words">{challengeName(c)}</h3>
              <p className="text-sm text-muted mt-0.5 leading-relaxed">{challengeDescription(c)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1 font-medium text-ink-2">{habit && !masked ? <HabitGlyph habit={habit} size={13} /> : <Target size={13} aria-hidden="true" />}{target}</span>
                {c.isBuiltIn ? <><span aria-hidden="true">·</span><span>{t('challenges.builtIn')}</span></> : <><span aria-hidden="true">·</span><span className="text-info font-semibold">{t('challenges.custom')}</span></>}
              </p>
            </div>
          </div>

          {c.isActive && (
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-ink-2">{t('challenges.dayOf', { day: Math.min(progress.daysDone + 1, c.durationDays), total: c.durationDays })}</span>
                <span className="text-muted">{t('challenges.daysLeft', { count: progress.daysLeft })}</span>
              </div>
              {segments ? (
                <div className="flex gap-[3px]" aria-hidden="true">
                  {segments.map((done, i) => (
                    <span key={i} style={{ animationDelay: `${i * 30}ms` }} className={clsx('h-2 flex-1 rounded-full', done && 'grow-x', done ? (broken ? 'bg-bad' : 'bg-gradient-to-r from-yellow-400 to-orange-500') : 'bg-surface-3 dark:bg-white/[0.07]')} />
                  ))}
                </div>
              ) : (
                <div className="track" aria-hidden="true"><div className={broken ? 'bar-bad' : 'bar-accent'} style={{ width: `${pct}%` }} /></div>
              )}
              {broken && (
                <p className="text-xs text-bad mt-2 flex items-center gap-1">
                  <AlertCircle size={12} aria-hidden="true" /> {t('challenges.brokenOn', { date: progress.violationDate ? formatDisplayDate(progress.violationDate) : '' })}
                </p>
              )}
              {!broken && progress.percentage >= 100 && (
                <p className="text-xs text-good mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} aria-hidden="true" /> {t('challenges.reachedLast')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-auto">
            {!c.isActive && !c.isCompleted && (
              <Button size="lg" className="flex-1" icon={<Play size={15} />} onClick={() => startChallenge(c.id)}>{t('challenges.start')}</Button>
            )}
            {c.isActive && (
              <>
                {progress.percentage >= 100 && !broken && (
                  <Button size="lg" className="flex-1" icon={<CheckCircle2 size={15} />} onClick={() => { completeChallenge(c.id); setCelebrating(c.id); }}>{t('challenges.markComplete')}</Button>
                )}
                {broken && (
                  <Button size="lg" className="flex-1" icon={<RotateCcw size={15} />} onClick={() => startChallenge(c.id)}>{t('challenges.startAgain')}</Button>
                )}
                <Button size="lg" variant={confirmStopId === c.id ? 'danger' : 'outline'} className={progress.percentage >= 100 || broken ? '' : 'flex-1'} icon={<Square size={13} />} onClick={() => handleStop(c.id)}>
                  {confirmStopId === c.id ? t('challenges.stopConfirm') : t('challenges.stop')}
                </Button>
              </>
            )}
            {c.isCompleted && (
              <Button size="lg" variant="outline" className="flex-1" icon={<RotateCcw size={15} />} onClick={() => startChallenge(c.id)}>{t('challenges.again')}</Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout title={t('challenges.title')}>
      <div className="space-y-6">
        <PageHeader
          icon={<Trophy size={21} />}
          tone="orange"
          title={t('challenges.title')}
          description={t('challenges.desc', { active: active.length, completed: completed.length })}
          actions={<Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>{t('challenges.create')}</Button>}
        />

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {([
            [t('challenges.statActive'), active.length, Flame, 'amber'],
            [t('challenges.statCompleted'), completed.length, Medal, 'emerald'],
            [t('challenges.statAvailable'), available.length, Target, 'teal'],
          ] as const).map(([name, n, Icon, tone]) => (
            <div key={name} className="card p-3 sm:p-4 flex flex-col gap-2">
              <IconTile tone={tone} size="sm"><Icon size={15} /></IconTile>
              <div className="min-w-0 flex flex-col-reverse">
                <dt className="mt-1 text-xs font-medium text-muted">{name}</dt>
                <dd className="num text-[22px] font-bold text-ink leading-none">{n}</dd>
              </div>
            </div>
          ))}
        </dl>

        {active.length > 0 && (
          <div>
            <h2 className="section-heading mb-3">{t('challenges.sectionActive')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 rise">
              {active.map((c, i) => renderCard(c, i))}
            </div>
          </div>
        )}

        {available.length > 0 && (
          <div>
            <h2 className="section-heading mb-3">{t('challenges.sectionStart')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 rise">
              {available.map((c, i) => renderCard(c, i + active.length))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="section-heading mb-3">{t('challenges.sectionCompleted')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 rise">
              {completed.map((c, i) => renderCard(c, i + active.length + available.length))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('challenges.createTitle')} size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="challenge-name" className="block text-xs font-medium text-muted mb-1">{t('challenges.name')}</label>
            <input id="challenge-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('challenges.namePlaceholder')} className="input" />
          </div>
          <div>
            <label htmlFor="challenge-desc" className="block text-xs font-medium text-muted mb-1">{t('challenges.description')}</label>
            <input id="challenge-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t('challenges.descPlaceholder')} className="input" />
          </div>
          <div>
            <label htmlFor="challenge-habit" className="block text-xs font-medium text-muted mb-1">{t('challenges.habit')}</label>
            <select id="challenge-habit" value={selectedHabitId} onChange={e => setNewHabitId(e.target.value)} className="input">
              <option value="all">{t('challenges.allHabits')}</option>
              {habits.map(h => <option key={h.id} value={h.id}>{habitName(h)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="challenge-days" className="block text-xs font-medium text-muted mb-1">{t('challenges.duration')}</label>
            <input id="challenge-days" type="number" value={newDays} onChange={e => setNewDays(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={365} className="input" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>{t('challenges.createButton')}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
