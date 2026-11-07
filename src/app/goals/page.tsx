'use client';

import { useEffect, useState } from 'react';
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

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  { value: 'max_per_week', label: 'Max per week', description: 'Limit sessions to N per week' },
  { value: 'streak_days', label: 'Streak (days)', description: 'Stay free for N consecutive days' },
  { value: 'free_for_days', label: 'Free for days', description: 'Same as streak — no events for N days' },
  { value: 'reduce_by_percent', label: 'Reduce by %', description: 'Cut events by N% vs last month' },
];

export default function GoalsPage() {
  const { goals, habits, entries, addGoal, updateGoal, deleteGoal } = useApp();
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
    const t = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDeleteId]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) { deleteGoal(id); setConfirmDeleteId(null); }
    else setConfirmDeleteId(id);
  };

  const habitMap = new Map(habits.map(h => [h.id, h]));
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
    const typeInfo = GOAL_TYPES.find(t => t.value === goal.type);

    return (
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
            {habit ? habitIcon(habit) : '🎯'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink break-words">{goalName(goal)}</h3>
              {progress.isAchieved && <Badge variant="success">Achieved ✓</Badge>}
              {!goal.isActive && <Badge variant="default">Inactive</Badge>}
            </div>
            <p className="text-xs text-muted mt-0.5">{habitName(habit, goal.habitId)} · {typeInfo?.label} · Target: {goal.targetValue}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => updateGoal(goal.id, { isActive: !goal.isActive })} className="min-h-[36px] px-2.5 rounded-lg btn-ghost text-xs font-medium">
              {goal.isActive ? 'Pause' : 'Resume'}
            </button>
            {confirmDeleteId === goal.id ? (
              <button onClick={() => handleDelete(goal.id)} aria-label="Confirm delete goal" className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                <Trash2 size={13} aria-hidden="true" /> Delete?
              </button>
            ) : (
              <button onClick={() => handleDelete(goal.id)} aria-label="Delete goal" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors">
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
              className={`h-full rounded-full transition-all ${progress.isAchieved ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
        </div>

        {progress.isAchieved && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} aria-hidden="true" />
            Goal achieved! Set a new target to keep improving.
          </div>
        )}
      </Card>
    );
  };

  return (
    <AppLayout title="Goals">
      <div className="space-y-6">
        <PageHeader
          title="Goals"
          description={`${active.length} active goal${active.length !== 1 ? 's' : ''} · progress updates as you log`}
          actions={<Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Set Goal</Button>}
        />

        {goals.length === 0 && (
          <Card padding="none">
            <EmptyState
              icon={<Target size={22} />}
              title="No goals set yet"
              description="Choose a habit and a target, such as a weekly limit or a streak. Progress is worked out from your logs."
              action={<Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>Set your first goal</Button>}
            />
          </Card>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Active Goals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}

        {inactive.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Paused Goals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inactive.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Set New Goal" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-xs font-medium text-muted mb-1">Goal Name</label>
            <input id="goal-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder={masked ? 'e.g. Personal goal' : 'e.g. Stay porn-free for 30 days'} className="input" />
          </div>
          <div>
            <label htmlFor="goal-habit" className="block text-xs font-medium text-muted mb-1">Habit</label>
            <select id="goal-habit" value={selectedHabitId} onChange={e => setNewHabitId(e.target.value)} className="input">
              {habits.map(h => <option key={h.id} value={h.id}>{habitIcon(h)} {habitName(h)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="goal-type" className="block text-xs font-medium text-muted mb-1">Goal Type</label>
            <select id="goal-type" value={newType} onChange={e => setNewType(e.target.value as GoalType)} className="input">
              {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p className="text-xs text-muted mt-1.5">{GOAL_TYPES.find(t => t.value === newType)?.description}</p>
          </div>
          <div>
            <label htmlFor="goal-target" className="block text-xs font-medium text-muted mb-1">
              Target Value {newType === 'reduce_by_percent' ? '(%)' : newType === 'max_per_week' ? '(sessions/week)' : '(days)'}
            </label>
            <input id="goal-target" type="number" value={newTarget} onChange={e => setNewTarget(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="input" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || !selectedHabitId}>Set Goal</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
