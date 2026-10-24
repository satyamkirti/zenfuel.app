'use client';

import { useEffect, useState } from 'react';
import { Trophy, Play, Square, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Challenge } from '@/types';
import { computeChallengeProgress } from '@/utils/challenges';
import { Modal } from '@/components/ui/Modal';
import { usePrivacy } from '@/context/PrivacyContext';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ChallengesPage() {
  const { challenges, habits, entries, startChallenge, stopChallenge, completeChallenge, addChallenge } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHabitId, setNewHabitId] = useState(habits[0]?.id ?? '');
  const [newDays, setNewDays] = useState(7);
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);
  const { challengeName, challengeDescription, habitName, habitIcon, masked } = usePrivacy();

  // Habits load after the first render (e.g. on a hard refresh); fall back to the first habit.
  const selectedHabitId = newHabitId === 'all' || habits.some(h => h.id === newHabitId) ? newHabitId : habits[0]?.id ?? 'all';

  useEffect(() => {
    if (!confirmStopId) return;
    const t = setTimeout(() => setConfirmStopId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmStopId]);

  const handleStop = (id: string) => {
    if (confirmStopId === id) { stopChallenge(id); setConfirmStopId(null); }
    else setConfirmStopId(id);
  };

  const habitMap = new Map(habits.map(h => [h.id, h]));
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

  const ChallengeCard = ({ c }: { c: Challenge }) => {
    const progress = computeChallengeProgress(c, entries);
    const habit = c.habitId === 'all' ? null : habitMap.get(c.habitId);

    return (
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
            {habit ? habitIcon(habit) : masked ? '🏁' : '🧠'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink break-words">{challengeName(c)}</h3>
              {c.isBuiltIn && <Badge variant="purple">Built-in</Badge>}
              {c.isActive && (
                progress.isViolated
                  ? <Badge variant="danger">Violated</Badge>
                  : <Badge variant="success">Active</Badge>
              )}
              {c.isCompleted && <Badge variant="success">Completed ✓</Badge>}
            </div>
            <p className="text-xs text-muted mt-0.5">{challengeDescription(c)}</p>
            <p className="text-xs text-muted mt-0.5">
              {c.habitId === 'all' ? 'All Habits' : habitName(habit, c.habitId)} · {c.durationDays} days
            </p>
          </div>
        </div>

        {c.isActive && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">{progress.daysDone} / {c.durationDays} days</span>
              <span className={progress.isViolated ? 'text-red-500' : 'text-emerald-500'}>{progress.percentage}%</span>
            </div>
            <div className="track">
              <div
                className={`h-full rounded-full ${progress.isViolated ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, progress.percentage)}%` }}
              />
            </div>
            {progress.isViolated && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Violated on {progress.violationDate}
              </p>
            )}
            {!progress.isViolated && progress.percentage >= 100 && (
              <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Challenge completed!
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!c.isActive && !c.isCompleted && (
            <Button size="sm" variant="secondary" icon={<Play size={13} />} onClick={() => startChallenge(c.id)}>Start</Button>
          )}
          {c.isActive && (
            <>
              {progress.percentage >= 100 && !progress.isViolated && (
                <Button size="sm" variant="secondary" icon={<CheckCircle2 size={13} />} onClick={() => completeChallenge(c.id)}>Mark Complete</Button>
              )}
              <Button size="sm" variant={confirmStopId === c.id ? 'danger' : 'outline'} icon={<Square size={13} />} onClick={() => handleStop(c.id)}>
                {confirmStopId === c.id ? 'Stop and lose progress?' : 'Stop'}
              </Button>
            </>
          )}
          {c.isCompleted && (
            <Button size="sm" variant="outline" icon={<Play size={13} />} onClick={() => startChallenge(c.id)}>Restart</Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <AppLayout title="Challenges">
      <div className="space-y-6">
        <PageHeader
          title="Challenges"
          description={`${active.length} active · ${completed.length} completed`}
          actions={<Button size="sm" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>Create challenge</Button>}
        />

        {active.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Active</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map(c => <ChallengeCard key={c.id} c={c} />)}
            </div>
          </div>
        )}

        {available.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Available</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {available.map(c => <ChallengeCard key={c.id} c={c} />)}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Completed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completed.map(c => <ChallengeCard key={c.id} c={c} />)}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Create Custom Challenge" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="challenge-name" className="block text-xs font-medium text-muted mb-1">Challenge Name</label>
            <input id="challenge-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. 14-Day Social Media Break" className="input" />
          </div>
          <div>
            <label htmlFor="challenge-desc" className="block text-xs font-medium text-muted mb-1">Description</label>
            <input id="challenge-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." className="input" />
          </div>
          <div>
            <label htmlFor="challenge-habit" className="block text-xs font-medium text-muted mb-1">Habit</label>
            <select id="challenge-habit" value={selectedHabitId} onChange={e => setNewHabitId(e.target.value)} className="input">
              <option value="all">All Habits</option>
              {habits.map(h => <option key={h.id} value={h.id}>{habitIcon(h)} {habitName(h)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="challenge-days" className="block text-xs font-medium text-muted mb-1">Duration (days)</label>
            <input id="challenge-days" type="number" value={newDays} onChange={e => setNewDays(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={365} className="input" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>Create Challenge</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
