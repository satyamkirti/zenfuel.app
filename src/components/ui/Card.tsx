import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div className={clsx(
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl',
      hover && 'hover:border-violet-400 dark:hover:border-violet-500 transition-colors cursor-pointer',
      paddings[padding],
      className
    )}>
      {children}
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
    <div className={clsx(
      'bg-white dark:bg-slate-800 border rounded-xl p-4 flex flex-col gap-1',
      accent
        ? 'border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5'
        : 'border-slate-200 dark:border-slate-700',
      className
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <span className={clsx(
        'text-2xl font-bold',
        accent ? 'text-violet-700 dark:text-violet-400' : 'text-slate-900 dark:text-white'
      )}>
        {value}
      </span>
      {subValue && <span className="text-xs text-slate-400 dark:text-slate-500">{subValue}</span>}
    </div>
  );
}
