import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  /** 'purple' is kept as an alias of 'brand' for older call sites. */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'teal' | 'purple';
  size?: 'sm' | 'md';
}

const brand = 'bg-brand-soft text-brand-text ring-brand/20';

const variants = {
  default: 'bg-surface-2 text-ink-2 ring-line',
  success: 'bg-good-soft text-good ring-good/20',
  warning: 'bg-warn-soft text-warn ring-warn/25',
  danger: 'bg-bad-soft text-bad ring-bad/20',
  info: 'bg-info-soft text-info ring-info/20',
  teal: brand,
  brand,
  purple: 'bg-purple-50 text-purple-700 ring-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-semibold rounded-full ring-1 ring-inset whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      variants[variant]
    )}>
      {children}
    </span>
  );
}
