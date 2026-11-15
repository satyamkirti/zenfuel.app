import { ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * The colourful icon system. Every tone is a coordinated pair of palette colours: a soft two-tone
 * tint with a coloured icon (`tile`), a vivid two-tone gradient with a white icon (`solid`), a
 * saturated gradient for metric cards (`card`, white text), and a matching text colour.
 *
 * Features always use the same tone (see FEATURE_TONE), so colour helps people find things:
 * Screen Time blue/cyan, Analytics blue/purple, Habits teal/green, Goals purple/blue, Challenges
 * orange/yellow, History pink/blue, Reports cyan/blue, Settings slate/blue, Notifications amber.
 */
export type Tone =
  | 'blue' | 'sky' | 'cyan' | 'indigo' | 'teal' | 'green' | 'emerald' | 'purple' | 'violet'
  | 'orange' | 'amber' | 'yellow' | 'pink' | 'rose' | 'red' | 'slate';

type ToneStyle = { tile: string; solid: string; card: string; strip: string; soft: string; text: string };

const BLUE: ToneStyle = {
  tile: 'bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600 dark:from-blue-500/30 dark:to-cyan-400/10 dark:text-blue-300',
  solid: 'from-blue-500 to-cyan-400',
  card: 'from-blue-500 via-blue-600 to-blue-800',
  strip: 'from-blue-500 to-cyan-400',
  soft: 'from-blue-50 to-surface dark:from-blue-500/10 dark:to-surface',
  text: 'text-blue-600 dark:text-blue-300',
};
const INDIGO: ToneStyle = {
  tile: 'bg-gradient-to-br from-blue-100 to-purple-100 text-purple-600 dark:from-blue-500/25 dark:to-purple-500/20 dark:text-purple-300',
  solid: 'from-blue-500 to-purple-500',
  card: 'from-blue-600 to-purple-600',
  strip: 'from-blue-500 to-purple-500',
  soft: 'from-purple-50 to-surface dark:from-purple-500/10 dark:to-surface',
  text: 'text-purple-600 dark:text-purple-300',
};
const CYAN: ToneStyle = {
  tile: 'bg-gradient-to-br from-cyan-100 to-blue-50 text-cyan-700 dark:from-cyan-400/25 dark:to-blue-500/10 dark:text-cyan-300',
  solid: 'from-cyan-400 to-blue-500',
  card: 'from-cyan-600 to-blue-700',
  strip: 'from-cyan-400 to-blue-500',
  soft: 'from-cyan-50 to-surface dark:from-cyan-400/10 dark:to-surface',
  text: 'text-cyan-700 dark:text-cyan-300',
};
const TEAL: ToneStyle = {
  tile: 'bg-gradient-to-br from-teal-100 to-green-50 text-teal-700 dark:from-teal-400/25 dark:to-green-400/10 dark:text-teal-300',
  solid: 'from-teal-400 to-green-500',
  card: 'from-green-600 via-teal-600 to-teal-700',
  strip: 'from-teal-400 to-green-500',
  soft: 'from-teal-50 to-surface dark:from-teal-400/10 dark:to-surface',
  text: 'text-teal-700 dark:text-teal-300',
};
const GREEN: ToneStyle = {
  tile: 'bg-gradient-to-br from-green-100 to-teal-50 text-green-700 dark:from-green-400/25 dark:to-teal-400/10 dark:text-green-300',
  solid: 'from-green-400 to-teal-500',
  card: 'from-green-600 to-teal-700',
  strip: 'from-green-400 to-teal-500',
  soft: 'from-green-50 to-surface dark:from-green-400/10 dark:to-surface',
  text: 'text-green-700 dark:text-green-300',
};
const PURPLE: ToneStyle = {
  tile: 'bg-gradient-to-br from-purple-100 to-violet-50 text-purple-600 dark:from-purple-500/30 dark:to-violet-500/10 dark:text-purple-300',
  solid: 'from-purple-500 to-violet-500',
  card: 'from-violet-500 via-purple-600 to-purple-800',
  strip: 'from-purple-500 to-violet-500',
  soft: 'from-purple-50 to-surface dark:from-purple-500/10 dark:to-surface',
  text: 'text-purple-600 dark:text-purple-300',
};
const VIOLET: ToneStyle = {
  tile: 'bg-gradient-to-br from-violet-100 to-blue-50 text-violet-600 dark:from-violet-500/30 dark:to-blue-500/10 dark:text-violet-300',
  solid: 'from-violet-500 to-blue-500',
  card: 'from-violet-600 to-blue-700',
  strip: 'from-violet-500 to-blue-500',
  soft: 'from-violet-50 to-surface dark:from-violet-500/10 dark:to-surface',
  text: 'text-violet-600 dark:text-violet-300',
};
const ORANGE: ToneStyle = {
  tile: 'bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-600 dark:from-orange-500/25 dark:to-yellow-400/10 dark:text-orange-300',
  solid: 'from-yellow-400 to-orange-500',
  card: 'from-orange-500 via-orange-600 to-orange-700',
  strip: 'from-yellow-400 to-orange-500',
  soft: 'from-orange-50 to-surface dark:from-orange-500/10 dark:to-surface',
  text: 'text-orange-700 dark:text-orange-300',
};
const AMBER: ToneStyle = {
  tile: 'bg-gradient-to-br from-yellow-100 to-orange-50 text-yellow-700 dark:from-yellow-400/25 dark:to-orange-500/10 dark:text-yellow-300',
  solid: 'from-yellow-400 to-orange-500',
  card: 'from-yellow-600 to-orange-700',
  strip: 'from-yellow-400 to-orange-500',
  soft: 'from-yellow-50 to-surface dark:from-yellow-400/10 dark:to-surface',
  text: 'text-yellow-700 dark:text-yellow-300',
};
const PINK: ToneStyle = {
  tile: 'bg-gradient-to-br from-pink-100 to-blue-50 text-pink-600 dark:from-pink-500/25 dark:to-blue-500/10 dark:text-pink-300',
  solid: 'from-pink-500 to-blue-500',
  card: 'from-pink-600 to-blue-700',
  strip: 'from-pink-500 to-blue-500',
  soft: 'from-pink-50 to-surface dark:from-pink-500/10 dark:to-surface',
  text: 'text-pink-600 dark:text-pink-300',
};
const RED: ToneStyle = {
  tile: 'bg-gradient-to-br from-red-100 to-pink-50 text-red-600 dark:from-red-500/25 dark:to-pink-500/10 dark:text-red-300',
  solid: 'from-red-500 to-pink-500',
  card: 'from-red-600 to-pink-700',
  strip: 'from-red-500 to-pink-500',
  soft: 'from-red-50 to-surface dark:from-red-500/10 dark:to-surface',
  text: 'text-bad',
};
const SLATE: ToneStyle = {
  tile: 'bg-gradient-to-br from-slate-100 to-blue-100 text-slate-600 dark:from-slate-700 dark:to-blue-500/15 dark:text-slate-300',
  solid: 'from-slate-500 to-blue-600',
  card: 'from-slate-600 to-blue-800',
  strip: 'from-slate-400 to-blue-500',
  soft: 'from-surface-2 to-surface',
  text: 'text-ink-2',
};

export const TONE: Record<Tone, ToneStyle> = {
  blue: BLUE,
  sky: CYAN,
  cyan: CYAN,
  indigo: INDIGO,
  teal: TEAL,
  green: GREEN,
  emerald: GREEN,
  purple: PURPLE,
  violet: VIOLET,
  orange: ORANGE,
  amber: AMBER,
  yellow: AMBER,
  pink: PINK,
  rose: RED,
  red: RED,
  slate: SLATE,
};

/** One tone per feature, used wherever that feature's icon appears. */
export const FEATURE_TONE = {
  home: 'blue',
  screenTime: 'blue',
  analytics: 'indigo',
  habits: 'teal',
  goals: 'violet',
  challenges: 'orange',
  history: 'pink',
  reports: 'cyan',
  settings: 'slate',
  notifications: 'amber',
  privacy: 'purple',
  security: 'green',
  data: 'cyan',
  appearance: 'yellow',
} as const satisfies Record<string, Tone>;

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** default: layered card · tinted: soft neutral fill · outline: hairline only, no shadow. */
  variant?: 'default' | 'tinted' | 'outline';
  /** Colour of the accent strip (and of the wash for `tinted`). */
  tone?: Tone;
  /** Kept for compatibility; cards no longer draw a coloured top strip. */
  accent?: boolean;
}

export function Card({ children, className, hover, padding = 'md', variant = 'default', tone = 'blue', accent }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div className={clsx(
      'relative border border-line rounded-card',
      variant === 'tinted' ? 'bg-surface-2 border-transparent' : variant === 'outline' ? 'bg-surface' : 'bg-surface shadow-card',
      hover && 'hover:border-line-strong hover:shadow-lift hover:-translate-y-0.5 transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 cursor-pointer',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  );
}

/** Icon in a soft rounded square in the given tone. */
export function IconTile({ children, tone = 'blue', size = 'md', solid, className }: { children: ReactNode; tone?: Tone; size?: 'sm' | 'md' | 'lg'; solid?: boolean; className?: string }) {
  const sizes = { sm: 'w-8 h-8 rounded-lg', md: 'w-9 h-9 rounded-xl', lg: 'w-11 h-11 rounded-2xl' };
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center shrink-0',
        sizes[size],
        solid ? clsx('bg-gradient-to-br text-white shadow-sm ring-1 ring-inset ring-white/20', TONE[tone].solid) : TONE[tone].tile,
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Colour of the icon tile. */
  tone?: Tone;
}

// Consistent title row for cards: optional icon tile, title, supporting line and action.
export function CardHeader({ title, subtitle, action, className, icon, tone = 'teal' }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start gap-3 px-5 pt-5 pb-3', className)}>
      {icon && <IconTile tone={tone} size="md" className="self-center">{icon}</IconTile>}
      <div className="flex-1 min-w-0 self-center">
        <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}

/**
 * A headline number: label, large tabular value, optional supporting line. `gradient` makes it a
 * colourful summary card: the tone's saturated gradient, white type, and soft decorative light.
 */
export function MetricCard({ label, value, sub, icon, tone = 'blue', className, gradient }: MetricCardProps & { gradient?: boolean }) {
  if (gradient) {
    return (
      <div className={clsx('relative overflow-hidden rounded-card bg-gradient-to-br text-white shadow-lift ring-1 ring-inset ring-white/15 p-4 sm:p-5 min-w-0', TONE[tone].card, className)}>
        {/* Decoration: two soft circles of light and the icon, large and faint, in the corner. */}
        <span className="pointer-events-none absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/[0.13]" aria-hidden="true" />
        <span className="pointer-events-none absolute right-6 -bottom-12 w-24 h-24 rounded-full bg-white/[0.08]" aria-hidden="true" />
        {icon && <span className="pointer-events-none absolute right-3 bottom-2 text-white/[0.16] [&>svg]:w-14 [&>svg]:h-14" aria-hidden="true">{icon}</span>}
        <div className="relative flex items-center justify-between gap-2">
          <dt className="text-sm font-semibold text-white/95 truncate">{label}</dt>
          {icon && <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 ring-1 ring-inset ring-white/25 text-white" aria-hidden="true">{icon}</span>}
        </div>
        <dd className="relative mt-2.5 font-display text-[30px] sm:text-[32px] leading-none font-extrabold tracking-tight tabular-nums [text-shadow:0_1px_10px_rgb(0_0_0/0.15)]">{value}</dd>
        {sub && <dd className="relative mt-2 text-xs font-medium text-white/90 truncate">{sub}</dd>}
      </div>
    );
  }
  return (
    <div className={clsx('rounded-card border border-line bg-surface shadow-card p-4 sm:p-5 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-sm font-medium text-muted truncate">{label}</dt>
        {icon && <IconTile tone={tone} size="sm">{icon}</IconTile>}
      </div>
      <dd className="mt-2.5 font-display text-[28px] sm:text-[30px] leading-none font-bold tracking-tight tabular-nums text-ink">{value}</dd>
      {sub && <dd className="mt-2 text-xs text-muted truncate">{sub}</dd>}
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
  tone?: Tone;
}

export function StatCard({ label, value, subValue, icon, accent, className, tone = 'blue' }: StatCardProps) {
  return (
    <div className={clsx('bg-surface border border-line rounded-card shadow-card p-4 flex flex-col gap-1 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted truncate">{label}</span>
        {icon && <IconTile tone={tone} size="sm">{icon}</IconTile>}
      </div>
      <span className={clsx('font-display text-2xl font-bold tracking-tight tabular-nums truncate', accent ? 'text-brand-text' : 'text-ink')}>
        {value}
      </span>
      {subValue && <span className="text-xs text-muted truncate">{subValue}</span>}
    </div>
  );
}
