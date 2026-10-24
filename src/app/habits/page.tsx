'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Zap, BarChart2, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HabitModal } from '@/components/habits/HabitModal';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { Habit } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PageHeader } from '@/components/ui/PageHeader';

const CATEGORY_LABELS: Record<string, string> = {
  digital: 'Digital', adult: 'Adult', food: 'Food & Drink', substance: 'Substance', other: 'Other',
};

export default function HabitsPage() {
  const { habits, habitAnalytics, addHabit, updateHabit, deleteHabit, isPremium } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { habitName, habitIcon, masked } = usePrivacy();

  const analyticsMap = new Map(habitAnalytics.map(h => [h.habitId, h]));
  const FREE_LIMIT = 3;
  const atFreeLimit = !isPremium && habits.length >= FREE_LIMIT;

  const handleSave = (data: Omit<Habit, 'id' | 'isDefault' | 'createdAt'>) => {
    if (editingHabit) { updateHabit(editingHabit.id, data); }
    else { addHabit(data); }
    setEditingHabit(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) { deleteHabit(id); setConfirmDeleteId(null); }
    else { setConfirmDeleteId(id); setTimeout(() => setConfirmDeleteId(null), 3000); }
  };

  const handleAddClick = () => {
    if (atFreeLimit) return;
    setEditingHabit(null);
    setShowModal(true);
  };

  return (
    <AppLayout title="Habits">
      <div className="space-y-5">
        <PageHeader
          title="Habits"
          description={`${habits.length} habits tracked${!isPremium ? ` · ${FREE_LIMIT} on the free plan` : ''}`}
          actions={atFreeLimit ? (
            <Link href="/upgrade" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow hover:shadow-amber-500/30 transition-all hover:scale-105">
              <Lock size={13} /> Upgrade for More
            </Link>
          ) : (
            <Button size="sm" icon={<Plus size={15} />} onClick={handleAddClick}>Add habit</Button>
          )}
        />

        {atFreeLimit && (
          <UpgradeBanner
            message={`Free plan is limited to ${FREE_LIMIT} habits. You've reached the limit.`}
            cta="Upgrade to add unlimited habits"
            variant="prominent"
            dismissKey="habits-limit"
          />
        )}

        {!isPremium && !atFreeLimit && habits.length > 0 && (
          <UpgradeBanner
            message={`Free plan: ${habits.length}/${FREE_LIMIT} habits used. Upgrade to track unlimited habits.`}
            dismissKey="habits-counter"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => {
            const ha = analyticsMap.get(habit.id);
            return (
              <Card key={habit.id} padding="none">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: habit.color + '20', border: `2px solid ${habit.color}33` }}>
                        <span aria-hidden="true">{habitIcon(habit)}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink truncate">{habitName(habit)}</h3>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant={habit.isDefault ? 'purple' : 'default'}>{habit.isDefault ? 'Default' : 'Custom'}</Badge>
                          {!masked && <Badge variant="default">{CATEGORY_LABELS[habit.category]}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingHabit(habit); setShowModal(true); }} aria-label={`Edit ${habitName(habit)}`} className="p-2 rounded-lg btn-ghost"><Edit3 size={15} aria-hidden="true" /></button>
                      {!habit.isDefault && (
                        <button onClick={() => handleDelete(habit.id)} aria-label={confirmDeleteId === habit.id ? `Confirm delete ${habitName(habit)}` : `Delete ${habitName(habit)}`} className={`p-2 rounded-lg transition-colors ${confirmDeleteId === habit.id ? 'bg-red-100 dark:bg-red-500/20 text-red-600' : 'btn-ghost text-muted hover:text-red-500'}`}>
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                  {ha && ha.lifetimeCount > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-line">
                      <div><p className="text-xs text-muted">Total</p><p className="text-lg font-bold text-ink">{ha.lifetimeCount}</p></div>
                      <div><p className="text-xs text-muted">This Month</p><p className="text-lg font-bold text-ink">{ha.monthCount}</p></div>
                      <div>
                        <p className="text-xs text-muted">Streak</p>
                        <p className={`text-lg font-bold ${ha.streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted'}`}>{ha.streak.currentStreak}d</p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-line">
                      <p className="text-xs text-muted flex items-center gap-1"><BarChart2 size={11} /> No events logged yet</p>
                    </div>
                  )}
                  {confirmDeleteId === habit.id && (
                    <p role="status" className="mt-2 text-xs text-red-500 text-center">Tap delete again to confirm. Logged entries are kept.</p>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Add habit placeholder card */}
          {!atFreeLimit && (
            <button onClick={handleAddClick} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-line rounded-xl hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all text-muted hover:text-violet-600 dark:hover:text-violet-400">
              <Plus size={24} />
              <span className="text-sm font-medium">Add Custom Habit</span>
            </button>
          )}

          {atFreeLimit && (
            <Link href="/upgrade" className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 hover:border-amber-400 transition-all text-amber-500">
              <Lock size={24} />
              <span className="text-sm font-medium">Upgrade to Add More</span>
              <span className="text-xs text-amber-400">Unlimited on Premium</span>
            </Link>
          )}
        </div>
      </div>

      {showModal && (
        <HabitModal habit={editingHabit} onClose={() => { setShowModal(false); setEditingHabit(null); }} onSave={handleSave} />
      )}
    </AppLayout>
  );
}
