import { ReactNode, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

// Hierarchy: primary (one per area) > secondary/outline > ghost. Danger only for destructive steps.
const variants = {
  primary: 'bg-brand-gradient hover:bg-brand-gradient-hover text-on-brand shadow-glow font-semibold',
  secondary: 'bg-brand-soft hover:brightness-[0.97] dark:hover:brightness-110 text-brand-text font-semibold ring-1 ring-inset ring-brand/15',
  ghost: 'hover:bg-surface-2 text-ink-2 hover:text-ink',
  danger: 'bg-bad hover:opacity-90 active:opacity-80 text-white dark:text-charcoal-950 shadow-sm font-semibold',
  outline: 'border border-line-strong bg-surface dark:bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-3 text-ink shadow-sm font-semibold',
};

const sizes = {
  xs: 'h-8 px-2.5 text-xs rounded-lg gap-1',
  sm: 'min-h-[36px] px-3 text-sm rounded-xl gap-1.5',
  md: 'min-h-[40px] px-4 text-sm rounded-xl gap-2',
  lg: 'min-h-[46px] px-5 text-[15px] rounded-2xl gap-2',
  xl: 'min-h-[54px] px-6 text-base rounded-2xl gap-2.5',
};

export function Button({ variant = 'primary', size = 'md', icon, loading, children, className, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150 active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
