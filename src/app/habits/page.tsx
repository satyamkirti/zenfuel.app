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

const CATEGORY_LABELS: Record<string, string> = {
  digital: 'Digital', adult: 'Adult', food: 'Food & Drink', substance: 'Substance', other: 'Other',
};

export default function HabitsPage() {
  const { habits, habitAnalytics, addHabit, updateHabit, deleteHabit, isPremium } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
              <Zap size={18} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Habit Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {habits.length} habits{!isPremium && ` / ${FREE_LIMIT} (free limit)`}
              </p>
            </div>
          </div>
          {atFreeLimit ? (
            <Link href="/upgrade" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow hover:shadow-amber-500/30 transition-all hover:scale-105">
              <Lock size={13} /> Upgrade for More
            </Link>
          ) : (
            <Button size="sm" icon={<Plus size={14} />} onClick={handleAddClick}>Add Habit</Button>
          )}
        </div>

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
                        {habit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{habit.name}</h3>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant={habit.isDefault ? 'purple' : 'default'}>{habit.isDefault ? 'Default' : 'Custom'}</Badge>
                          <Badge variant="default">{CATEGORY_LABELS[habit.category]}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingHabit(habit); setShowModal(true); }} className="p-1.5 rounded-lg btn-ghost"><Edit3 size={14} /></button>
                      {!habit.isDefault && (
                        <button onClick={() => handleDelete(habit.id)} className={`p-1.5 rounded-lg transition-colors ${confirmDeleteId === habit.id ? 'bg-red-100 dark:bg-red-500/20 text-red-600' : 'btn-ghost text-slate-400 hover:text-red-500'}`}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {ha && ha.lifetimeCount > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div><p className="text-xs text-slate-400">Total</p><p className="text-lg font-bold text-slate-900 dark:text-white">{ha.lifetimeCount}</p></div>
                      <div><p className="text-xs text-slate-400">This Month</p><p className="text-lg font-bold text-slate-900 dark:text-white">{ha.monthCount}</p></div>
                      <div>
                        <p className="text-xs text-slate-400">Streak</p>
                        <p className={`text-lg font-bold ${ha.streak.currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`}>{ha.streak.currentStreak}d</p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 flex items-center gap-1"><BarChart2 size={11} /> No events logged yet</p>
                    </div>
                  )}
                  {confirmDeleteId === habit.id && (
                    <p className="mt-2 text-xs text-red-500 text-center">Click delete again to confirm</p>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Add habit placeholder card */}
          {!atFreeLimit && (
            <button onClick={handleAddClick} className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400">
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
