'use client';

import { Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';

// A coloured dot carries the tone; the text stays in normal ink for readability.
const typeDot = {
  info: 'bg-sky-500',
  positive: 'bg-emerald-500',
  neutral: 'bg-slate-400',
  warning: 'bg-amber-500',
};

export function InsightsPanel() {
  const { insights } = useApp();
  const { maskText } = usePrivacy();
  return (
    <Card padding="none">
      <CardHeader icon={<Lightbulb size={16} />} title="Insights" subtitle="Rule-based observations from your own logs" />
      <ul className="px-5 pb-5 space-y-2.5">
        {insights.map(insight => (
          <li key={insight.id} className="flex items-start gap-3 text-sm">
            <span className="text-base leading-5 shrink-0" aria-hidden="true">{maskText(insight.icon)}</span>
            <p className="flex-1 leading-5 text-ink-2">{maskText(insight.message)}</p>
            <span className={clsx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', typeDot[insight.type])} aria-hidden="true" />
          </li>
        ))}
        {insights.length === 0 && (
          <li className="text-sm text-muted py-2">Log a few events to see observations here.</li>
        )}
      </ul>
    </Card>
  );
}
