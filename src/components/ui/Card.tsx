import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div className={clsx(
      'bg-surface border border-line rounded-2xl shadow-card',
      hover && 'hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors cursor-pointer',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// Consistent title row for cards: small icon, title, optional supporting line and action.
export function CardHeader({ title, icon, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start gap-3 px-5 pt-5 pb-3', className)}>
      {icon && <span className="mt-0.5 shrink-0 text-muted" aria-hidden="true">{icon}</span>}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  accent?: boolean;
  className?: string;
}

export function StatCard({ label, value, subValue, icon, accent, className }: StatCardProps) {
  return (
    <div className={clsx('bg-surface border border-line rounded-2xl shadow-card p-4 flex flex-col gap-1 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted truncate">{label}</span>
        {icon && <span className="text-muted shrink-0" aria-hidden="true">{icon}</span>}
      </div>
      <span className={clsx('text-2xl font-semibold tracking-tight tabular-nums truncate', accent ? 'text-brand-text' : 'text-ink')}>
        {value}
      </span>
      {subValue && <span className="text-xs text-muted truncate">{subValue}</span>}
    </div>
  );
}
