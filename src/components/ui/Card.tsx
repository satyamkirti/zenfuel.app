import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-5 sm:p-6' };
  return (
    <div className={clsx(
      'min-w-0 rounded-[22px] border border-line bg-surface shadow-card',
      hover && 'hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 cursor-pointer',
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

export function CardHeader({ title, icon, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center gap-3 px-5 pt-5 pb-4', className)}>
      {icon && (
        <span className="w-9 h-9 shrink-0 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-teal-300 flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-ink tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
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
    <div className={clsx('min-w-0 rounded-[20px] border border-line bg-surface p-4 sm:p-[18px] shadow-card flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-muted uppercase tracking-[0.08em] truncate">{label}</span>
        {icon && <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-teal-300 flex items-center justify-center shrink-0" aria-hidden="true">{icon}</span>}
      </div>
      <span className={clsx('text-[28px] sm:text-[30px] leading-none font-bold tracking-tight tabular-nums truncate', accent ? 'text-brand-text' : 'text-ink')}>
        {value}
      </span>
      {subValue && <span className="text-[11px] text-muted truncate">{subValue}</span>}
    </div>
  );
}
