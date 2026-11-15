import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Tone, TONE } from './Card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: Tone;
}

// One friendly empty state for lists and pages with nothing to show yet: a glowing icon badge,
// a short title and a next step.
export function EmptyState({ icon, title, description, action, tone = 'blue' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <span className="relative flex items-center justify-center" aria-hidden="true">
        <span className="absolute w-32 h-32 rounded-full glow-blue" />
        <span className={clsx('relative w-16 h-16 rounded-[20px] flex items-center justify-center ring-1 ring-inset ring-white/10 shadow-lift', TONE[tone].tile)}>{icon}</span>
      </span>
      <p className="mt-5 font-display text-[17px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 text-sm text-muted max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
