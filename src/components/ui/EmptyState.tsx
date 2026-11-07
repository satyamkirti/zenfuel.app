import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

// One friendly empty state for lists and pages with nothing to show yet.
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <span className="w-12 h-12 rounded-2xl bg-blue-600/10 text-brand-text flex items-center justify-center" aria-hidden="true">{icon}</span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
