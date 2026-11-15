'use client';

import { useEffect, useState } from 'react';
import { HabitTile } from '@/components/dashboard/HabitGlyph';
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Goal, GoalType } from '@/types';
import { computeGoalProgress } from '@/utils/goals';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/dateUtils';
import { usePrivacy } from '@/context/PrivacyContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/i18n/I18nProvider';
import { isBuildHabit } from '@/lib/habits/templates';

const GOAL_TYPES: GoalType[] = ['max_per_week', 'streak_days', 'free_for_days', 'reduce_by_percent'];

export default function GoalsPage() {
  const { goals, habits: allHabits, reductionEntries: entries, addGoal, updateGoal, deleteGoal } = useApp();
  const t = useT();
  // Goals are limits and streaks for habits being reduced, so good habits are not offered.
  const habits = allHabits.filter(h => !isBuildHabit(h));
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHabitId, setNewHabitId] = useState(habits[0]?.id ?? '');
  const [newType, setNewType] = useState<GoalType>('streak_days');
  const [newTarget, setNewTarget] = useState(7);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { goalName, habitName, habitIcon, masked } = usePrivacy();

  // Habits load after the first render (e.g. on a hard refresh); fall back to the first habit
  // so a goal is never saved without one.
  const selectedHabitId = habits.some(h => h.id === newHabitId) ? newHabitId : habits[0]?.id ?? '';

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) { deleteGoal(id); setConfirmDeleteId(null); }
    else setConfirmDeleteId(id);
  };

  const habitMap = new Map(allHabits.map(h => [h.id, h]));
  const active = goals.filter(g => g.isActive);
  const inactive = goals.filter(g => !g.isActive);

  const handleAdd = () => {
    if (!newName.trim() || !selectedHabitId) return;
    addGoal({ name: newName.trim(), habitId: selectedHabitId, type: newType, targetValue: newTarget, startDate: formatDate(new Date()), isActive: true });
    setNewName(''); setShowAdd(false);
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progress = computeGoalProgress(goal, entries);
    const habit = habitMap.get(goal.habitId);
    const typeLabel = t(`goals.type.${goal.type}`);

    return (
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <HabitTile id={goal.habitId} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink break-words">{goalName(goal)}</h3>
              {progress.isAchieved && <Badge variant="success">{t('goals.achieved')}</Badge>}
              {!goal.isActive && <Badge variant="default">{t('goals.inactive')}</Badge>}
            </div>
            <p className="text-xs text-muted mt-0.5">{habitName(habit, goal.habitId)} · {typeLabel} · {t('goals.target', { value: goal.targetValue })}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => updateGoal(goal.id, { isActive: !goal.isActive })} className="min-h-[36px] px-2.5 rounded-lg btn-ghost text-xs font-medium">
              {goal.isActive ? t('goals.pause') : t('goals.resume')}
            </button>
            {confirmDeleteId === goal.id ? (
              <button onClick={() => handleDelete(goal.id)} aria-label={t('goals.confirmDelete')} className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                <Trash2 size={13} aria-hidden="true" /> {t('history.deleteQ')}
              </button>
            ) : (
              <button onClick={() => handleDelete(goal.id)} aria-label={t('goals.delete')} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors">
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted">{progress.label}</span>
            <span className={`tabular-nums font-semibold ${progress.isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink'}`}>{progress.percentage}%</span>
          </div>
          <div className="track">
            <div
              className={`h-full rounded-full transition-[width] duration-500 grow-x ${progress.isAchieved ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-blue-500'}`}
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
        </div>

        {progress.isAchieved && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} aria-hidden="true" />
            {t('goals.achievedNote')}
          </div>
        )}
      </Card>
    );
  };

  return (
    <AppLayout title={t('goals.title')}>
      <div className="space-y-6">
        <PageHeader
          icon={<Target size={21} />}
          tone="violet"
          title={t('goals.title')}
          description={t('goals.desc', { count: active.length })}
          actions={<Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>{t('goals.set')}</Button>}
        />

        {goals.length === 0 && (
          <Card padding="none">
            <EmptyState
              tone="violet"
              icon={<Target size={22} />}
              title={t('goals.emptyTitle')}
              description={t('goals.emptyBody')}
              action={<Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>{t('goals.setFirst')}</Button>}
            />
          </Card>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">{t('goals.active')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}

        {inactive.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">{t('goals.paused')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inactive.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('goals.newTitle')} size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-xs font-medium text-muted mb-1">{t('goals.name')}</label>
            <input id="goal-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder={masked ? t('goals.namePlaceholderMasked') : t('goals.namePlaceholder')} className="input" />
          </div>
          <div>
            <label htmlFor="goal-habit" className="block text-xs font-medium text-muted mb-1">{t('goals.habit')}</label>
            <select id="goal-habit" value={selectedHabitId} onChange={e => setNewHabitId(e.target.value)} className="input">
              {habits.map(h => <option key={h.id} value={h.id}>{habitIcon(h)} {habitName(h)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="goal-type" className="block text-xs font-medium text-muted mb-1">{t('goals.type')}</label>
            <select id="goal-type" value={newType} onChange={e => setNewType(e.target.value as GoalType)} className="input">
              {GOAL_TYPES.map(type => <option key={type} value={type}>{t(`goals.type.${type}`)}</option>)}
            </select>
            <p className="text-xs text-muted mt-1.5">{t(`goals.type.${newType}.desc`)}</p>
          </div>
          <div>
            <label htmlFor="goal-target" className="block text-xs font-medium text-muted mb-1">
              {t('goals.targetValue')} {newType === 'reduce_by_percent' ? t('goals.unit.percent') : newType === 'max_per_week' ? t('goals.unit.perWeek') : t('goals.unit.days')}
            </label>
            <input id="goal-target" type="number" value={newTarget} onChange={e => setNewTarget(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="input" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || !selectedHabitId}>{t('goals.set')}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
