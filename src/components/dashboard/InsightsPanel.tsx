'use client';

import { Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '@/context/AppContext';
import { usePrivacy } from '@/context/PrivacyContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/i18n/translate';

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
      <CardHeader icon={<Lightbulb size={17} />} tone="amber" title={t('insightsPanel.title')} subtitle={t('insightsPanel.sub')} />
      <ul className="px-5 pb-5 space-y-2">
        {insights.map(insight => (
          <li key={insight.id} className="relative flex items-start gap-3 text-sm rounded-xl bg-surface-2/60 pl-4 pr-3 py-2.5 overflow-hidden">
            <span className={clsx('absolute left-0 inset-y-0 w-1', typeDot[insight.type])} aria-hidden="true" />
            <span className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-base leading-none shrink-0 shadow-sm" aria-hidden="true">{maskText(insight.icon)}</span>
            <p className="flex-1 self-center leading-5 text-ink-2">{maskText(insight.message)}</p>
          </li>
        ))}
        {insights.length === 0 && (
          <li className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">{t('insightsPanel.empty')}</li>
        )}
      </ul>
    </Card>
  );
}
