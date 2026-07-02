'use client';

import { Lightbulb } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';

const typeStyles = {
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300',
  positive: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
  neutral: 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
  warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300',
};

export function InsightsPanel() {
  const { insights } = useApp();
  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Lightbulb size={16} className="text-amber-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Smart Insights</h3>
      </div>
      <div className="p-4 grid gap-2.5">
        {insights.map(insight => (
          <div key={insight.id} className={clsx('flex items-start gap-3 p-3 rounded-lg border text-sm', typeStyles[insight.type])}>
            <span className="text-base leading-none mt-0.5 shrink-0">{insight.icon}</span>
            <p className="leading-snug">{insight.message}</p>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">
            Log habits to see personalized insights.
          </p>
        )}
      </div>
    </Card>
  );
}
