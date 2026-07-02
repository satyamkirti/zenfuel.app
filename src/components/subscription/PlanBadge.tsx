import { clsx } from 'clsx';
import { SubscriptionPlan } from '@/types/subscription';
import { Crown, Zap } from 'lucide-react';

interface PlanBadgeProps {
  plan: SubscriptionPlan;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const config: Record<SubscriptionPlan, { label: string; cls: string }> = {
  free:     { label: 'FREE',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600' },
  monthly:  { label: 'PREMIUM',  cls: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-500/40' },
  yearly:   { label: 'PREMIUM',  cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40' },
  lifetime: { label: 'LIFETIME', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40' },
};

const sizes = { xs: 'px-1.5 py-0.5 text-[9px] gap-0.5', sm: 'px-2 py-0.5 text-xs gap-1', md: 'px-3 py-1 text-sm gap-1.5' };

export function PlanBadge({ plan, size = 'sm', showIcon = true, className }: PlanBadgeProps) {
  const { label, cls } = config[plan];
  const isPaid = plan !== 'free';
  return (
    <span className={clsx('inline-flex items-center font-bold rounded-full tracking-wide', cls, sizes[size], className)}>
      {showIcon && isPaid && <Crown size={size === 'xs' ? 8 : 10} />}
      {label}
    </span>
  );
}

export function PremiumCrown({ size = 14, className }: { size?: number; className?: string }) {
  return <Crown size={size} className={clsx('text-amber-500', className)} />;
}
