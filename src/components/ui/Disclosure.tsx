import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface DisclosureProps {
  title: ReactNode;
  /** One short line under the title, shown while closed. */
  hint?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** 'panel': bordered white box. 'plain': a quiet row with a top divider, for secondary text. */
  variant?: 'panel' | 'plain';
}

// Secondary content that people can open when they want it: explanations, extra charts, settings.
// A native <details> element, so it works with the keyboard and screen readers without script.
export function Disclosure({ title, hint, children, defaultOpen, className, variant = 'panel' }: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className={clsx(
        'group',
        variant === 'panel' ? 'panel overflow-hidden' : 'border-t border-line',
        className
      )}
    >
      <summary
        className={clsx(
          'flex cursor-pointer list-none select-none items-center justify-between gap-3 min-h-[56px] text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 [&::-webkit-details-marker]:hidden',
          variant === 'panel' ? 'px-5 py-3 hover:bg-surface-2/50' : 'py-3'
        )}
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-ink">{title}</span>
          {hint && <span className="block text-sm text-muted mt-0.5">{hint}</span>}
        </span>
        <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className={clsx(variant === 'panel' ? 'px-5 pb-5 pt-1' : 'pb-4')}>{children}</div>
    </details>
  );
}
