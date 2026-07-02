'use client';

import { useState } from 'react';
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

  const habitMap = new Map(habits.map(h => [h.id, h]));
  const active = goals.filter(g => g.isActive);
  const inactive = goals.filter(g => !g.isActive);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addGoal({ name: newName.trim(), habitId: newHabitId, type: newType, targetValue: newTarget, startDate: formatDate(new Date()), isActive: true });
    setNewName(''); setShowAdd(false);
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progress = computeGoalProgress(goal, entries);
    const habit = habitMap.get(goal.habitId);
    const typeInfo = GOAL_TYPES.find(t => t.value === goal.type);

    return (
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: (habit?.color ?? '#8b5cf6') + '20' }}>
            {habit?.icon ?? '🎯'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-white">{goal.name}</h3>
              {progress.isAchieved && <Badge variant="success">Achieved ✓</Badge>}
              {!goal.isActive && <Badge variant="default">Inactive</Badge>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{habit?.name} · {typeInfo?.label} · Target: {goal.targetValue}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => updateGoal(goal.id, { isActive: !goal.isActive })} className="p-1.5 rounded-lg btn-ghost text-xs text-slate-400">
              {goal.isActive ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{progress.label}</span>
            <span className={progress.isAchieved ? 'text-emerald-500 font-semibold' : 'text-slate-500'}>{progress.percentage}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progress.isAchieved ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
        </div>

        {progress.isAchieved && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-2">
            <CheckCircle2 size={13} />
            Goal achieved! Set a new target to keep improving.
          </div>
        )}
      </Card>
    );
  };

  return (
    <AppLayout title="Goals">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Target size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Goals</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{active.length} active goal{active.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Set Goal</Button>
        </div>

        {goals.length === 0 && (
          <Card>
            <div className="text-center py-10 text-slate-400">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium">No goals set yet</p>
              <p className="text-sm mt-1">Set your first goal to start tracking progress</p>
              <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>Set First Goal</Button>
            </div>
          </Card>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Active Goals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}

        {inactive.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Paused Goals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inactive.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Set New Goal" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Goal Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Stay porn-free for 30 days" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Habit</label>
            <select value={newHabitId} onChange={e => setNewHabitId(e.target.value)} className="input">
              {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Goal Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value as GoalType)} className="input">
              {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.description}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Target Value {newType === 'reduce_by_percent' ? '(%)' : newType === 'max_per_week' ? '(sessions/week)' : '(days)'}
            </label>
            <input type="number" value={newTarget} onChange={e => setNewTarget(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="input" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>Set Goal</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
